import { useState, useEffect } from 'react';
import { supabase } from './supabase/client';
import { OnboardingFlow } from './components/OnboardingFlow';
import { HomePage } from './components/HomePage';
import { ShoppingListDetail } from './components/ShoppingListDetail';
import { TimelineView } from './components/TimelineView';
// import { GroupShopping } from './components/GroupShopping';
import { LiveShopping } from './components/LiveShopping';
import { TripSettings } from './components/TripSettings';
import { AddItemModal } from './components/AddItemModal';
import { joinTrip } from './utils/db-service';
import { useShoppingPlan } from './hooks/useShoppingPlan';
import { convertToKRW, fetchExchangeRates } from './utils/currency-service';
import type { Screen, TravelInfo, ShoppingPlan, ShoppingLocation, ShoppingItem } from './types';


export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null);
  const {
    shoppingPlan,
    setShoppingPlan,
    handleItemPurchase,
    handleAddItem,
    handleEditItem,
    handleDeleteItem
  } = useShoppingPlan(null);
  const [selectedLocation, setSelectedLocation] = useState<ShoppingLocation | null>(null);
  // const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ item: ShoppingItem; locationId: string } | null>(null);
  // Handle Auth and Load Data
  useEffect(() => {
    // Fetch exchange rates
    fetchExchangeRates();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        signInAnonymously();
      }
    }).catch(err => {
      console.warn('Session check failed (storage blocked?):', err);
      // Try signing in anyway, or just proceed without session
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      // Session state is handled by Supabase client internally for now
    });

    return () => subscription.unsubscribe();
  }, []);

  // Prevent default browser behavior globally (opening files in new tab)
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('drop', handleGlobalDrop);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  // Force re-render and recalculate prices when exchange rates are updated
  const [_, setTick] = useState(0);
  useEffect(() => {
    const handleRatesUpdate = () => {
      setTick(t => t + 1);

      // Recalculate prices in shoppingPlan
      setShoppingPlan((prevPlan) => {
        if (!prevPlan) return null;

        const newPlan = JSON.parse(JSON.stringify(prevPlan)); // Deep clone

        const updateLocationPrices = (location: ShoppingLocation) => {
          let locSubtotal = 0;
          location.items.forEach(item => {
            if (item.localPrice && item.currencyCode) {
              item.estimatedPrice = convertToKRW(item.localPrice, item.currencyCode);
            }
            locSubtotal += item.estimatedPrice;
          });
          location.subtotal = locSubtotal;
        };

        // Update Duty Free
        updateLocationPrices(newPlan.dutyFree.departure);
        updateLocationPrices(newPlan.dutyFree.arrival);

        // Update City Shopping
        Object.values(newPlan.cityShopping).forEach((loc: any) => {
          updateLocationPrices(loc);
        });

        // Update Budget Summary
        const dutyFreeTotal = newPlan.dutyFree.departure.subtotal + newPlan.dutyFree.arrival.subtotal;
        const cityShoppingTotal = Object.values(newPlan.cityShopping).reduce((sum: number, loc: any) => sum + loc.subtotal, 0);

        newPlan.budgetSummary = {
          dutyFree: dutyFreeTotal,
          cityShopping: cityShoppingTotal,
          total: dutyFreeTotal + cityShoppingTotal,
          remaining: travelInfo ? travelInfo.budget - (dutyFreeTotal + cityShoppingTotal) : 0
        };

        return newPlan;
      });
    };
    window.addEventListener('exchange-rates-updated', handleRatesUpdate);
    return () => window.removeEventListener('exchange-rates-updated', handleRatesUpdate);
  }, [travelInfo]); // Add travelInfo dependency for budget calculation

  // Sync shopping plan with travel schedule to ensure all cities appear
  useEffect(() => {
    if (!travelInfo || !shoppingPlan) return;

    let hasChanges = false;
    const newPlan = JSON.parse(JSON.stringify(shoppingPlan));

    travelInfo.schedule?.forEach(s => {
      const cities = s.location.split(/[,/·&+|]+/).map(c => c.trim()).filter(Boolean);
      cities.forEach(city => {
        // Check if this city exists in plan for this day (fuzzy match)
        const exists = Object.values(newPlan.cityShopping).some((loc: any) =>
          loc.day === s.day && (loc.location.includes(city) || city.includes(loc.location))
        );

        if (!exists) {
          // Create a deterministic ID to prevent duplicate creation on re-renders
          // Remove special characters from city name for ID
          const safeCityName = city.replace(/[^a-zA-Z0-9가-힣]/g, '');
          const newId = `day_${s.day}_${safeCityName}`;

          // Double check if this specific ID already exists (to be safe)
          if (!newPlan.cityShopping[newId]) {
            newPlan.cityShopping[newId] = {
              id: newId,
              location: city,
              day: s.day,
              timing: '여행 중',
              items: [],
              subtotal: 0
            };
            hasChanges = true;
          }
        }
      });
    });

    if (hasChanges) {
      console.log('Syncing shopping plan with schedule: Added missing cities');
      setShoppingPlan(newPlan);
      localStorage.setItem('shoppingPlan', JSON.stringify(newPlan));
    }
  }, [travelInfo, shoppingPlan]);

  async function signInAnonymously() {
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error('Error signing in anonymously:', error);
        alert(`게스트 로그인 실패: ${error.message}\n(Supabase 설정에서 'Allow new users to sign up'이 켜져 있는지 확인해주세요)`);
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  }

  const handleOnboardingComplete = (info: TravelInfo, plan: ShoppingPlan) => {
    setTravelInfo(info);
    setShoppingPlan(plan);
    // LocalStorage backup (optional, but good for persistence across refresh if DB fails)
    try {
      localStorage.setItem('travelInfo', JSON.stringify(info));
      localStorage.setItem('shoppingPlan', JSON.stringify(plan));
    } catch (e) {
      console.warn('LocalStorage access denied:', e);
    }
    setCurrentScreen('home');
  };

  const handleLocationSelect = (location: ShoppingLocation) => {
    setSelectedLocation(location);
    setCurrentScreen('detail');
  };



  // Realtime Subscription
  useEffect(() => {
    if (!travelInfo || !shoppingPlan) return;

    // Assuming we have a currentTripId stored or passed. 
    // For MVP, we'll fetch the latest trip ID for the user if not available.
    // This is a simplification. In a real app, we'd have a proper Trip Context.
    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: trips } = await supabase
        .from('trips')
        .select('id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (trips && trips[0]) {
        const tripId = trips[0].id;
        const subscription = supabase
          .channel(`trip-${tripId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'shopping_items',
              filter: `trip_id=eq.${tripId}`,
            },
            (payload) => {
              // console.log('Realtime update:', payload);
              // Refresh data or update local state optimistically
              // For simplicity, we'll just log it here. 
              // To fully sync, we'd need to re-fetch or patch the shoppingPlan state.
              if (payload.eventType === 'UPDATE' && shoppingPlan) {
                const newItem = payload.new as any;
                setShoppingPlan(prev => {
                  if (!prev) return null;
                  const next = { ...prev };
                  // Helper to update item in structure
                  const updateInLocation = (items: ShoppingItem[]) => {
                    const idx = items.findIndex(i => i.id === newItem.id || i.product === newItem.product_name); // Fallback to name if ID differs (DB vs Local)
                    if (idx !== -1) {
                      items[idx] = {
                        ...items[idx],
                        purchased: newItem.purchased,
                        purchasedBy: newItem.purchased_by
                      };
                    }
                  };

                  updateInLocation(next.dutyFree.departure.items);
                  updateInLocation(next.dutyFree.arrival.items);
                  Object.values(next.cityShopping).forEach(loc => updateInLocation(loc.items));
                  return next;
                });
              }
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      }
    };

    setupSubscription();
  }, [travelInfo]); // Re-run when travel info (trip) is loaded

  // Sync selectedLocation with shoppingPlan updates
  useEffect(() => {
    if (shoppingPlan && selectedLocation) {
      let updatedLocation: ShoppingLocation | undefined;

      if (selectedLocation.id === 'departure') {
        updatedLocation = shoppingPlan.dutyFree.departure;
      } else if (selectedLocation.id === 'arrival') {
        updatedLocation = shoppingPlan.dutyFree.arrival;
      } else if (selectedLocation.id.startsWith('merged_')) {
        // Handle merged locations (grouped by city)
        const cityName = selectedLocation.id.replace('merged_', '');

        // Find all locations that belong to this city
        const cityLocations = Object.values(shoppingPlan.cityShopping).filter(loc => {
          const normalizedName = loc.location.split('(')[0].trim();
          return normalizedName === cityName;
        });

        if (cityLocations.length > 0) {
          // Reconstruct the merged location
          const days = cityLocations.map(l => l.day).filter((d): d is number => d !== undefined).sort((a, b) => a - b);

          // Helper to format day ranges (duplicated from HomePage logic for consistency)
          const formatDayRanges = (days: number[]): string => {
            if (days.length === 0) return '';
            const sortedDays = [...new Set(days)].sort((a, b) => a - b);
            const ranges: string[] = [];
            let start = sortedDays[0];
            let end = sortedDays[0];

            for (let i = 1; i < sortedDays.length; i++) {
              if (sortedDays[i] === end + 1) {
                end = sortedDays[i];
              } else {
                ranges.push(start === end ? `${start}일차` : `${start}일차 ~ ${end}일차`);
                start = sortedDays[i];
                end = sortedDays[i];
              }
            }
            ranges.push(start === end ? `${start}일차` : `${start}일차 ~ ${end}일차`);
            return ranges.join(', ');
          };

          const dayDisplay = formatDayRanges(days);
          const totalCitySubtotal = cityLocations.reduce((sum, loc) => sum + loc.subtotal, 0);

          updatedLocation = {
            id: `merged_${cityName}`,
            location: cityName,
            day: days[0],
            timing: `여행 중 (${dayDisplay})`,
            items: cityLocations.flatMap(l => l.items),
            subtotal: totalCitySubtotal,
            tips: Array.from(new Set(cityLocations.flatMap(l => l.tips || []))),
            route: cityLocations.map(l => l.route).filter(Boolean).join(' / '),
            warnings: Array.from(new Set(cityLocations.flatMap(l => l.warnings || []))),
          };
        }
      } else {
        updatedLocation = shoppingPlan.cityShopping[selectedLocation.id];
      }

      if (updatedLocation) {
        setSelectedLocation(updatedLocation);
      }
    }
  }, [shoppingPlan]);

  const handleStartLiveMode = (location: ShoppingLocation) => {
    setSelectedLocation(location);
    setCurrentScreen('live');
  };

  // const handleUpdateGroupMembers = (members: GroupMember[]) => {
  //   setGroupMembers(members);
  //   localStorage.setItem('groupMembers', JSON.stringify(members));
  // };

  const handleReset = () => {
    localStorage.clear();
    setTravelInfo(null);
    setShoppingPlan(null);
    // setGroupMembers([]);
    setCurrentScreen('onboarding');
  };

  const handleJoinTrip = async () => {
    const tripId = prompt('참여할 여행 ID를 입력해주세요:');
    if (!tripId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const trip = await joinTrip(tripId, session.user.id);
      if (trip) {
        alert('여행에 참여했습니다! 데이터를 불러오기 위해 새로고침합니다.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to join trip:', error);
      alert('여행 참여에 실패했습니다. ID를 확인해주세요.');
    }
  };

  // Helper to find the real location ID for an item
  const findLocationIdByItemId = (itemId: string): string | undefined => {
    if (!shoppingPlan) return undefined;

    // Check duty free
    if (shoppingPlan.dutyFree.departure.items.some(i => i.id === itemId)) return 'departure';
    if (shoppingPlan.dutyFree.arrival.items.some(i => i.id === itemId)) return 'arrival';

    // Check city shopping
    for (const [locId, loc] of Object.entries(shoppingPlan.cityShopping)) {
      if (loc.items.some(i => i.id === itemId)) return locId;
    }

    return undefined;
  };





  const openEditModal = (item: ShoppingItem, locationId: string) => {
    // If locationId starts with 'merged_', we need to find the real location ID
    const realLocationId = locationId.startsWith('merged_')
      ? findLocationIdByItemId(item.id)
      : locationId;

    if (realLocationId) {
      setEditingItem({ item, locationId: realLocationId });
      setIsAddItemModalOpen(true);
    } else {
      console.error('Could not find location for item:', item.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentScreen === 'onboarding' && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}

      {currentScreen === 'home' && travelInfo && shoppingPlan && (
        <HomePage
          travelInfo={travelInfo}
          shoppingPlan={shoppingPlan}
          onLocationSelect={handleLocationSelect}
          onNavigate={setCurrentScreen}
          onAddItem={() => {
            setEditingItem(null);
            setIsAddItemModalOpen(true);
          }}
        />
      )}

      {currentScreen === 'detail' && selectedLocation && shoppingPlan && (
        <ShoppingListDetail
          location={selectedLocation}
          onBack={() => setCurrentScreen('home')}
          onItemPurchase={handleItemPurchase}
          onStartLiveMode={() => handleStartLiveMode(selectedLocation)}
          onEditItem={(item) => openEditModal(item, selectedLocation.id)}
          onAddItem={() => {
            setEditingItem(null);
            setIsAddItemModalOpen(true);
          }}
        />
      )}

      {currentScreen === 'timeline' && travelInfo && shoppingPlan && (
        <TimelineView
          travelInfo={travelInfo}
          shoppingPlan={shoppingPlan}
          onBack={() => setCurrentScreen('home')}
          onNavigate={setCurrentScreen}
          onUpdateItemStatus={(itemId, _, locationId) => handleItemPurchase(locationId, itemId)}
        />
      )}

      {/* {currentScreen === 'group' && shoppingPlan && travelInfo && (
        <GroupShopping
          shoppingPlan={shoppingPlan}
          groupMembers={groupMembers}
          onUpdateMembers={handleUpdateGroupMembers}
          onBack={() => setCurrentScreen('home')}
          onItemPurchase={handleItemPurchase}
          onAddItem={handleAddItemClick}
          travelInfo={travelInfo}
        />
      )} */}

      {currentScreen === 'live' && selectedLocation && (
        <LiveShopping
          location={selectedLocation}
          onBack={() => {
            setCurrentScreen('detail');
          }}
          onItemPurchase={(itemId) => handleItemPurchase(selectedLocation.id, itemId)}
        />
      )}

      {currentScreen === 'settings' && (
        <TripSettings
          onBack={() => setCurrentScreen('home')}
          onReset={handleReset}
          onJoinTrip={handleJoinTrip}
          onNavigate={setCurrentScreen}
        />
      )}
      {shoppingPlan && (
        <AddItemModal
          isOpen={isAddItemModalOpen}
          onClose={() => {
            setIsAddItemModalOpen(false);
            setEditingItem(null);
          }}
          onAdd={handleAddItem}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          shoppingPlan={shoppingPlan}
          travelInfo={travelInfo}
          initialItem={editingItem}
        />
      )}
    </div>
  );
}
