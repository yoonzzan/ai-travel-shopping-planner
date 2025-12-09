import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import type { ShoppingPlan, ShoppingItem, TravelInfo } from '../types';
import { convertToKRW } from '../utils/currency-service';

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (productName: string, price: number, locationId: string, memo: string, localPrice?: number, currencyCode?: string) => void;
    onEdit?: (originalLocationId: string, itemId: string, productName: string, price: number, newLocationId: string, memo: string, localPrice?: number, currencyCode?: string) => void;
    onDelete?: (locationId: string, itemId: string) => void;
    shoppingPlan: ShoppingPlan;
    travelInfo: TravelInfo | null;
    initialItem?: { item: ShoppingItem; locationId: string } | null;
}

export function AddItemModal({ isOpen, onClose, onAdd, onEdit, onDelete, shoppingPlan, travelInfo, initialItem }: AddItemModalProps) {
    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [locationId, setLocationId] = useState('departure');
    const [memo, setMemo] = useState('');
    const [currency, setCurrency] = useState('KRW');
    const [showError, setShowError] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Hide error when user types
    useEffect(() => {
        if (productName && price) setShowError(false);
    }, [productName, price]);

    // Reset confirm state after 3 seconds if not clicked
    useEffect(() => {
        if (confirmDelete) {
            const timer = setTimeout(() => setConfirmDelete(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [confirmDelete]);

    useEffect(() => {
        if (isOpen) {
            if (initialItem) {
                setProductName(initialItem.item.product);
                setPrice(initialItem.item.estimatedPrice.toLocaleString('ko-KR'));
                setLocationId(initialItem.locationId);
                setMemo(initialItem.item.memo || '');
                setCurrency(initialItem.item.currencyCode || 'KRW');
            } else {
                setProductName('');
                setPrice('');
                setLocationId('departure');
                setMemo('');
                setCurrency('KRW');
            }
            setShowError(false);
            setConfirmDelete(false);
        }
    }, [isOpen, initialItem]);

    if (!isOpen) return null;

    const handleDelete = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        if (initialItem && onDelete) {
            onDelete(initialItem.locationId, initialItem.item.id);
            onClose();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!productName || !price) {
            setShowError(true);
            return;
        }

        const numericPrice = parseInt(price.replace(/,/g, ''));

        // If currency is not KRW, calculate estimated KRW price
        // And store the original input as localPrice
        let estimatedKRW = numericPrice;
        let localPrice: number | undefined = undefined;
        let currencyCode: string | undefined = undefined;

        if (currency !== 'KRW') {
            estimatedKRW = convertToKRW(numericPrice, currency);
            localPrice = numericPrice;
            currencyCode = currency;
        }

        if (initialItem && onEdit) {
            // We need to update the onEdit signature in App.tsx and types to accept these new fields
            // For now, let's assume we pass them as part of a larger object or update the signature
            // But wait, the current onEdit signature is fixed.
            // Let's check the props definition.
            // onEdit: (originalLocationId: string, itemId: string, productName: string, price: number, newLocationId: string, memo: string) => void;
            // It doesn't support extra fields yet. We need to update the interface first.

            // Actually, let's just pass the estimated KRW price for now to satisfy the interface, 
            // but we really should update the interface to support local price.
            // Let's update the interface in the next step.
            onEdit(initialItem.locationId, initialItem.item.id, productName, estimatedKRW, locationId, memo, localPrice, currencyCode);
        } else {
            onAdd(productName, estimatedKRW, locationId, memo, localPrice, currencyCode);
        }

        onClose();
    };



    const formatPrice = (value: string) => {
        const num = value.replace(/[^0-9]/g, '');
        return num ? parseInt(num).toLocaleString('ko-KR') : '';
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrice(formatPrice(e.target.value));
    };

    const isEditMode = !!initialItem;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className={`p-4 flex items-center justify-between text-white ${isEditMode ? 'bg-gray-800' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        {isEditMode ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {isEditMode ? '아이템 수정' : '쇼핑 아이템 추가'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            상품명 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="예: 설화수 자음생 세트"
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${showError && !productName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                            autoFocus={!isEditMode}
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                예상 가격 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={price}
                                onChange={handlePriceChange}
                                placeholder="150,000"
                                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${showError && !price ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                inputMode="numeric"
                            />
                        </div>
                        <div className="w-24">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                통화
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="KRW">KRW</option>
                                <option value="USD">USD</option>
                                <option value="JPY">JPY</option>
                                <option value="THB">THB</option>
                                <option value="VND">VND</option>
                                <option value="EUR">EUR</option>
                                <option value="CNY">CNY</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            구매 장소 / 일차
                        </label>
                        <select
                            value={locationId}
                            onChange={(e) => setLocationId(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                        >
                            <optgroup label="면세점">
                                <option value="departure">✈️ 출국 면세점</option>
                                <option value="arrival">🛬 입국 면세점</option>
                            </optgroup>
                            <optgroup label="현지 쇼핑 (일차별)">
                                {travelInfo?.schedule ? (
                                    travelInfo.schedule.map((s) => {
                                        // Find existing shopping locations for this day
                                        const existingLocs = Object.values(shoppingPlan.cityShopping).filter(
                                            (loc) => loc.day === s.day
                                        );

                                        if (existingLocs.length > 0) {
                                            return existingLocs.map((loc) => (
                                                <option key={loc.id} value={loc.id}>
                                                    📅 {loc.day}일차 - {loc.location.split('(')[0].trim()}
                                                </option>
                                            ));
                                        } else {
                                            // No existing location for this day, allow creating one
                                            return (
                                                <option key={`new-${s.day}`} value={`NEW:${s.day}:${s.location}`}>
                                                    📅 {s.day}일차 - {s.location.split('(')[0].trim()}
                                                </option>
                                            );
                                        }
                                    })
                                ) : (
                                    Object.values(shoppingPlan.cityShopping)
                                        .sort((a, b) => (a.day || 0) - (b.day || 0))
                                        .map((loc) => (
                                            <option key={loc.id} value={loc.id}>
                                                📅 {loc.day}일차 - {loc.location.split('(')[0].trim()}
                                            </option>
                                        ))
                                )}
                            </optgroup>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            메모 (선택사항)
                        </label>
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="사이즈, 색상, 선물 대상 등 메모"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none h-24"
                        />
                    </div>

                    {showError && (
                        <div className="text-red-500 text-sm text-center font-medium animate-pulse bg-red-50 py-2 rounded-lg border border-red-100">
                            ⚠️ 상품명과 가격을 모두 입력해주세요.
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        {isEditMode && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className={`flex-1 py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${confirmDelete
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                                    }`}
                            >
                                <Trash2 className="w-5 h-5" />
                                {confirmDelete ? '확인 (삭제)' : '삭제'}
                            </button>
                        )}
                        <button
                            type="submit"
                            className={`flex-[2] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all shadow-lg ${isEditMode
                                ? 'bg-gray-800 hover:bg-gray-900 shadow-gray-200'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                }`}
                        >
                            {isEditMode ? '수정 완료' : '추가하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
