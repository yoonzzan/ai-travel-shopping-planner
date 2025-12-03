import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Navigation, CheckCircle, ShoppingCart, AlertCircle } from 'lucide-react';
import type { ShoppingLocation } from '../types';

interface LiveShoppingProps {
  location: ShoppingLocation;
  onBack: () => void;
  onItemPurchase: (itemId: string) => void;
}

export function LiveShopping({ location, onBack, onItemPurchase }: LiveShoppingProps) {
  const [timeRemaining, setTimeRemaining] = useState(location.freeTime || 60);

  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 60000); // Decrease by 1 minute every 60 seconds

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const totalTime = location.freeTime || 60;
  const percentage = ((totalTime - timeRemaining) / totalTime) * 100;
  const purchasedCount = location.items.filter((i) => i.purchased).length;
  const totalCount = location.items.length;

  const getTimeColor = () => {
    if (timeRemaining <= 15) return 'text-red-600';
    if (timeRemaining <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}시간 ${mins}분` : `${mins}분`;
  };

  // Mock map location
  const mockShops = [
    { name: '전통 찻집', distance: 150, time: 2, isPurchased: false },
    { name: '한약재 가게', distance: 300, time: 4, isPurchased: false },
    { name: '기념품 상점', distance: 450, time: 6, isPurchased: false },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with Timer */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 rounded-b-3xl shadow-lg">
        <button onClick={onBack} className="flex items-center gap-2 mb-4 hover:opacity-80">
          <ArrowLeft className="w-5 h-5" />
          <span>실시간 모드 종료</span>
        </button>

        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm">LIVE</span>
          </div>
          <h1 className="text-2xl mb-1">{location.location}</h1>
          <p className="text-red-100 text-sm">지금 자유시간입니다!</p>
        </div>

        {/* Countdown Timer */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <div className="text-center mb-4">
            <div className={`text-5xl mb-2 ${getTimeColor()}`}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-red-100">남은 시간</p>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all ${timeRemaining <= 15 ? 'bg-red-500' : timeRemaining <= 30 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-center text-red-100">
            {percentage.toFixed(0)}% 시간 경과
          </p>

          {timeRemaining <= 15 && (
            <div className="mt-3 bg-red-500 rounded-lg p-3 text-center animate-pulse">
              <AlertCircle className="w-5 h-5 mx-auto mb-1" />
              <p className="text-sm">⚠️ 15분 후 집합입니다! 지금 계산 마무리하세요</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Shopping Progress */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg">🛍️ 쇼핑 진행률</h2>
            <span className="text-sm">
              {purchasedCount}/{totalCount} 완료
            </span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
              style={{ width: `${(purchasedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Map View */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg">📍 현재 위치</h2>
          </div>

          {/* Mock Map */}
          <div className="relative bg-gray-700 rounded-lg h-48 mb-3 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center animate-pulse">
                  <Navigation className="w-8 h-8" />
                </div>
                <p className="text-sm text-gray-300">내 위치</p>
              </div>
            </div>
            {/* Mock pins */}
            <div className="absolute top-4 right-8">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute bottom-8 left-12">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm text-gray-400 mb-2">주변 추천 가게</h3>
            {mockShops.map((shop, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-sm">{shop.name}</p>
                    <p className="text-xs text-gray-400">
                      {shop.distance}m 거리 (도보 {shop.time}분)
                    </p>
                  </div>
                </div>
                <button className="text-xs bg-blue-600 px-3 py-1 rounded-full hover:bg-blue-700">
                  길 안내
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Shopping List */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="text-lg mb-3">🛍️ 오늘 쇼핑 리스트 ({totalCount}개)</h2>

          <div className="space-y-3">
            {location.items.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg transition-all ${item.purchased
                  ? 'bg-green-900/30 border border-green-600'
                  : 'bg-gray-700 border border-gray-600'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {item.purchased ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <ShoppingCart className="w-5 h-5 text-gray-400" />
                      )}
                      <h3 className="text-sm">{item.product}</h3>
                    </div>

                    {item.shopName && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span>{item.shopName}</span>
                      </div>
                    )}

                    <p className="text-sm text-blue-400 mb-1">
                      {item.estimatedPrice.toLocaleString('ko-KR')}원
                    </p>

                    {item.purchased ? (
                      <div className="flex items-center gap-2 text-xs text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        <span>구매 완료</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onItemPurchase(item.id)}
                        className="mt-2 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        구매 완료 표시
                      </button>
                    )}
                  </div>

                  {item.priority === 'high' && !item.purchased && (
                    <span className="text-xs bg-red-500 px-2 py-1 rounded-full">
                      필수
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-blue-600 p-4 rounded-xl hover:bg-blue-700 transition-colors">
            <span className="text-2xl mb-2 block">📞</span>
            <p className="text-sm">가이드 연락</p>
          </button>
          <button className="bg-purple-600 p-4 rounded-xl hover:bg-purple-700 transition-colors">
            <span className="text-2xl mb-2 block">📸</span>
            <p className="text-sm">구매 인증 사진</p>
          </button>
        </div>

        {/* Emergency Notice */}
        {timeRemaining <= 15 && (
          <div className="bg-red-600 rounded-xl p-4 text-center animate-pulse">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <h3 className="mb-2">🚨 곧 집합 시간입니다!</h3>
            <p className="text-sm text-red-100 mb-3">
              {formatTime(timeRemaining)} 후 집합 장소로 이동하세요
            </p>
            <button className="w-full py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              집합 장소 위치 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
