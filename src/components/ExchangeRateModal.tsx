import { X, RefreshCw } from 'lucide-react';
import { EXCHANGE_RATES, fetchExchangeRates } from '../utils/currency-service';
import { useState } from 'react';

interface ExchangeRateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ExchangeRateModal({ isOpen, onClose }: ExchangeRateModalProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedRates, setEditedRates] = useState<Record<string, number>>({});
    // Force re-render to show updated rates
    const [_, setTick] = useState(0);

    if (!isOpen) return null;

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchExchangeRates();
        setTick(t => t + 1);
        setIsRefreshing(false);
    };

    const handleEdit = () => {
        setEditedRates({ ...EXCHANGE_RATES });
        setIsEditing(true);
    };

    const handleSave = () => {
        // Update global rates
        Object.keys(editedRates).forEach(key => {
            EXCHANGE_RATES[key] = editedRates[key];
        });
        setIsEditing(false);
        // Notify app to re-render converted prices
        window.dispatchEvent(new Event('exchange-rates-updated'));
    };

    const handleRateChange = (code: string, value: string, unit: number) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            setEditedRates(prev => ({
                ...prev,
                [code]: numValue / unit
            }));
        }
    };

    const currencies = [
        { code: 'USD', name: '미국 달러', flag: '🇺🇸' },
        { code: 'JPY', name: '일본 엔', flag: '🇯🇵' },
        { code: 'EUR', name: '유로', flag: '🇪🇺' },
        { code: 'THB', name: '태국 바트', flag: '🇹🇭' },
        { code: 'VND', name: '베트남 동', flag: '🇻🇳' },
        { code: 'CNY', name: '중국 위안', flag: '🇨🇳' },
        { code: 'TWD', name: '대만 달러', flag: '🇹🇼' },
        { code: 'HKD', name: '홍콩 달러', flag: '🇭🇰' },
        { code: 'SGD', name: '싱가포르 달러', flag: '🇸🇬' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <div
                className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col max-h-[85dvh] my-auto"
                style={{ maxHeight: '85dvh' }}
            >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between text-white flex-shrink-0">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        💱 실시간 환율 정보
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <button
                            onClick={isEditing ? handleSave : handleEdit}
                            className={`text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors font-medium ${isEditing
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {isEditing ? '저장 완료' : '환율 수정'}
                        </button>

                        {!isEditing && (
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="text-sm text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                새로고침
                            </button>
                        )}
                    </div>

                    <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0">
                        {currencies.map((currency) => {
                            const rate = isEditing ? (editedRates[currency.code] || 0) : EXCHANGE_RATES[currency.code];

                            // For JPY and VND, show per 100 or 1000 units for better readability
                            let displayRate = rate;
                            let unit = 1;

                            if (currency.code === 'JPY') {
                                displayRate = rate * 100;
                                unit = 100;
                            } else if (currency.code === 'VND') {
                                displayRate = rate * 100;
                                unit = 100;
                            }

                            return (
                                <div key={currency.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{currency.flag}</span>
                                        <div>
                                            <p className="font-bold text-gray-800">{currency.code}</p>
                                            <p className="text-xs text-gray-500">{currency.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {isEditing ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs text-gray-500">{unit} {currency.code} =</span>
                                                <input
                                                    type="number"
                                                    value={displayRate ? Math.round(displayRate * 100) / 100 : ''}
                                                    onChange={(e) => handleRateChange(currency.code, e.target.value, unit)}
                                                    className="w-20 px-2 py-1 text-right text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-bold text-gray-700">원</span>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="font-bold text-blue-600 text-sm">
                                                    {unit} {currency.code} = {displayRate ? displayRate.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : '-'}원
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    (1,000원 ≈ {rate ? (1000 / rate).toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : '-'} {currency.code})
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-xs text-center text-gray-400 mt-4 flex-shrink-0">
                        * {isEditing ? '직접 입력한 환율이 적용됩니다.' : '제공: open.er-api.com (기준: KRW)'}
                    </p>
                </div>
            </div>
        </div>
    );
}
