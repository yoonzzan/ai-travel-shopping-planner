import { ArrowLeft, Trash2, Bell, CreditCard, Globe, HelpCircle, Users, Home, Calendar } from 'lucide-react';

interface TripSettingsProps {
  onBack: () => void;
  onReset: () => void;
  onJoinTrip: () => void;
  onNavigate: (page: any) => void;
}

export function TripSettings({ onBack, onReset, onJoinTrip, onNavigate }: TripSettingsProps) {
  const handleReset = () => {
    if (confirm('정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      onReset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-b-3xl shadow-lg">
        <div className="max-w-md mx-auto p-6">
          <button onClick={onBack} className="flex items-center gap-2 mb-4 hover:opacity-80">
            <ArrowLeft className="w-5 h-5" />
            <span>뒤로</span>
          </button>

          <h1 className="text-2xl mb-1">⚙️ 설정</h1>
          <p className="text-blue-100">앱 설정 및 정보</p>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden opacity-60 pointer-events-none relative">
          <div className="absolute top-4 right-4 z-10">
            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200">준비 중</span>
          </div>
          <h2 className="text-lg p-4 border-b border-gray-100">알림 설정</h2>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm">여행 전 알림</p>
                  <p className="text-xs text-gray-500">출발 전 준비 사항 알림</p>
                </div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-full h-full bg-gray-300 peer-checked:bg-blue-600 rounded-full transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6" />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm">쇼핑 시간 알림</p>
                  <p className="text-xs text-gray-500">자유시간 시작 전 알림</p>
                </div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-full h-full bg-gray-300 peer-checked:bg-blue-600 rounded-full transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6" />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm">집합 시간 알림</p>
                  <p className="text-xs text-gray-500">집합 15분 전 알림</p>
                </div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-full h-full bg-gray-300 peer-checked:bg-blue-600 rounded-full transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6" />
              </label>
            </div>
          </div>
        </div>

        {/* Payment & Currency */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden opacity-60 pointer-events-none relative">
          <div className="absolute top-4 right-4 z-10">
            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200">준비 중</span>
          </div>
          <h2 className="text-lg p-4 border-b border-gray-100">결제 & 화폐</h2>
          <div className="p-4 space-y-4">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="text-sm">선호 결제 수단</span>
              </div>
              <span className="text-sm text-gray-500">신용카드 →</span>
            </button>

            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-600" />
                <span className="text-sm">통화 설정</span>
              </div>
              <span className="text-sm text-gray-500">KRW (원) →</span>
            </button>
          </div>
        </div>

        {/* Trip Management */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden opacity-60 pointer-events-none relative">
          <div className="absolute top-4 right-4 z-10">
            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200">준비 중</span>
          </div>
          <h2 className="text-lg p-4 border-b border-gray-100">여행 관리</h2>
          <div className="p-4 space-y-4">
            <button
              onClick={onJoinTrip}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-sm">다른 여행 참여하기</span>
              </div>
              <span className="text-sm text-gray-500">ID 입력 →</span>
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden opacity-60 pointer-events-none relative">
          <div className="absolute top-4 right-4 z-10">
            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200">준비 중</span>
          </div>
          <h2 className="text-lg p-4 border-b border-gray-100">정보</h2>
          <div className="p-4 space-y-4">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-600" />
                <span className="text-sm">도움말</span>
              </div>
              <span className="text-sm text-gray-500">→</span>
            </button>

            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-600" />
                <span className="text-sm">개인정보 처리방침</span>
              </div>
              <span className="text-sm text-gray-500">→</span>
            </button>

            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-600" />
                <span className="text-sm">서비스 이용약관</span>
              </div>
              <span className="text-sm text-gray-500">→</span>
            </button>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                트래블카트 v1.0.0
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                © 2025 TravelCart. All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-red-200">
          <h2 className="text-lg p-4 border-b border-red-100 text-red-600">위험 영역</h2>
          <div className="p-4">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span>모든 데이터 초기화</span>
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              이 작업은 되돌릴 수 없습니다
            </p>
          </div>
        </div>

        {/* Feature Request */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 opacity-60 pointer-events-none relative">
          <div className="absolute top-4 right-4 z-10">
            <span className="text-[10px] font-bold bg-white text-blue-600 px-2 py-1 rounded-full border border-blue-100">준비 중</span>
          </div>
          <h3 className="mb-2">💡 기능 제안</h3>
          <p className="text-sm text-gray-600 mb-3">
            더 나은 서비스를 위해 여러분의 의견을 들려주세요!
          </p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            피드백 보내기
          </button>
        </div>
      </div>
      {/* Spacer for Bottom Nav */}
      <div className="h-32 w-full" aria-hidden="true"></div>
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
          onClick={() => onNavigate('timeline')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-medium">타임라인</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 text-blue-600"
        >
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-medium">설정</span>
        </button>
      </div>
    </div>
  );
}
