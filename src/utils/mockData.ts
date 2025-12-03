import type { TravelInfo, ShoppingPlan, ShoppingItem } from '../types';

export function generateMockShoppingPlan(travelInfo: TravelInfo): ShoppingPlan {
  const { destination, budget, preferences } = travelInfo;

  // Generate items based on preferences
  const dutyFreeItems: ShoppingItem[] = [];
  const cityShoppingItems: Record<string, ShoppingItem[]> = {
    day2: [],
    day3: [],
  };

  let itemId = 1;

  if (preferences.includes('cosmetics')) {
    dutyFreeItems.push({
      id: `item-${itemId++}`,
      category: '화장품',
      product: '설화수 자음생 세트',
      brand: '설화수',
      estimatedPrice: 120000,
      reason: '면세가로 30% 저렴, 선물용으로 인기',
      priority: 'high',
      alternatives: ['후 비첩 세트', 'LG생활건강 세트'],
      purchased: false,
    });

    dutyFreeItems.push({
      id: `item-${itemId++}`,
      category: '화장품',
      product: 'SK-II 피테라 에센스',
      brand: 'SK-II',
      estimatedPrice: 150000,
      reason: '면세점 독점 할인, 25% 절약',
      priority: 'high',
      alternatives: ['에스티로더 나이트 리페어'],
      purchased: false,
    });

    cityShoppingItems.day3.push({
      id: `item-${itemId++}`,
      category: '화장품',
      product: '현지 로컬 브랜드 세트',
      estimatedPrice: 25000,
      reason: '한국 미출시 제품',
      priority: 'medium',
      shopName: 'Boots',
      mallName: 'Siam Center',
      purchased: false,
    });
  }

  if (preferences.includes('fashion')) {
    cityShoppingItems.day3.push({
      id: `item-${itemId++}`,
      category: '패션',
      product: 'NaRaYa 가방 3개',
      estimatedPrice: 30000,
      reason: '면세점보다 30% 저렴, 방콕 특산',
      priority: 'high',
      mallName: 'Siam Paragon 1층',
      purchased: false,
    });

    cityShoppingItems.day3.push({
      id: `item-${itemId++}`,
      category: '패션',
      product: '실크 스카프',
      estimatedPrice: 20000,
      reason: '태국 전통 수공예품',
      priority: 'medium',
      mallName: 'Siam Square',
      purchased: false,
    });
  }

  if (preferences.includes('food')) {
    cityShoppingItems.day2.push({
      id: `item-${itemId++}`,
      category: '식품',
      product: '중국차 세트',
      estimatedPrice: 15000,
      localPrice: 400,
      currencyCode: 'THB',
      reason: '현지에서만 구매 가능한 특산품',
      priority: 'medium',
      shopName: '차이나타운 전통 찻집',
      address: 'Yaowarat Road',
      purchased: false,
    });

    cityShoppingItems.day2.push({
      id: `item-${itemId++}`,
      category: '식품',
      product: '드라이 망고',
      estimatedPrice: 10000,
      localPrice: 250,
      currencyCode: 'THB',
      reason: '태국 대표 간식',
      priority: 'low',
      shopName: '차이나타운 마켓',
      purchased: false,
    });

    dutyFreeItems.push({
      id: `item-${itemId++}`,
      category: '식품',
      product: '고디바 초콜릿 세트',
      brand: '고디바',
      estimatedPrice: 35000,
      reason: '면세점 전용 패키지',
      priority: 'medium',
      purchased: false,
    });
  }

  if (preferences.includes('alcohol')) {
    dutyFreeItems.push({
      id: `item-${itemId++}`,
      category: '주류',
      product: '발렌타인 17년',
      estimatedPrice: 45000,
      reason: '시내 대비 40% 저렴',
      priority: 'high',
      purchased: false,
    });

    dutyFreeItems.push({
      id: `item-${itemId++}`,
      category: '담배',
      product: '말보로 2보루',
      estimatedPrice: 30000,
      reason: '면세점 특가',
      priority: 'medium',
      purchased: false,
    });
  }

  if (preferences.includes('electronics')) {
    cityShoppingItems.day3.push({
      id: `item-${itemId++}`,
      category: '전자제품',
      product: '블루투스 이어폰',
      estimatedPrice: 50000,
      reason: '한국보다 20% 저렴',
      priority: 'medium',
      mallName: 'MBK Center',
      purchased: false,
    });
  }

  // Add arrival duty free items
  const arrivalItems: ShoppingItem[] = [
    {
      id: `item-${itemId++}`,
      category: '주류',
      product: '위스키 (입국장 픽업)',
      estimatedPrice: 50000,
      reason: '출국장보다 대기 시간 짧음',
      priority: 'low',
      purchased: false,
    },
  ];

  // Calculate totals
  const dutyFreeDepartureTotal = dutyFreeItems.reduce((sum, item) => sum + item.estimatedPrice, 0);
  const dutyFreeArrivalTotal = arrivalItems.reduce((sum, item) => sum + item.estimatedPrice, 0);
  const day2Total = cityShoppingItems.day2.reduce((sum, item) => sum + item.estimatedPrice, 0);
  const day3Total = cityShoppingItems.day3.reduce((sum, item) => sum + item.estimatedPrice, 0);

  const dutyFreeTotal = dutyFreeDepartureTotal + dutyFreeArrivalTotal;
  const cityTotal = day2Total + day3Total;
  const grandTotal = dutyFreeTotal + cityTotal;

  return {
    dutyFree: {
      departure: {
        id: 'departure',
        location: '인천공항 면세점 (출국장)',
        timing: '출발일 09:00 - 10:00 (60분)',
        items: dutyFreeItems,
        subtotal: dutyFreeDepartureTotal,
        tips: [
          '사전 온라인 면세점 예약 시 추가 10% 할인',
          '신용카드 우대 할인 확인하세요',
          '3층 화장품 → 2층 주류 순서로 동선 효율적',
        ],
      },
      arrival: {
        id: 'arrival',
        location: '인천공항 면세점 (입국장)',
        timing: '귀국일 18:00 (30분)',
        items: arrivalItems,
        subtotal: dutyFreeArrivalTotal,
        tips: ['출국 시 예약한 상품 픽업'],
      },
    },
    cityShopping: {
      day2: {
        id: 'day2',
        location: '차이나타운',
        timing: '2일차 15:00-16:30 (90분)',
        day: 2,
        freeTime: 90,
        items: cityShoppingItems.day2,
        subtotal: day2Total,
        route: '버스 정차 → 차이나타운 입구 → 추천 가게 순서',
        warnings: ['현금 준비 필수', '흥정 가능한 곳'],
      },
      day3: {
        id: 'day3',
        location: '시암 스퀘어',
        timing: '3일차 14:00-16:00 (120분)',
        day: 3,
        freeTime: 120,
        items: cityShoppingItems.day3,
        subtotal: day3Total,
        route: 'Siam Paragon → Siam Center → MBK (시간 남으면)',
        tips: ['카드 결제 가능', '영수증 받아서 TAX REFUND'],
      },
    },
    budgetSummary: {
      dutyFree: dutyFreeTotal,
      cityShopping: cityTotal,
      total: grandTotal,
      remaining: budget - grandTotal,
    },
    timeline: [
      '출발 1주 전: 온라인 면세점 사전 주문',
      '출발 당일 09:00: 인천공항 면세점 (60분)',
      '2일차 15:00: 차이나타운 (90분)',
      '3일차 14:00: 시암 스퀘어 (120분)',
      '귀국 당일 18:00: 인천공항 입국장 픽업 (30분)',
    ],
  };
}

export function calculateDaysUntilTrip(startDate: string): number {
  const today = new Date();
  const tripStart = new Date(startDate);
  const diffTime = tripStart.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getTripDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}
