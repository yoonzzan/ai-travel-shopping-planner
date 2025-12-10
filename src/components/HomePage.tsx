import { useState, useRef } from 'react';

import { Settings, ChevronRight, Home, Calendar, Users, Globe, ShoppingBag, Plus } from 'lucide-react';
import type { TravelInfo, ShoppingPlan, Screen } from '../types';
import { ExchangeRateModal } from './ExchangeRateModal';

interface HomePageProps {
  travelInfo: TravelInfo;
  shoppingPlan: ShoppingPlan;
  onNavigate: (page: Screen) => void;
  onLocationSelect: (location: any) => void;
  onAddItem: () => void;
}

export function HomePage({
  travelInfo,
  shoppingPlan,
  onNavigate,
  onLocationSelect,
  onAddItem,
}: HomePageProps) {
  const [isExchangeRateModalOpen, setIsExchangeRateModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const totalBudget = typeof travelInfo.budget === 'string' ? parseInt(travelInfo.budget) : travelInfo.budget;
  const spentBudget = shoppingPlan.budgetSummary.total;
  const remainingBudget = totalBudget - spentBudget;
  const budgetProgress = Math.min((spentBudget / totalBudget) * 100, 100);

  // Calculate total items and purchased items
  const allItems = [
    ...shoppingPlan.dutyFree.departure.items,
    ...shoppingPlan.dutyFree.arrival.items,
    ...Object.values(shoppingPlan.cityShopping).flatMap(c => c.items)
  ];
  const totalItemsCount = allItems.length;
  const purchasedItemsCount = allItems.filter(i => i.purchased).length;

  // Group city shopping by city name (robust grouping)
  const cityGroups = Object.values(shoppingPlan.cityShopping).reduce((acc, location) => {
    // Extract main city name: take part before '(' and before ','
    // e.g. "Tokyo (Ginza, Shibuya)" -> "Tokyo"
    // e.g. "Osaka, Kyoto" -> "Osaka" (primary city only to avoid duplication)
    const mainCityName = location.location.split('(')[0].split(',')[0].trim();

    if (mainCityName) {
      if (!acc[mainCityName]) {
        acc[mainCityName] = [];
      }
      acc[mainCityName].push(location);
    }
    return acc;
  }, {} as Record<string, typeof shoppingPlan.cityShopping[keyof typeof shoppingPlan.cityShopping][]>);

  // Helper to format day ranges
  const formatDayRanges = (days: number[]) => {
    if (days.length === 0) return '';
    const sortedDays = [...new Set(days)].sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = sortedDays[0];
    let end = sortedDays[0];

    for (let i = 1; i < sortedDays.length; i++) {
      if (sortedDays[i] === end + 1) {
        end = sortedDays[i];
      } else {
        ranges.push(start === end ? `${start}일차` : `${start}~${end}일차`);
        start = sortedDays[i];
        end = sortedDays[i];
      }
    }
    ranges.push(start === end ? `${start}일차` : `${start}~${end}일차`);
    return ranges.join(', ');
  };

  // Deduplicate locations for the header
  // Split by comma to handle "Incheon, Paris" cases, then deduplicate
  const uniqueLocations = Array.from(new Set(
    (travelInfo.schedule || [])
      .flatMap(s => (s.location || '').split(','))
      .map(l => l.trim())
      .filter(l => l.length > 0)
  ));

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-0 font-sans">
        {/* Header Section */}
        <div className="bg-blue-600 bg-gradient-to-b from-blue-600 to-purple-600 text-white pb-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

          <div className="relative z-10 px-6 pt-6 max-w-md mx-auto">
            {/* Top Bar */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">트래블카트</h1>
                <p className="text-blue-100 text-sm font-medium opacity-90">스마트 쇼핑 플래너</p>
              </div>
              <button
                onClick={() => onNavigate('settings')}
                className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
              >
                <Settings className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Trip Info Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg">
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-200 mt-1 flex-shrink-0" />
                  <div>
                    <h2 className="font-bold text-lg leading-tight mb-1 text-white">
                      {uniqueLocations.join(', ')} {(travelInfo.schedule || []).length}일 여행
                    </h2>
                    <p className="text-blue-100 text-sm font-medium">
                      {new Date(travelInfo.startDate).toLocaleDateString('ko-KR')} ~ {new Date(travelInfo.endDate).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExchangeRateModalOpen(true)}
                  className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/30 transition-all active:scale-95"
                >
                  <Globe className="w-3.5 h-3.5 text-green-300" />
                  <span className="text-xs font-bold text-white">환율 정보</span>
                </button>
              </div>

              {/* Daily Schedule Horizontal Scroll */}
              <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-scroll pb-4 px-1 cursor-grab active:cursor-grabbing w-full flex-nowrap touch-pan-x"
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{
                  scrollBehavior: isDragging ? 'auto' : 'smooth',
                  overscrollBehaviorX: 'contain',
                  touchAction: 'pan-x',
                  overflowX: 'scroll'
                }}
              >
                {(travelInfo.schedule || []).map((day) => (
                  <div key={day.day} className="flex-shrink-0 bg-gradient-to-br from-white/20 to-white/10 rounded-xl p-3 min-w-[120px] text-center backdrop-blur-sm border border-white/20 shadow-sm hover:bg-white/25 transition-colors select-none">
                    <p className="text-[10px] text-white font-bold mb-1 opacity-80">
                      {day.day}일차
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <span>📍</span>
                      <p className="font-bold text-sm text-white whitespace-nowrap">{day.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-5 -mt-6 relative z-20 space-y-6 max-w-md mx-auto">
          {/* Budget Management Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <h3 className="text-lg font-bold text-gray-900">예산 관리</h3>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {purchasedItemsCount}/{totalItemsCount} 구매 완료
              </span>
            </div>

            <div className="flex justify-between items-end mb-2">
              <span className="text-2xl font-bold text-gray-900">{spentBudget.toLocaleString()}원</span>
              <span className="text-sm text-gray-400 font-medium mb-1">{totalBudget.toLocaleString()}원</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${budgetProgress}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">{Math.round(budgetProgress)}% 사용</span>
              <span className="font-bold text-green-600">남음: {remainingBudget.toLocaleString()}원</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-50">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 mb-1">면세점</span>
                <span className="font-bold text-gray-900">
                  {shoppingPlan.budgetSummary.dutyFree.toLocaleString()}원
                  <span className="text-xs text-gray-400 font-normal ml-1">
                    ({Math.round((shoppingPlan.budgetSummary.dutyFree / (spentBudget || 1)) * 100)}%)
                  </span>
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs text-gray-400 mb-1">현지 쇼핑</span>
                <span className="font-bold text-gray-900">
                  {shoppingPlan.budgetSummary.cityShopping.toLocaleString()}원
                  <span className="text-xs text-gray-400 font-normal ml-1">
                    ({Math.round((shoppingPlan.budgetSummary.cityShopping / (spentBudget || 1)) * 100)}%)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Shopping List Section */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
                쇼핑 리스트 <span className="text-gray-400 text-base font-normal">({totalItemsCount}개)</span>
              </h3>
              <button
                onClick={() => onNavigate('timeline')}
                className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-0.5"
              >
                타임라인 보기 <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* 1. Departure Duty Free */}
              <button
                onClick={() => onLocationSelect(shoppingPlan.dutyFree.departure)}
                className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98] group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <span className="text-xl">✈️</span>
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-gray-900 text-base mb-1">공항 면세점 (출국)</h4>
                      <p className="text-xs text-gray-500 font-medium mb-2">출국 전</p>
                      <p className="text-sm text-gray-600">{shoppingPlan.dutyFree.departure.items.length}개 아이템</p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-600">
                    {shoppingPlan.dutyFree.departure.subtotal.toLocaleString()}원
                  </span>
                </div>
                {/* Mini Progress Bar for Card */}
                <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${shoppingPlan.dutyFree.departure.items.length > 0 ? (shoppingPlan.dutyFree.departure.items.filter(i => i.purchased).length / shoppingPlan.dutyFree.departure.items.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </button>

              {/* 2. City Shopping Cards */}
              {Object.entries(cityGroups)
                .filter(([cityName]) => !cityName.includes('면세점')) // Filter out duty free shops from city list
                .map(([cityName, locations]) => {
                  const totalCityItems = locations.reduce((sum, l) => sum + l.items.length, 0);
                  const totalCitySubtotal = locations.reduce((sum, l) => sum + l.subtotal, 0);
                  const days = locations.map(l => l.day).filter((d): d is number => d !== undefined).sort((a, b) => a - b);
                  const dayDisplay = formatDayRanges(days);

                  // Extract sub-locations (text inside parentheses)
                  const subLocations = Array.from(new Set(locations.map(l => {
                    const match = l.location.match(/\((.*?)\)/);
                    return match ? match[1] : '';
                  }).filter(Boolean))).join(', ');

                  return (
                    <button
                      key={`merged_${cityName}`}
                      onClick={() => onLocationSelect({
                        id: `merged_${cityName}`,
                        location: cityName,
                        day: days[0],
                        timing: `여행 중`,
                        items: locations.flatMap(l => l.items),
                        subtotal: totalCitySubtotal,
                        tips: locations.flatMap(l => l.tips || []),
                        route: '',
                        warnings: locations.flatMap(l => l.warnings || [])
                      })}
                      className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98] group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors">
                            <span className="text-xl">🏙️</span>
                          </div>
                          <div className="text-left">
                            <h4 className="font-bold text-gray-900 text-base mb-1">{cityName}</h4>
                            <p className="text-xs text-gray-500 font-medium mb-1">여행 중 ({dayDisplay})</p>
                            {subLocations && (
                              <p className="text-xs text-gray-400 mb-2 truncate max-w-[180px]">{subLocations}</p>
                            )}
                            <p className="text-sm text-gray-600">총 {totalCityItems}개 아이템</p>
                          </div>
                        </div>
                        <span className="font-bold text-blue-600">
                          {totalCitySubtotal.toLocaleString()}원
                        </span>
                      </div>
                      <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${totalCityItems > 0 ? (locations.reduce((sum, l) => sum + l.items.filter(i => i.purchased).length, 0) / totalCityItems) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </button>
                  );
                })}

              {/* 3. Arrival Duty Free */}
              <button
                onClick={() => onLocationSelect(shoppingPlan.dutyFree.arrival)}
                className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98] group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <span className="text-xl">🛬</span>
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-gray-900 text-base mb-1">공항 면세점 (입국)</h4>
                      <p className="text-xs text-gray-500 font-medium mb-2">입국 후</p>
                      <p className="text-sm text-gray-600">{shoppingPlan.dutyFree.arrival.items.length}개 아이템</p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-600">
                    {shoppingPlan.dutyFree.arrival.subtotal.toLocaleString()}원
                  </span>
                </div>
                <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${shoppingPlan.dutyFree.arrival.items.length > 0 ? (shoppingPlan.dutyFree.arrival.items.filter(i => i.purchased).length / shoppingPlan.dutyFree.arrival.items.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </button>
            </div>
          </div>

          {/* Spacer for Bottom Nav and FAB */}
          <div className="h-48 w-full" aria-hidden="true"></div>
        </div>
      </div>

      {/* Floating Action Button (FAB) - Fixed Position */}
      <div
        className="fixed z-[9999]"
        style={{ bottom: '6.5rem', right: '1.5rem' }}
      >
        <button
          onClick={onAddItem}
          className="w-12 h-12 bg-white text-blue-600 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all active:scale-95 flex items-center justify-center border border-gray-200"
          aria-label="쇼핑 아이템 추가하기"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-3 flex justify-around items-center z-[101] pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button className="flex flex-col items-center gap-1 text-blue-600">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">홈</span>
        </button>
        <button
          onClick={() => onNavigate('timeline')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-medium">타임라인</span>
        </button>
        <button
          onClick={() => onNavigate('settings')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-medium">설정</span>
        </button>
      </div>

      <ExchangeRateModal
        isOpen={isExchangeRateModalOpen}
        onClose={() => setIsExchangeRateModalOpen(false)}
      />
    </>
  );
}
