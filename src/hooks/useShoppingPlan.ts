import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import type { ShoppingPlan, ShoppingItem, ShoppingLocation, TravelInfo } from '../types';
import { saveShoppingPlan, updateItemStatus } from '../utils/db-service';
import { convertToKRW } from '../utils/currency-service';

export function useShoppingPlan(initialPlan: ShoppingPlan | null, travelInfo: TravelInfo | null) {
    const [shoppingPlan, setShoppingPlan] = useState<ShoppingPlan | null>(initialPlan);

    useEffect(() => {
        if (initialPlan) {
            setShoppingPlan(initialPlan);
        }
    }, [initialPlan]);

    // Force re-render and recalculate prices when exchange rates are updated
    useEffect(() => {
        const handleRatesUpdate = () => {
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

    const updatePlan = async (newPlan: ShoppingPlan) => {
        setShoppingPlan(newPlan);
        localStorage.setItem('shoppingPlan', JSON.stringify(newPlan));

        // Sync to DB
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data: trips } = await supabase
                .from('trips')
                .select('id')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (trips && trips[0]) {
                await saveShoppingPlan(trips[0].id, newPlan);
            }
        }
    };

    const handleItemPurchase = async (locationId: string, itemId: string, purchasedBy?: string) => {
        if (!shoppingPlan) return;

        // Deep copy to ensure immutability and trigger React updates correctly
        const updatedPlan: ShoppingPlan = JSON.parse(JSON.stringify(shoppingPlan));

        const updateItemInList = (items: ShoppingItem[]) => {
            const item = items.find(i => i.id === itemId);
            if (item) {
                item.purchased = !item.purchased;
                if (purchasedBy) item.purchasedBy = purchasedBy;

                // We use the DB service to update status directly if it's a valid UUID
                const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

                if (isValidUUID(item.id)) {
                    updateItemStatus(item.id, item.purchased, item.purchasedBy).catch(err => {
                        console.warn('Failed to update item status in DB:', err);
                    });
                }
                return true; // Found and updated
            }
            return false;
        };

        // 1. Try to find location directly
        let found = false;
        if (locationId === 'departure') {
            found = updateItemInList(updatedPlan.dutyFree.departure.items);
        } else if (locationId === 'arrival') {
            found = updateItemInList(updatedPlan.dutyFree.arrival.items);
        } else if (updatedPlan.cityShopping[locationId]) {
            found = updateItemInList(updatedPlan.cityShopping[locationId].items);
        }

        // 2. If not found (e.g. merged view), search everywhere
        if (!found) {
            // Check duty free
            if (updateItemInList(updatedPlan.dutyFree.departure.items)) found = true;
            else if (updateItemInList(updatedPlan.dutyFree.arrival.items)) found = true;

            // Check all city locations
            if (!found) {
                for (const loc of Object.values(updatedPlan.cityShopping)) {
                    if (updateItemInList(loc.items)) {
                        found = true;
                        break;
                    }
                }
            }
        }

        if (found) {
            setShoppingPlan(updatedPlan);
            localStorage.setItem('shoppingPlan', JSON.stringify(updatedPlan));
        } else {
            console.warn(`Item ${itemId} not found in plan (Location: ${locationId})`);
        }
    };

    const handleAddItem = async (productName: string, price: number, locationId: string, memo: string, localPrice?: number, currencyCode?: string) => {
        if (!shoppingPlan) return;

        const newItem: ShoppingItem = {
            id: crypto.randomUUID(),
            category: '기타',
            product: productName,
            estimatedPrice: price,
            localPrice: localPrice,
            currencyCode: currencyCode,
            reason: '사용자 추가 아이템',
            priority: 'medium',
            purchased: false,
            memo: memo,
            isRecommended: false,
        };

        const newPlan: ShoppingPlan = JSON.parse(JSON.stringify(shoppingPlan));
        let targetLocation: ShoppingLocation | undefined;

        if (locationId === 'departure') targetLocation = newPlan.dutyFree.departure;
        else if (locationId === 'arrival') targetLocation = newPlan.dutyFree.arrival;
        else if (locationId.startsWith('NEW:')) {
            // Handle creating a new location entry
            const [_, dayStr, ...locParts] = locationId.split(':');
            const day = parseInt(dayStr);
            const locationName = locParts.join(':'); // Rejoin in case location has colons
            const newId = `day_${day}_${locationName.replace(/\s+/g, '_')}_${Date.now()}`; // Generate a unique ID

            const newLocation: ShoppingLocation = {
                id: newId,
                location: locationName,
                day: day,
                timing: '여행 중',
                items: [],
                subtotal: 0
            };

            newPlan.cityShopping[newId] = newLocation;
            targetLocation = newLocation;
        }
        else targetLocation = newPlan.cityShopping[locationId];

        if (targetLocation) {
            targetLocation.items.push(newItem);
            targetLocation.subtotal += price;
            newPlan.budgetSummary.total += price;
            newPlan.budgetSummary.remaining -= price;

            if (locationId === 'departure' || locationId === 'arrival') {
                newPlan.budgetSummary.dutyFree += price;
            } else {
                newPlan.budgetSummary.cityShopping += price;
            }

            await updatePlan(newPlan);
        }
    };

    const handleEditItem = async (originalLocationId: string, itemId: string, productName: string, price: number, newLocationId: string, memo: string, localPrice?: number, currencyCode?: string) => {
        if (!shoppingPlan) return;

        const newPlan: ShoppingPlan = JSON.parse(JSON.stringify(shoppingPlan));

        // 1. Find and remove from original location
        let originalLocation: ShoppingLocation | undefined;
        if (originalLocationId === 'departure') originalLocation = newPlan.dutyFree.departure;
        else if (originalLocationId === 'arrival') originalLocation = newPlan.dutyFree.arrival;
        else originalLocation = newPlan.cityShopping[originalLocationId];

        if (!originalLocation) return;

        const itemIndex = originalLocation.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        const originalItem = originalLocation.items[itemIndex];

        // Remove from original
        originalLocation.items.splice(itemIndex, 1);
        originalLocation.subtotal -= originalItem.estimatedPrice;

        // Update budget summary for removal
        newPlan.budgetSummary.total -= originalItem.estimatedPrice;
        newPlan.budgetSummary.remaining += originalItem.estimatedPrice;
        if (originalLocationId === 'departure' || originalLocationId === 'arrival') {
            newPlan.budgetSummary.dutyFree -= originalItem.estimatedPrice;
        } else {
            newPlan.budgetSummary.cityShopping -= originalItem.estimatedPrice;
        }

        // 2. Add to new location (updated item)
        let newLocation: ShoppingLocation | undefined;
        if (newLocationId === 'departure') newLocation = newPlan.dutyFree.departure;
        else if (newLocationId === 'arrival') newLocation = newPlan.dutyFree.arrival;
        else newLocation = newPlan.cityShopping[newLocationId];

        if (newLocation) {
            const updatedItem: ShoppingItem = {
                ...originalItem,
                product: productName,
                estimatedPrice: price,
                memo: memo,
                localPrice: localPrice,
                currencyCode: currencyCode,
            };

            newLocation.items.push(updatedItem);
            newLocation.subtotal += price;

            // Update budget summary for addition
            newPlan.budgetSummary.total += price;
            newPlan.budgetSummary.remaining -= price;
            if (newLocationId === 'departure' || newLocationId === 'arrival') {
                newPlan.budgetSummary.dutyFree += price;
            } else {
                newPlan.budgetSummary.cityShopping += price;
            }
        }

        await updatePlan(newPlan);
    };

    const handleDeleteItem = async (locationId: string, itemId: string) => {
        if (!shoppingPlan) return;
        const newPlan: ShoppingPlan = JSON.parse(JSON.stringify(shoppingPlan));

        let location: ShoppingLocation | undefined;
        if (locationId === 'departure') location = newPlan.dutyFree.departure;
        else if (locationId === 'arrival') location = newPlan.dutyFree.arrival;
        else location = newPlan.cityShopping[locationId];

        if (!location) return;

        const itemIndex = location.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        const item = location.items[itemIndex];

        // Remove item
        location.items.splice(itemIndex, 1);
        location.subtotal -= item.estimatedPrice;

        // Update totals
        newPlan.budgetSummary.total -= item.estimatedPrice;
        newPlan.budgetSummary.remaining += item.estimatedPrice;
        if (locationId === 'departure' || locationId === 'arrival') {
            newPlan.budgetSummary.dutyFree -= item.estimatedPrice;
        } else {
            newPlan.budgetSummary.cityShopping -= item.estimatedPrice;
        }

        await updatePlan(newPlan);
    };

    return {
        shoppingPlan,
        setShoppingPlan,
        handleItemPurchase,
        handleAddItem,
        handleEditItem,
        handleDeleteItem
    };
}
