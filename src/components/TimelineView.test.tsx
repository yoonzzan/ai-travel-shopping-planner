import { render, screen } from '@testing-library/react';
import { TimelineView } from './TimelineView';
import { describe, it, expect } from 'vitest';
import type { TravelInfo, ShoppingPlan } from '../types';

// Mock data
const mockTravelInfo: TravelInfo = {
    startDate: '2025-01-01',
    endDate: '2025-01-05',
    destination: 'Japan',
    budget: 1000000,
    schedule: [
        { day: 1, location: 'Tokyo', date: '2025-01-01' },
        { day: 2, location: 'Osaka', date: '2025-01-02' },
        { day: 3, location: 'Kyoto', date: '2025-01-03' },
        { day: 4, location: 'Kyoto', date: '2025-01-04' },
        { day: 5, location: 'Osaka', date: '2025-01-05' }
    ],
    companions: [],
    preferences: [],
    purposes: []
};

const mockShoppingPlan: ShoppingPlan = {
    dutyFree: {
        departure: { id: 'dep', location: 'Incheon', items: [], subtotal: 0, timing: 'Departure' },
        arrival: { id: 'arr', location: 'Incheon', items: [], subtotal: 0, timing: 'Arrival' }
    },
    cityShopping: {
        'tokyo': {
            id: 'tokyo',
            location: 'Tokyo',
            day: 1,
            items: [
                { id: '1', product: 'Banana', estimatedPrice: 1000, currencyCode: 'JPY', purchased: false, category: 'Food', reason: 'Yum', priority: 'high' }
            ],
            subtotal: 1000,
            timing: 'Day 1'
        },
        'osaka': {
            id: 'osaka',
            location: 'Osaka',
            day: 2,
            items: [
                { id: '2', product: 'Apple', estimatedPrice: 2000, currencyCode: 'JPY', purchased: false, category: 'Food', reason: 'Yum', priority: 'high' }
            ],
            subtotal: 2000,
            timing: 'Day 2'
        }
    },
    budgetSummary: { dutyFree: 0, cityShopping: 3000, total: 3000, remaining: 997000 },
    timeline: []
};

describe('TimelineView', () => {
    it('renders timeline days correctly', () => {
        render(
            <TimelineView
                travelInfo={mockTravelInfo}
                shoppingPlan={mockShoppingPlan}
                onBack={() => { }}
                onNavigate={() => { }}
                onUpdateItemStatus={() => { }}
            />
        );

        // Check for Day markers in the timeline (using regex for partial match)
        expect(screen.getByText(/1일차/)).toBeDefined();
        expect(screen.getByText(/2일차/)).toBeDefined();

        // Check for "Departure" and "Arrival" related markers
        expect(screen.getByText(/입국 면세점/)).toBeDefined(); // Arrival
    });

    it('displays all items in the timeline', () => {
        render(
            <TimelineView
                travelInfo={mockTravelInfo}
                shoppingPlan={mockShoppingPlan}
                onBack={() => { }}
                onNavigate={() => { }}
                onUpdateItemStatus={() => { }}
            />
        );

        // All items should be visible in the vertical timeline
        // Note: Items are rendered as "• Product"
        expect(screen.getByText(/Banana/)).toBeDefined();
        expect(screen.getByText(/Apple/)).toBeDefined();
    });
});
