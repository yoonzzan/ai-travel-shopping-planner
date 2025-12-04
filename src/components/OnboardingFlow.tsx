import { useState, useEffect } from 'react';
import { Sparkles, Check, MapPin, ShoppingBag, Users, DollarSign } from 'lucide-react';
import type { TravelInfo, ShoppingPlan } from '../types';
import { generateShoppingPlan, parseItineraryFile } from '../utils/ai-service';
import { createTrip, saveShoppingPlan } from '../utils/db-service';
import { supabase } from '../supabase/client';
import { FileUpload } from './FileUpload';
import { compressImage } from '../utils/image-utils';

interface OnboardingFlowProps {
    onComplete: (info: TravelInfo, plan: ShoppingPlan) => void;
}

type Step = 1 | 2 | 3 | 4 | 5;



import { CityTagInput } from './ui/CityTagInput';
import { LoadingScreen } from './ui/LoadingScreen';

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [step, setStep] = useState<Step>(1);
    const [isGenerating, setIsGenerating] = useState(false);

    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('2025-12-15');
    const [endDate, setEndDate] = useState('2025-12-19');
    const [budget, setBudget] = useState('500000');
    const [preferences, setPreferences] = useState<string[]>([]);
    const [purposes, setPurposes] = useState<string[]>([]);
    const [schedule, setSchedule] = useState<{ day: number; date: string; location: string }[]>([]);


    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const preferenceOptions = [
        { id: 'cosmetics', label: '화장품/스킨케어', emoji: '💄' },
        { id: 'fashion', label: '패션/잡화', emoji: '👜' },
        { id: 'electronics', label: '전자제품', emoji: '📱' },
        { id: 'food', label: '식품/특산품', emoji: '🍜' },
        { id: 'alcohol', label: '주류/담배', emoji: '🍾' },
    ];

    const purposeOptions = [
        { id: 'self', label: '본인용', emoji: '😊' },
        { id: 'family', label: '가족 선물', emoji: '👨‍👩‍👧‍👦' },
        { id: 'friends', label: '친구 선물', emoji: '🎁' },
        { id: 'colleagues', label: '회사 동료', emoji: '💼' },
    ];

    const togglePreference = (id: string) => {
        setPreferences(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const togglePurpose = (id: string) => {
        setPurposes(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };



    const [isParsing, setIsParsing] = useState(false);

    const processFile = async (file: File) => {
        if (!file) return;

        const isValidType = file.type.startsWith('image/') ||
            file.type === 'application/pdf' ||
            /\.(jpg|jpeg|png|webp|pdf)$/i.test(file.name);

        if (!isValidType) {
            alert(`이미지 또는 PDF 파일만 업로드 가능합니다.\n(감지된 파일 타입: ${file.type || '알 수 없음'})`);
            return;
        }

        setIsParsing(true);
        try {
            let base64Content = '';
            let mimeType = file.type;

            if (file.type.startsWith('image/')) {
                // Compress image to ensure it fits within Vercel's 4.5MB limit
                base64Content = await compressImage(file);
                mimeType = 'image/jpeg'; // Compressed output is always JPEG
            } else {
                // PDF handling
                if (file.size > 4 * 1024 * 1024) { // 4MB limit safety buffer
                    alert('PDF 파일이 너무 큽니다 (4MB 제한). 더 작은 파일을 올려주세요.');
                    setIsParsing(false);
                    return;
                }

                base64Content = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = reader.result as string;
                        resolve(result.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            const parsedData = await parseItineraryFile(base64Content, mimeType);

            if (parsedData.destination) setDestination(parsedData.destination);
            if (parsedData.startDate) setStartDate(parsedData.startDate);
            if (parsedData.endDate) setEndDate(parsedData.endDate);
            if (parsedData.schedule) setSchedule(parsedData.schedule);

            alert('여행 일정을 성공적으로 불러왔습니다!');
            setIsParsing(false);
        } catch (error) {
            console.error('Parsing failed:', error);
            alert('일정표 파싱에 실패했습니다. 파일이 너무 크거나 형식이 올바르지 않을 수 있습니다.');
            setIsParsing(false);
        }
    };

    const handleGeneratePlan = async () => {
        setIsGenerating(true);
        setStep(5);

        try {
            // Derive destination from schedule
            const uniqueCities = Array.from(new Set(schedule.map(s => s.location).filter(Boolean)));
            const derivedDestination = uniqueCities.join(', ');

            const travelInfo: TravelInfo = {
                destination: derivedDestination,
                startDate,
                endDate,
                budget: parseInt(budget),
                preferences,
                purposes,
                companions: [],
                schedule,
            };

            const shoppingPlan = await generateShoppingPlan(travelInfo);

            // Regenerate IDs to ensure uniqueness (fix for potential AI duplicate IDs)
            shoppingPlan.dutyFree.departure.items.forEach(item => item.id = crypto.randomUUID());
            shoppingPlan.dutyFree.arrival.items.forEach(item => item.id = crypto.randomUUID());
            Object.values(shoppingPlan.cityShopping).forEach(location => {
                location.items.forEach(item => item.id = crypto.randomUUID());
            });

            // Deduplicate items in cityShopping to prevent AI hallucinations
            Object.values(shoppingPlan.cityShopping).forEach(location => {
                const seenProducts = new Set();
                location.items = location.items.filter(item => {
                    const normalizedProduct = item.product.trim().toLowerCase();
                    if (seenProducts.has(normalizedProduct)) {
                        return false;
                    }
                    seenProducts.add(normalizedProduct);
                    return true;
                });
            });

            // Attempt to save to Supabase (Optional)
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const trip = await createTrip(session.user.id, travelInfo);
                    if (trip) {
                        await saveShoppingPlan(trip.id, shoppingPlan);
                    }
                }
            } catch (dbError) {
                console.warn('Failed to save to Supabase (Storage access might be blocked):', dbError);
            }

            setIsGenerating(false);

            setTimeout(() => {
                onComplete(travelInfo, shoppingPlan);
            }, 2000);

        } catch (error) {
            console.error('Failed to generate plan:', error);
            alert('쇼핑 플랜 생성 중 오류가 발생했습니다.');
            setIsGenerating(false);
            setStep(4);
        }
    };

    const goBack = () => {
        if (step > 1) setStep((prev) => (prev - 1) as Step);
    };

    // Helper to check if current step is valid
    const isStepValid = () => {
        if (step === 1) {
            const hasSchedule = schedule.length > 0 && schedule.some(s => s.location.trim().length > 0);
            return startDate && endDate && hasSchedule;
        }
        if (step === 2) return preferences.length > 0;
        if (step === 3) return purposes.length > 0;
        if (step === 4) return budget && parseInt(budget) > 0;
        return true;
    };

    return (
        <div className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-start pt-10 md:pt-20 p-4 pb-10 pb-[env(safe-area-inset-bottom)]">
            {/* Progress Stepper - Hide on step 5 (Analysis) */}
            {step !== 5 && (
                <div className="w-full max-w-2xl mb-8">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -z-10 rounded-full" />
                        <div
                            className="absolute left-0 top-1/2 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(((step - 1) / 3) * 100, 100)}%` }}
                        />
                        {[1, 2, 3, 4].map((s) => (
                            <div
                                key={s}
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${s <= step
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110'
                                    : 'bg-gray-200 text-gray-400'
                                    }`}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Card */}
            <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col">
                <div className="flex-1 p-6 md:p-12 overflow-y-auto">
                    {step === 1 && (
                        <div className="animate-fade-in space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MapPin className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900">여행 정보를 알려주세요</h2>
                                <p className="text-sm md:text-base text-gray-500">AI가 최적의 쇼핑 동선을 계획해드립니다.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">출발일</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-4 py-3 text-base bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">귀국일</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full px-4 py-3 text-base bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Daily Schedule Inputs */}
                                {startDate && endDate && (
                                    <div className="space-y-3 animate-fade-in">
                                        <label className="block text-sm font-semibold text-gray-700">일차별 여행 도시</label>
                                        <div className="bg-gray-50 rounded-xl p-3 space-y-3 border-2 border-transparent focus-within:border-blue-100 transition-colors">
                                            {(() => {
                                                const start = new Date(startDate);
                                                const end = new Date(endDate);
                                                const diffTime = Math.abs(end.getTime() - start.getTime());
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                                                if (diffDays > 0 && schedule.length !== diffDays) {
                                                    // Sync logic handled in rendering/onChange
                                                }

                                                return Array.from({ length: diffDays > 0 ? diffDays : 0 }).map((_, idx) => {
                                                    const dayNum = idx + 1;
                                                    const currentSchedule = schedule.find(s => s.day === dayNum);
                                                    const location = currentSchedule?.location || '';

                                                    return (
                                                        <div key={dayNum} className="flex items-center gap-3" style={{ zIndex: 50 - idx, position: 'relative' }}>
                                                            <span className="w-12 font-bold text-gray-500 text-sm whitespace-nowrap">{dayNum}일차</span>
                                                            <div className="flex-1 relative">
                                                                <CityTagInput
                                                                    value={location ? location.split(/[,/·&+|]+/).map(s => s.trim()).filter(Boolean) : []}
                                                                    onChange={(cities) => {
                                                                        const newLocation = cities.join(', ');
                                                                        setSchedule(prev => {
                                                                            const newSchedule = [...prev];
                                                                            const existingIdx = newSchedule.findIndex(s => s.day === dayNum);
                                                                            if (existingIdx >= 0) {
                                                                                newSchedule[existingIdx] = { ...newSchedule[existingIdx], location: newLocation };
                                                                            } else {
                                                                                const date = new Date(start);
                                                                                date.setDate(start.getDate() + idx);
                                                                                newSchedule.push({ day: dayNum, date: date.toISOString().split('T')[0], location: newLocation });
                                                                            }
                                                                            return newSchedule;
                                                                        });
                                                                    }}
                                                                    placeholder="방문 도시 입력"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-semibold text-gray-700">일정표 업로드</label>
                                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">선택사항</span>
                                    </div>
                                    <FileUpload
                                        onFileSelect={processFile}
                                        isParsing={isParsing}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in space-y-8">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShoppingBag className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">어떤 물건을 사고 싶으신가요?</h2>
                                <p className="text-gray-500">관심 카테고리를 모두 선택해주세요.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {preferenceOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => togglePreference(option.id)}
                                        className={`p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${preferences.includes(option.id)
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md shadow-blue-100'
                                            : 'border-gray-100 hover:border-blue-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-3xl mb-3 block">{option.emoji}</span>
                                        <span className="font-bold text-lg">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-in space-y-8">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">누구를 위한 쇼핑인가요?</h2>
                                <p className="text-gray-500">선물하실 대상을 선택해주세요.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {purposeOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => togglePurpose(option.id)}
                                        className={`p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${purposes.includes(option.id)
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md shadow-blue-100'
                                            : 'border-gray-100 hover:border-blue-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-3xl mb-3 block">{option.emoji}</span>
                                        <span className="font-bold text-lg">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="animate-fade-in space-y-8">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <DollarSign className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">예산은 어느 정도인가요?</h2>
                                <p className="text-gray-500">대략적인 쇼핑 예산을 입력해주세요.</p>
                            </div>
                            <div className="max-w-sm mx-auto space-y-4">
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₩</span>
                                    <input
                                        type="number"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        className="w-full pl-12 pr-6 py-6 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-blue-500 focus:ring-0 text-center text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none transition-all"
                                        placeholder="500,000"
                                    />
                                </div>
                                <div className="flex gap-2 justify-center">
                                    {[30, 50, 100, 200].map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => setBudget((amount * 10000).toString())}
                                            className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                                        >
                                            {amount}만
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="animate-fade-in text-center py-12">
                            {isGenerating ? (
                                <LoadingScreen destination={destination} />
                            ) : (
                                <>
                                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-green-200 animate-bounce-small mx-auto">
                                        <Check className="w-12 h-12 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-3">준비 완료!</h2>
                                    <p className="text-gray-500">
                                        맞춤형 쇼핑 리스트가 완성되었습니다
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>


                {/* Footer Navigation */}
                {step < 5 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50 grid grid-cols-3 gap-4">
                        {step > 1 && (
                            <button
                                onClick={goBack}
                                className="col-span-1 py-4 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-white hover:border-gray-300 transition-all"
                            >
                                이전
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (step === 4) {
                                    handleGeneratePlan();
                                } else {
                                    setStep((prev) => (prev + 1) as Step);
                                }
                            }}
                            disabled={!isStepValid()}
                            className={`py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 ${step === 1 ? 'col-span-3' : 'col-span-2'
                                } ${!isStepValid()
                                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                                }`}
                        >
                            {step === 4 ? (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    쇼핑 리스트 생성하기
                                </>
                            ) : (
                                '다음'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
