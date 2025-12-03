
import { renderHook, act } from '@testing-library/react';
import { useGroupShopping } from './useGroupShopping';
import { describe, it, expect, vi } from 'vitest';
import type { ShoppingPlan, GroupMember, TravelInfo, ShoppingItem } from '../types';

// Mock data
const mockShoppingPlan: ShoppingPlan = {
    dutyFree: {
        departure: { id: 'dep', location: 'Airport', timing: 'Departure', items: [], subtotal: 0 },
        arrival: { id: 'arr', location: 'Airport', timing: 'Arrival', items: [], subtotal: 0 }
    },
    cityShopping: {},
    budgetSummary: { total: 1000000, dutyFree: 0, cityShopping: 0, remaining: 1000000 },
    timeline: []
};

const mockTravelInfo: TravelInfo = {
    destination: 'Bangkok',
    startDate: '2025-01-01',
    endDate: '2025-01-05',
    budget: 1000000,
    preferences: [],
    purposes: [],
    companions: ['Mom', 'Dad'],
    schedule: []
};

const mockInitialMembers: GroupMember[] = [];

describe('useGroupShopping', () => {
    it('should initialize with default members and companions', () => {
        const onUpdateMembers = vi.fn();

        renderHook(() => useGroupShopping({
            shoppingPlan: mockShoppingPlan,
            groupMembers: mockInitialMembers,
            onUpdateMembers,
            travelInfo: mockTravelInfo
        }));

        // Should call onUpdateMembers with default members + companions
        expect(onUpdateMembers).toHaveBeenCalled();
        const calledMembers = onUpdateMembers.mock.calls[0][0];
        expect(calledMembers).toHaveLength(3); // 'Me' + 2 companions
        expect(calledMembers[0].name).toBe('나');
        expect(calledMembers[1].name).toBe('Mom');
        expect(calledMembers[2].name).toBe('Dad');
    });

    it('should add a new member', () => {
        const onUpdateMembers = vi.fn();
        const initialMembers = [{ id: '1', name: 'Me', emoji: '😊', items: [] }];

        const { result } = renderHook(() => useGroupShopping({
            shoppingPlan: mockShoppingPlan,
            groupMembers: initialMembers,
            onUpdateMembers,
            travelInfo: mockTravelInfo
        }));

        act(() => {
            result.current.addMember('Friend', '😎');
        });

        expect(onUpdateMembers).toHaveBeenCalled();
        const newMembers = onUpdateMembers.mock.calls[0][0];
        expect(newMembers).toHaveLength(2);
        expect(newMembers[1].name).toBe('Friend');
        expect(newMembers[1].emoji).toBe('😎');
    });

    it('should assign an item to a member', () => {
        const onUpdateMembers = vi.fn();
        const memberId = '1';
        const initialMembers = [{ id: memberId, name: 'Me', emoji: '😊', items: [] }];
        const item: ShoppingItem = {
            id: 'item1',
            product: 'Soap',
            estimatedPrice: 100,
            purchased: false,
            category: 'Cosmetics',
            reason: 'Gift',
            priority: 'medium'
        };

        const { result } = renderHook(() => useGroupShopping({
            shoppingPlan: mockShoppingPlan,
            groupMembers: initialMembers,
            onUpdateMembers,
            travelInfo: mockTravelInfo
        }));

        act(() => {
            result.current.assignItem(memberId, item);
        });

        expect(onUpdateMembers).toHaveBeenCalled();
        const updatedMembers = onUpdateMembers.mock.calls[0][0];
        expect(updatedMembers[0].items).toHaveLength(1);
        expect(updatedMembers[0].items[0]).toEqual(item);
    });

    it('should send a chat message', () => {
        const onUpdateMembers = vi.fn();

        const { result } = renderHook(() => useGroupShopping({
            shoppingPlan: mockShoppingPlan,
            groupMembers: mockInitialMembers,
            onUpdateMembers,
            travelInfo: mockTravelInfo
        }));

        act(() => {
            result.current.sendMessage('Hello world');
        });

        expect(result.current.chatMessages).toHaveLength(2); // Initial message + new message
        expect(result.current.chatMessages[1].message).toBe('Hello world');
        expect(result.current.chatMessages[1].member).toBe('나');
    });
});
