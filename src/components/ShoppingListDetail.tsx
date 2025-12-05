import { ArrowLeft, MapPin, Clock, Lightbulb, AlertTriangle, ShoppingCart, CheckCircle, Radio, Plus, Edit2 } from 'lucide-react';
import type { ShoppingLocation, ShoppingItem } from '../types';
import { convertFromKRW } from '../utils/currency-service';

interface ShoppingListDetailProps {
  location: ShoppingLocation;
  onBack: () => void;
  onItemPurchase: (locationId: string, itemId: string) => void;
  onStartLiveMode: () => void;
  onEditItem: (item: ShoppingItem) => void;
  onAddItem: () => void;
}

export function ShoppingListDetail({
  location,
  onBack,
  onItemPurchase,
  onStartLiveMode,
  onEditItem,
  onAddItem,
}: ShoppingListDetailProps) {
  const purchasedCount = location.items.filter((i) => i.purchased).length;
  const totalCount = location.items.length;
  const progress = totalCount > 0 ? (purchasedCount / totalCount) * 100 : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '높음';
      case 'medium':
        return '보통';
      case 'low':
        return '낮음';
      default:
        return priority;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center gap-2 hover:opacity-80">
            <ArrowLeft className="w-5 h-5" />
            <span>뒤로</span>
          </button>
          <button
            onClick={onAddItem}
            className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <h1 className="text-2xl mb-4">{location.location}</h1>

        <div className="space-y-2">
          {location.freeTime && (
            <div className="flex items-center gap-2 text-blue-100">
              <Clock className="w-4 h-4" />
              <span className="text-sm">자유시간: {location.freeTime}분</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span>구매 진행률</span>
            <span>
              {purchasedCount}/{totalCount}
            </span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {location.freeTime && (
          <button
            onClick={onStartLiveMode}
            className="w-full mt-4 bg-red-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
          >
            <Radio className="w-5 h-5" />
            <span>실시간 쇼핑 모드 시작</span>
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Tips */}
        {location.tips && location.tips.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium">💡 꿀팁</h3>
            </div>
            <ul className="space-y-2">
              {location.tips.map((tip, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {location.warnings && location.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-medium">⚠️ 주의사항</h3>
            </div>
            <ul className="space-y-2">
              {location.warnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Route */}
        {location.route && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <h3 className="font-medium">🗺️ 추천 동선</h3>
            </div>
            <p className="text-sm text-gray-700">{location.route}</p>
          </div>
        )}

        {/* Items */}
        <div>
          {/* Recommended Items Section */}
          {location.items.filter(i => i.isRecommended !== false).length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  🛍️ 추천 아이템
                  <span className="text-sm font-normal text-gray-500">
                    ({location.items.filter(i => i.isRecommended !== false).length}개)
                  </span>
                </h2>
              </div>

              <div className="space-y-4">
                {location.items.filter(i => i.isRecommended !== false).map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl shadow-md overflow-hidden transition-all ${item.purchased ? 'opacity-60' : ''
                      }`}
                  >
                    <div className="p-4">
                      {/* Header with Edit Button */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.source === 'guide' && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium border border-orange-200">
                              🏆 가이드 추천
                            </span>
                          )}
                          {item.source === 'ai' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium border border-purple-200">
                              🤖 AI 추천
                            </span>
                          )}
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {item.category}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded border ${getPriorityColor(
                              item.priority
                            )}`}
                          >
                            ⭐ {getPriorityLabel(item.priority)}
                          </span>
                        </div>
                        <button
                          onClick={() => onEditItem(item)}
                          className="text-gray-400 hover:text-blue-600 p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Product Name */}
                      <h3 className="text-lg font-bold mb-1">{item.product}</h3>
                      {item.brand && !item.product.toLowerCase().includes(item.brand.toLowerCase()) && (
                        <p className="text-sm text-gray-500 mb-2">{item.brand}</p>
                      )}

                      {/* Location Info */}
                      {(item.shopName || item.mallName) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{item.shopName || item.mallName}</span>
                        </div>
                      )}
                      {item.address && (
                        <p className="text-sm text-gray-500 mb-2">{item.address}</p>
                      )}

                      {/* Price */}
                      <div className="mb-3">
                        <span className="text-2xl text-blue-600 font-bold block">
                          {item.estimatedPrice.toLocaleString('ko-KR')}원
                        </span>
                        {item.currencyCode && (
                          <span className="text-sm text-gray-500">
                            (약 {convertFromKRW(item.estimatedPrice, item.currencyCode).toLocaleString()} {item.currencyCode})
                          </span>
                        )}
                      </div>

                      {/* Memo */}
                      {item.memo && (
                        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-3">
                          <p className="text-xs text-yellow-700 font-bold mb-1">📝 메모</p>
                          <p className="text-sm text-gray-700">{item.memo}</p>
                        </div>
                      )}

                      {/* Reason */}
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
                        <p className="text-xs text-blue-700 font-bold mb-1">💡 왜 추천?</p>
                        <p className="text-sm text-gray-700">{item.reason}</p>
                      </div>

                      {/* Alternatives */}
                      {item.alternatives && item.alternatives.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm mb-2">🔄 대체 상품</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {item.alternatives.map((alt, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-gray-400">•</span>
                                {alt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Purchase Status */}
                      {item.purchasedBy && (
                        <p className="text-sm text-green-600 mb-3">
                          ✅ {item.purchasedBy}님이 구매 완료
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => onItemPurchase(location.id, item.id)}
                          className={`flex-1 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${item.purchased
                            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                        >
                          {item.purchased ? (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              <span>구매 완료</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-5 h-5" />
                              <span>구매 완료 표시</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Items Section */}
          {location.items.filter(i => i.isRecommended === false).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-purple-700">
                  📝 내 아이템
                  <span className="text-sm font-normal text-gray-500">
                    ({location.items.filter(i => i.isRecommended === false).length}개)
                  </span>
                </h2>
              </div>

              <div className="space-y-4">
                {location.items.filter(i => i.isRecommended === false).map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl shadow-md overflow-hidden transition-all border-l-4 border-purple-500 ${item.purchased ? 'opacity-60' : ''
                      }`}
                  >
                    <div className="p-4">
                      {/* Header with Edit Button */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            직접 추가
                          </span>
                        </div>
                        <button
                          onClick={() => onEditItem(item)}
                          className="text-gray-400 hover:text-blue-600 p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Product Name */}
                      <h3 className="text-lg font-bold mb-1">{item.product}</h3>

                      {/* Location Info */}
                      {(item.shopName || item.mallName) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{item.shopName || item.mallName}</span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="mb-3">
                        <span className="text-2xl text-blue-600 font-bold block">
                          {item.estimatedPrice.toLocaleString('ko-KR')}원
                        </span>
                        {item.currencyCode && (
                          <span className="text-sm text-gray-500">
                            (약 {convertFromKRW(item.estimatedPrice, item.currencyCode).toLocaleString()} {item.currencyCode})
                          </span>
                        )}
                      </div>

                      {/* Memo */}
                      {item.memo && (
                        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-3">
                          <p className="text-xs text-yellow-700 font-bold mb-1">📝 메모</p>
                          <p className="text-sm text-gray-700">{item.memo}</p>
                        </div>
                      )}

                      {/* Purchase Status */}
                      {item.purchasedBy && (
                        <p className="text-sm text-green-600 mb-3">
                          ✅ {item.purchasedBy}님이 구매 완료
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => onItemPurchase(location.id, item.id)}
                          className={`flex-1 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${item.purchased
                            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                        >
                          {item.purchased ? (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              <span>구매 완료</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-5 h-5" />
                              <span>구매 완료 표시</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-md p-6 sticky bottom-4">
          <div className="flex items-center justify-between">
            <span className="text-lg">소계</span>
            <span className="text-2xl text-blue-600">
              {location.subtotal.toLocaleString('ko-KR')}원
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
