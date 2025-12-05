import { supabase } from '../supabase/client';
import type { TravelInfo, ShoppingPlan, ShoppingItem } from '../types';

export async function createTrip(userId: string, travelInfo: TravelInfo) {
    const { data, error } = await supabase
        .from('trips')
        .insert({
            user_id: userId,
            destination: travelInfo.destination,
            start_date: travelInfo.startDate,
            end_date: travelInfo.endDate,
            budget: travelInfo.budget,
            preferences: travelInfo.preferences,
            purposes: travelInfo.purposes,
            companions: travelInfo.companions,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function saveShoppingPlan(tripId: string, plan: ShoppingPlan) {
    const itemsToInsert: any[] = [];

    // Helper to validate UUID
    const isValidUUID = (id: string) => {
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return regex.test(id);
    };

    // Helper to process items
    const processItems = (items: ShoppingItem[], locationId: string, locationName: string) => {
        items.forEach(item => {
            // Ensure ID is a valid UUID, otherwise generate one
            const itemId = isValidUUID(item.id) ? item.id : crypto.randomUUID();

            itemsToInsert.push({
                id: itemId,
                trip_id: tripId,
                location_id: locationId,
                location_name: locationName,
                category: item.category,
                product_name: item.product,
                brand: item.brand,
                estimated_price: Math.round(item.estimatedPrice),
                reason: item.reason,
                priority: item.priority,
                purchased: item.purchased || false,
                shop_name: item.shopName,
                is_recommended: item.isRecommended !== false,
                local_price: item.localPrice ? Math.round(item.localPrice) : null,
                currency_code: item.currencyCode
            });
        });
    };

    // Process Duty Free
    processItems(plan.dutyFree.departure.items, 'departure', plan.dutyFree.departure.location);
    processItems(plan.dutyFree.arrival.items, 'arrival', plan.dutyFree.arrival.location);

    // Process City Shopping
    Object.values(plan.cityShopping).forEach(location => {
        processItems(location.items, location.id, location.location);
    });

    // First delete existing items to avoid duplicates and handle deletions
    const { error: deleteError } = await supabase
        .from('shopping_items')
        .delete()
        .eq('trip_id', tripId);

    if (deleteError) throw deleteError;

    if (itemsToInsert.length > 0) {
        const { error } = await supabase
            .from('shopping_items')
            .insert(itemsToInsert);

        if (error) throw error;
    }
}

export async function fetchUserTrips(userId: string) {
    const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export function subscribeToTrip(tripId: string, onUpdate: (payload: any) => void) {
    return supabase
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
                onUpdate(payload);
            }
        )
        .subscribe();
}

export async function updateItemStatus(itemId: string, purchased: boolean, purchasedBy?: string) {
    const { error } = await supabase
        .from('shopping_items')
        .update({ purchased, purchased_by: purchasedBy })
        .eq('id', itemId);

    if (error) throw error;
}

export async function joinTrip(tripId: string, userId: string) {
    const { error } = await supabase
        .from('trip_members')
        .insert({
            trip_id: tripId,
            user_id: userId
        });

    if (error) throw error;

    // Fetch the trip details to return
    const { data, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

    if (tripError) throw tripError;
    return data;
}
