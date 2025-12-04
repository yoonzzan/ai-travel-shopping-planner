import { ArrowLeft, ShoppingBag, Plane, Calendar, CreditCard, Home, Users } from 'lucide-react';
import type { TravelInfo, ShoppingPlan, Screen } from '../types';

interface TimelineViewProps {
  travelInfo: TravelInfo;
  shoppingPlan: ShoppingPlan;
  onBack: () => void;
  onNavigate: (page: Screen) => void;
  onUpdateItemStatus: (itemId: string, purchased: boolean, locationId: string) => void;
}

export function TimelineView({ travelInfo, shoppingPlan, onBack, onNavigate, onUpdateItemStatus }: TimelineViewProps) {
  // Helper to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`;
  };

  // Calculate dates
  const startDate = new Date(travelInfo.startDate);
  const oneWeekBefore = new Date(startDate);
  oneWeekBefore.setDate(startDate.getDate() - 7);
  const threeDaysBefore = new Date(startDate);
  threeDaysBefore.setDate(startDate.getDate() - 3);
  const oneDayBefore = new Date(startDate);
  oneDayBefore.setDate(startDate.getDate() - 1);

  // Deduplicate locations for the header (robust deduplication)
  const uniqueLocations = Array.from(new Set(
    (travelInfo.schedule || [])
      .flatMap(s => (s.location || '').split(','))
      .map(l => l.trim())
      .filter(l => l.length > 0)
  ));

  // Group city shopping by day
  const shoppingByDay = Object.values(shoppingPlan.cityShopping).reduce((acc, location) => {
    if (location.day) {
      if (!acc[location.day]) acc[location.day] = [];
      acc[location.day].push(location);
    }
    return acc;
  }, {} as Record<number, typeof shoppingPlan.cityShopping[keyof typeof shoppingPlan.cityShopping][]>);

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      {/* Header */}
      <div className="bg-blue-600 bg-gradient-to-b from-blue-600 to-purple-600 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-xl relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

        <div className="relative z-10 max-w-md mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity text-white">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">뒤로</span>
          </button>

          <div className="flex items-start gap-4 mb-2">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1 text-white">쇼핑 타임라인</h1>
              <p className="text-blue-100 font-medium text-sm opacity-90 leading-relaxed">
                {uniqueLocations.join(', ')} {travelInfo.schedule?.length}일 여행
              </p>
            </div>
          </div>

          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl py-2 px-4 inline-block border border-white/10">
            <p className="text-sm font-medium text-white">
              {new Date(travelInfo.startDate).toISOString().split('T')[0]} ~ {new Date(travelInfo.endDate).toISOString().split('T')[0]}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Content - Two Column Layout */}
      <div className="px-4 -mt-4 relative z-0 max-w-md mx-auto">
        <div className="space-y-0">

          {/* 1. Preparation Phase: D-7 */}
          <div className="flex gap-4">
            <div className="w-20 flex flex-col items-center relative">
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200"></div>
              <div className="relative z-10 pt-8 flex flex-col items-center bg-gray-50 w-full">
                <span className="text-xs font-bold text-gray-400 mb-1">{formatDate(oneWeekBefore.toISOString())}</span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">D-7</span>
              </div>
            </div>
            <div className="flex-1 pt-8 pb-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-500" />
                  온라인 면세점 주문
                </h4>
              </div>
            </div>
          </div>

          {/* 2. Preparation Phase: D-3 */}
          <div className="flex gap-4">
            <div className="w-20 flex flex-col items-center relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200"></div>
              <div className="relative z-10 pt-4 flex flex-col items-center bg-gray-50 w-full">
                <span className="text-xs font-bold text-gray-400 mb-1">{formatDate(threeDaysBefore.toISOString())}</span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">D-3</span>
              </div>
            </div>
            <div className="flex-1 pt-4 pb-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-green-500" />
                  환전 및 카드 준비
                </h4>
              </div>
            </div>
          </div>

          {/* 3. Departure Duty Free (D-Day) */}
          <div className="flex gap-4">
            <div className="w-20 flex flex-col items-center relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200"></div>
              <div className="relative z-10 pt-4 flex flex-col items-center bg-gray-50 w-full">
                <span className="text-xs font-bold text-blue-600 mb-1">출국일</span>
                <span className="text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">D-Day</span>
              </div>
            </div>
            <div className="flex-1 pt-4 pb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-blue-50/30">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-gray-900">인천공항 출국 면세점</h4>
                    <span className="font-bold text-blue-600">
                      {shoppingPlan.dutyFree.departure.subtotal.toLocaleString()}원
                    </span>
                  </div>
                </div>
                {shoppingPlan.dutyFree.departure.items.length > 0 ? (
                  <div className="p-3 space-y-2">
                    {shoppingPlan.dutyFree.departure.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => onUpdateItemStatus(item.id, !item.purchased, 'departure')}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${item.purchased
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                            }`}
                        >
                          {item.purchased && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={item.purchased
                              ? "text-sm truncate text-gray-400 decoration-2"
                              : "text-sm truncate text-gray-700 font-medium"}
                            style={{ textDecoration: item.purchased ? 'line-through' : 'none' }}
                          >
                            {item.product}
                          </p>
                          <p
                            className={item.purchased
                              ? "text-xs text-gray-400 decoration-2"
                              : "text-xs text-gray-400"}
                            style={{ textDecoration: item.purchased ? 'line-through' : 'none' }}
                          >
                            {item.estimatedPrice.toLocaleString()}원
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-400 text-sm">쇼핑 계획이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Daily Itinerary */}
          {(travelInfo.schedule || []).map((day, index) => {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + (day.day - 1));
            const dayShopping = shoppingByDay[day.day] || [];
            const isLastDay = index === (travelInfo.schedule?.length || 0) - 1;

            const daySchedule = travelInfo.schedule?.find(s => s.day === day.day);
            const locationOrder = daySchedule?.location?.split(/[,/·&+|]+/).map(l => l.trim()).filter(Boolean) || [];

            // Clean up location names for display
            const displayShopping = [...dayShopping].sort((a, b) => {
              const indexA = locationOrder.findIndex(l => a.location.includes(l) || l.includes(a.location));
              const indexB = locationOrder.findIndex(l => b.location.includes(l) || l.includes(b.location));
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
            }).map(loc => ({
              ...loc,
              location: loc.location.split('(')[0].replace(/\)/g, '').trim()
            }));

            return (
              <div key={day.day} className="flex gap-4">
                {/* Left Column: Date/Time */}
                <div className="w-20 flex flex-col items-center relative">
                  {/* Vertical Line */}
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200 ${isLastDay ? 'h-8' : ''}`}></div>

                  <div className="relative z-10 pt-6 pb-2 flex flex-col items-center bg-gray-50 w-full">
                    <span className="text-sm font-bold text-gray-900 mb-1">
                      {currentDate.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })}
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {day.day}일차
                    </span>
                  </div>
                </div>

                {/* Right Column: Shopping Items */}
                <div className="flex-1 pt-4 pb-8">
                  {displayShopping.length > 0 ? (
                    displayShopping.map((location, idx) => (
                      <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 hover:shadow-md transition-shadow">
                        <div className="p-4 border-b border-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg mb-1">{location.location}</h4>
                            </div>
                            <span className="font-bold text-blue-600">
                              {location.subtotal.toLocaleString()}원
                            </span>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="p-4 space-y-3">
                          {location.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center group cursor-pointer"
                              onClick={() => onUpdateItemStatus(item.id, !item.purchased, location.id)}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${item.purchased
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-gray-300 group-hover:border-blue-400'
                                    }`}
                                >
                                  {item.purchased && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                                </div>
                                <div className="min-w-0">
                                  <p
                                    className={item.purchased
                                      ? "text-sm truncate text-gray-400 line-through decoration-2"
                                      : "text-sm truncate text-gray-700 font-medium"}
                                    style={{ textDecoration: item.purchased ? 'line-through' : 'none' }}
                                  >
                                    {item.product}
                                  </p>
                                  <p
                                    className={item.purchased
                                      ? "text-xs text-gray-400 line-through decoration-2"
                                      : "text-xs text-gray-400"}
                                    style={{ textDecoration: item.purchased ? 'line-through' : 'none' }}
                                  >
                                    {item.estimatedPrice.toLocaleString()}원
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 rounded-2xl p-6 text-center border border-dashed border-gray-200">
                      <p className="text-gray-400 text-sm">이날은 쇼핑 계획이 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 5. Arrival */}
          <div className="flex gap-4">
            <div className="w-20 flex flex-col items-center relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-200"></div>
              <div className="relative z-10 w-8 h-8 rounded-full bg-blue-600 border-4 border-white shadow-sm flex items-center justify-center mt-8">
                <Plane className="w-4 h-4 text-white transform rotate-90" />
              </div>
            </div>

            <div className="flex-1 pt-8 pb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-blue-50/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900">인천공항 입국 면세점</h4>
                    </div>
                    <span className="font-bold text-blue-600">
                      {shoppingPlan.dutyFree.arrival.subtotal.toLocaleString()}원
                    </span>
                  </div>
                </div>
                {shoppingPlan.dutyFree.arrival.items.length > 0 && (
                  <div className="p-3 space-y-2">
                    {shoppingPlan.dutyFree.arrival.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => onUpdateItemStatus(item.id, !item.purchased, 'arrival')}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${item.purchased
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                            }`}
                        >
                          {item.purchased && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={item.purchased
                              ? "text-sm truncate text-gray-400 decoration-2"
                              : "text-sm truncate text-gray-700 font-medium"}
                            style={{ textDecoration: item.purchased ? 'line-through' : 'none' }}
                          >
                            {item.product}
                          </p>
                          <p
                            className={item.purchased
                              ? "text-xs text-gray-400 decoration-2"
                              : "text-xs text-gray-400"}
                            style={{ textDecoration: item.purchased ? 'line-through' : 'none' }}
                          >
                            {item.estimatedPrice.toLocaleString()}원
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-3 flex justify-around items-center z-50 pb-6 md:pb-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => onNavigate('home')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">홈</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 text-blue-600"
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
    </div>
  );
}
