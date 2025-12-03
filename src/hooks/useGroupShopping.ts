import { useState, useEffect } from 'react';
import type { ShoppingPlan, GroupMember, ShoppingItem, TravelInfo } from '../types';

interface UseGroupShoppingProps {
    shoppingPlan: ShoppingPlan;
    groupMembers: GroupMember[];
    onUpdateMembers: (members: GroupMember[]) => void;
    travelInfo: TravelInfo;
}

export function useGroupShopping({
    groupMembers,
    onUpdateMembers,
    travelInfo,
}: UseGroupShoppingProps) {
    const [chatMessages, setChatMessages] = useState<Array<{ member: string; message: string }>>([
        { member: '나', message: '여행 준비물 다 챙겼어?' },
    ]);

    // Initialize default members if none exist
    useEffect(() => {
        if (groupMembers.length === 0) {
            const defaultMembers: GroupMember[] = [
                { id: 'member-me', name: '나', emoji: '😊', items: [] },
            ];

            // Add companions from travelInfo
            if (travelInfo.companions && travelInfo.companions.length > 0) {
                travelInfo.companions.forEach((name, idx) => {
                    defaultMembers.push({
                        id: `member-companion-${idx}`,
                        name: name,
                        emoji: '🙂', // Default emoji for companions
                        items: []
                    });
                });
            } else {
                // Fallback if no companions
                defaultMembers.push({ id: 'member-2', name: '일행1', emoji: '🙂', items: [] });
            }

            onUpdateMembers(defaultMembers);
        }
    }, [groupMembers.length, onUpdateMembers, travelInfo.companions]);

    const addMember = (name: string, emoji: string) => {
        const newMember: GroupMember = {
            id: `member-${Date.now()}`,
            name,
            emoji,
            items: [],
        };
        onUpdateMembers([...groupMembers, newMember]);
    };

    const assignItem = (memberId: string, item: ShoppingItem) => {
        const updatedMembers = groupMembers.map((member) => {
            if (member.id === memberId) {
                return {
                    ...member,
                    items: [...member.items, item],
                };
            }
            return member;
        });
        onUpdateMembers(updatedMembers);
    };

    const sendMessage = (message: string) => {
        setChatMessages((prev) => [...prev, { member: '나', message }]);
    };

    return {
        chatMessages,
        addMember,
        assignItem,
        sendMessage,
    };
}

