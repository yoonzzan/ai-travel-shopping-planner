export type Screen = 'onboarding' | 'home' | 'detail' | 'timeline' | 'group' | 'live' | 'settings';

export interface TravelInfo {
    destination: string;
    startDate: string;
    endDate: string;
    budget: number;
    preferences: string[];
    purposes: string[];
    companions?: string[];
    schedule?: {
        day: number;
        date: string;
        location: string;
    }[];
}

export interface ShoppingItem {
    id: string;
    category: string;
    product: string;
    brand?: string;
    estimatedPrice: number;
    localPrice?: number;
    currencyCode?: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    alternatives?: string[];
    shopName?: string;
    address?: string;
    mallName?: string;
    purchased: boolean;
    purchasedBy?: string;
    memo?: string;
    isRecommended?: boolean;
    source?: 'guide' | 'ai';
}

export interface ShoppingLocation {
    id: string;
    location: string;
    timing: string;
    day?: number;
    freeTime?: number;
    items: ShoppingItem[];
    subtotal: number;
    tips?: string[];
    route?: string;
    warnings?: string[];
}

export interface ShoppingPlan {
    dutyFree: {
        departure: ShoppingLocation;
        arrival: ShoppingLocation;
    };
    cityShopping: Record<string, ShoppingLocation>;
    budgetSummary: {
        dutyFree: number;
        cityShopping: number;
        total: number;
        remaining: number;
    };
    timeline: string[];
}

export interface GroupMember {
    id: string;
    name: string;
    emoji: string;
    items: ShoppingItem[];
}
