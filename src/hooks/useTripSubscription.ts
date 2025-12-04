import { useEffect } from 'react';
import { supabase } from '../supabase/client';
import type { TravelInfo, ShoppingPlan, ShoppingItem } from '../types';

interface UseTripSubscriptionProps {
    travelInfo: TravelInfo | null;
    shoppingPlan: ShoppingPlan | null;
    setShoppingPlan: React.Dispatch<React.SetStateAction<ShoppingPlan | null>>;
}

export function useTripSubscription({ travelInfo, shoppingPlan, setShoppingPlan }: UseTripSubscriptionProps) {
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
}
