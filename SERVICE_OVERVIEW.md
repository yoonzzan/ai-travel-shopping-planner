# 🛍️ AI Travel Shopping Planner - 서비스 분석 보고서

## 📌 **서비스 목적**

**"여행 일정표를 업로드하면 AI가 자동으로 최적의 쇼핑 리스트와 동선을 계획해주는 스마트 여행 쇼핑 플래너"**

한국인 여행객들이 해외 여행 시 쇼핑을 효율적으로 계획하고 예산을 관리할 수 있도록 돕는 웹 애플리케이션입니다.

---

## 🎯 **핵심 기능**

### 1️⃣ **AI 기반 여행 일정 자동 분석**
- **입력**: 여행사 일정표 또는 E-ticket (이미지/PDF)
- **처리**: Google Gemini 2.5 Flash API를 브라우저에서 직접 호출하여 파싱
- **출력**: 여행지, 날짜, 일차별 도시 정보 자동 추출
- **특징**: Vercel 서버 제한(4.5MB)을 우회하기 위해 클라이언트 사이드에서 직접 API 호출

### 2️⃣ **맞춤형 쇼핑 플랜 생성**
- **사용자 입력 기반 추천**:
  - 예산 (30만원, 100만원 등)
  - 관심 카테고리 (화장품, 패션, 전자제품, 식품, 주류)
  - 구매 목적 (본인용, 가족 선물, 친구 선물, 회사 동료)
  
- **AI 추천 전략**:
  - **가이드 추천 (최대 30%)**: `guide_recommendations.json`에서 현지 가이드가 추천한 실제 인기 상품 2-3개 선택
  - **AI 트렌드 추천 (최소 70%)**: Gemini AI가 최신 트렌드 기반으로 독자적 추천
  - **출처 구분**: 각 아이템에 `source: 'guide' | 'ai'` 태그로 신뢰도 표시

- **예산 준수 로직**:
  - 서버 사이드에서 예산 초과 시 자동으로 아이템 제거
  - 우선순위: AI 추천 > 가이드 추천, 낮은 우선순위 > 높은 우선순위, 고가 아이템 우선 제거

### 3️⃣ **실시간 예산 관리**
- 총 예산 대비 사용 예산 시각화 (진행률 바)
- 면세점 vs 현지 쇼핑 비율 분석
- 구매 완료 아이템 추적 (체크박스)
- 남은 예산 실시간 계산

### 4️⃣ **타임라인 & 동선 최적화**
- 일차별 쇼핑 장소 및 아이템 배치
- 같은 도시 내 여러 날짜 방문 시 자동 그룹핑
- 도시별 쇼핑 아이템 통합 뷰 제공
- **이미지 공유 기능**: 타임라인을 이미지로 캡처하여 친구들과 공유 가능

### 5️⃣ **현지어 소통 지원**
- 모든 쇼핑 아이템에 `localName` 필드 포함
- 예: "말린 망고" → "Mamuang Ob Haeng (มะม่วงอบแห้ง)"
- 현지 상인에게 바로 보여줄 수 있는 큰 글씨 팝업 카드

### 6️⃣ **환율 계산 기능**
- 실시간 환율 정보 제공 (ExchangeRateModal)
- 현지 가격 → 원화 자동 변환
- 지원 통화: USD, JPY, THB, VND, EUR 등

### 7️⃣ **아이템 관리**
- 아이템 추가/수정/삭제
- 구매 여부 체크
- 메모 기능
- 장소 간 아이템 이동 가능

---

## 🗂️ **데이터 구조**

### **TypeScript 타입 정의** (`src/types/index.ts`)

#### 1. **TravelInfo** (여행 정보)
```typescript
{
  destination: string;          // 여행지 (예: "방콕, 파타야")
  startDate: string;             // 출발일 (YYYY-MM-DD)
  endDate: string;               // 귀국일 (YYYY-MM-DD)
  budget: number;                // 총 예산 (원화)
  preferences: string[];         // 관심 카테고리 ['cosmetics', 'fashion', ...]
  purposes: string[];            // 구매 목적 ['self', 'family', ...]
  companions?: string[];         // 동행자 (선택)
  schedule?: {                   // 일차별 일정
    day: number;                 // 일차 (1, 2, 3, ...)
    date: string;                // 날짜 (YYYY-MM-DD)
    location: string;            // 방문 도시 (예: "방콕", "파타야")
  }[];
}
```

#### 2. **ShoppingItem** (쇼핑 아이템)
```typescript
{
  id: string;                    // UUID
  category: string;              // 카테고리 (화장품, 식품, 패션 등)
  product: string;               // 상품명 (한국어)
  brand?: string;                // 브랜드명
  estimatedPrice: number;        // 예상 가격 (원화)
  localPrice?: number;           // 현지 가격
  currencyCode?: string;         // 통화 코드 (USD, JPY, THB 등)
  reason: string;                // 추천 이유
  priority: 'high' | 'medium' | 'low';  // 우선순위
  alternatives?: string[];       // 대체 상품
  shopName?: string;             // 구매 가능 매장
  address?: string;              // 매장 주소
  mallName?: string;             // 쇼핑몰 이름
  purchased: boolean;            // 구매 여부
  purchasedBy?: string;          // 구매자 (그룹 쇼핑용)
  memo?: string;                 // 사용자 메모
  isRecommended?: boolean;       // AI 추천 여부
  source?: 'guide' | 'ai';       // 출처 (가이드 추천 vs AI 추천)
  localName?: string;            // 현지어 상품명 (예: 태국어, 일본어)
}
```

#### 3. **ShoppingLocation** (쇼핑 장소)
```typescript
{
  id: string;                    // 장소 ID (예: "departure", "day_1_bangkok")
  location: string;              // 장소명 (예: "인천공항 면세점", "방콕")
  timing: string;                // 시기 (예: "출국 전", "여행 중")
  day?: number;                  // 여행 일차
  freeTime?: number;             // 자유 시간 (분)
  items: ShoppingItem[];         // 해당 장소에서 구매할 아이템 목록
  subtotal: number;              // 해당 장소 총 금액
  tips?: string[];               // 쇼핑 팁
  route?: string;                // 동선 정보
  warnings?: string[];           // 주의사항
}
```

#### 4. **ShoppingPlan** (전체 쇼핑 플랜)
```typescript
{
  dutyFree: {
    departure: ShoppingLocation; // 출국 면세점
    arrival: ShoppingLocation;   // 입국 면세점
  };
  cityShopping: Record<string, ShoppingLocation>;  // 도시별 쇼핑 (키: location ID)
  budgetSummary: {
    dutyFree: number;            // 면세점 총액
    cityShopping: number;        // 현지 쇼핑 총액
    total: number;               // 전체 총액
    remaining: number;           // 남은 예산
  };
  timeline: string[];            // 타임라인 요약 (예: ["1일차: 방콕", "2일차: 파타야"])
}
```

---

### **Supabase 데이터베이스 스키마** (`src/supabase/schema.sql`)

#### 1. **profiles** (사용자 프로필)
```sql
- id: UUID (auth.users 참조)
- email: TEXT
- full_name: TEXT
- avatar_url: TEXT
- updated_at: TIMESTAMP
```

#### 2. **trips** (여행 정보)
```sql
- id: UUID (Primary Key)
- user_id: UUID (auth.users 참조)
- destination: TEXT (여행지)
- start_date: DATE (시작일)
- end_date: DATE (종료일)
- budget: INTEGER (예산)
- preferences: TEXT[] (관심사 배열)
- purposes: TEXT[] (목적 배열)
- companions: TEXT[] (동행자 배열)
- created_at: TIMESTAMP
```

#### 3. **shopping_items** (쇼핑 아이템)
```sql
- id: UUID (Primary Key)
- trip_id: UUID (trips 참조)
- location_id: TEXT (장소 ID: 'departure', 'arrival', 'day_1_bangkok' 등)
- location_name: TEXT (장소명)
- category: TEXT (카테고리)
- product_name: TEXT (상품명)
- brand: TEXT (브랜드)
- estimated_price: INTEGER (예상 가격 - 원화)
- reason: TEXT (추천 이유)
- priority: TEXT ('high', 'medium', 'low')
- purchased: BOOLEAN (구매 여부)
- purchased_by: TEXT (구매자)
- shop_name: TEXT (매장명)
- is_recommended: BOOLEAN (AI 추천 여부)
- local_price: INTEGER (현지 가격)
- currency_code: TEXT (통화 코드)
- created_at: TIMESTAMP
```

#### **Row Level Security (RLS)**
- 사용자는 자신의 여행과 아이템만 조회/수정/삭제 가능
- 익명 로그인 지원 (`signInAnonymously`)

---

## 🏗️ **기술 아키텍처**

### **프론트엔드**
- **Framework**: React 19 + TypeScript + Vite
- **스타일링**: Tailwind CSS 4.1
- **상태 관리**: React Hooks (`useState`, `useEffect`, Custom Hooks)
- **UI 컴포넌트**: Radix UI (Accessible Components)
- **아이콘**: Lucide React
- **이미지 처리**: `html-to-image` (타임라인 캡처)

### **백엔드**
- **서버리스**: Vercel Edge Functions (`api/generate-plan.ts`)
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Auth (익명 로그인)
- **실시간 동기화**: Supabase Realtime Subscriptions

### **AI**
- **모델**: Google Gemini 2.5 Flash Lite Preview
- **용도**:
  1. 여행 일정표 파싱 (이미지/PDF → JSON)
  2. 쇼핑 플랜 생성 (사용자 정보 → 맞춤형 추천)
- **API 호출 방식**:
  - 일정표 파싱: 클라이언트 직접 호출 (Vercel 제한 우회)
  - 쇼핑 플랜 생성: 서버리스 함수 호출 (프롬프트 보안)

### **데이터 흐름**
```
1. 사용자 입력 (OnboardingFlow)
   ↓
2. 파일 업로드 → Gemini API (클라이언트) → 일정 파싱
   ↓
3. 여행 정보 + 가이드 데이터 → Vercel Function → Gemini API
   ↓
4. 쇼핑 플랜 생성 → Supabase 저장 + LocalStorage 백업
   ↓
5. HomePage 렌더링 (예산 관리, 장소별 리스트)
   ↓
6. 실시간 업데이트 (Supabase Realtime)
```

---

## 🔑 **핵심 로직**

### 1. **예산 준수 알고리즘** (`api/generate-plan.ts`)
```typescript
// AI가 예산을 초과한 경우 자동 트리밍
if (budgetSummary.total > budgetLimit) {
  // 1. 모든 아이템 수집
  // 2. 제거 우선순위 점수 계산
  //    - source: 'ai' (1000점) > 'guide' (0점)
  //    - priority: 'low' (500점) > 'medium' (200점) > 'high' (0점)
  //    - price: 높을수록 점수 증가
  // 3. 점수 높은 순으로 제거 (예산 충족까지)
  // 4. 총액 재계산
}
```

### 2. **도시 그룹핑 로직** (`HomePage.tsx`)
```typescript
// 같은 도시를 여러 날 방문하는 경우 통합
// 예: "방콕 (1일차)", "방콕 (3일차)" → "방콕 (1일차, 3일차)"
const cityGroups = Object.values(shoppingPlan.cityShopping).reduce((acc, location) => {
  const mainCityName = location.location.split('(')[0].trim();
  if (!acc[mainCityName]) acc[mainCityName] = [];
  acc[mainCityName].push(location);
  return acc;
}, {});
```

### 3. **실시간 동기화** (`useTripSubscription.ts`)
```typescript
// Supabase Realtime으로 다른 기기/사용자 변경사항 실시간 반영
supabase
  .channel(`trip-${tripId}`)
  .on('postgres_changes', { event: '*', table: 'shopping_items' }, (payload) => {
    // 로컬 shoppingPlan 업데이트
  })
  .subscribe();
```

### 4. **환율 변환** (`currency-service.ts`)
```typescript
// 현지 가격 → 원화 자동 변환
function convertToKRW(amount: number, currencyCode: string): number {
  const rates = getExchangeRates(); // localStorage에서 환율 정보 로드
  return Math.round(amount * rates[currencyCode]);
}
```

---

## 📱 **주요 화면 구성**

### 1. **OnboardingFlow** (온보딩)
- Step 1: 여행 날짜 + 일차별 도시 입력 + 일정표 업로드
- Step 2: 관심 카테고리 선택
- Step 3: 구매 목적 선택
- Step 4: 예산 입력
- Step 5: AI 분석 중 (로딩 애니메이션)

### 2. **HomePage** (메인 대시보드)
- 여행 정보 카드 (날짜, 도시, 일차별 스크롤)
- 예산 관리 카드 (진행률, 남은 예산, 면세점/현지 비율)
- 쇼핑 리스트 (출국 면세점 → 도시별 → 입국 면세점)
- FAB (Floating Action Button): 아이템 추가
- 하단 네비게이션: 홈, 타임라인, 설정

### 3. **ShoppingListDetail** (상세 리스트)
- 장소별 아이템 목록
- 아이템 카드: 상품명, 가격, 현지어, 구매 체크박스
- 현지어 보기 버튼 (큰 글씨 팝업)
- 실시간 쇼핑 모드 시작 버튼

### 4. **TimelineView** (타임라인)
- 일차별 쇼핑 계획 시각화
- 이미지 공유 기능 (html-to-image)
- 아이템 구매 체크

### 5. **TripSettings** (설정)
- 여행 정보 확인
- 데이터 초기화
- 여행 공유 (ID 입력)

---

## 🎨 **UI/UX 특징**

- **모바일 최적화**: 하단 네비게이션, Safe Area Inset 대응
- **드래그 스크롤**: 일차별 일정 카드 가로 스크롤
- **프로그레시브 디자인**: 그라데이션, 블러 효과, 애니메이션
- **접근성**: Radix UI 기반 키보드 네비게이션, ARIA 속성

---

## 🔐 **보안 및 성능**

### 보안
- **API 키 분리**:
  - `GEMINI_API_KEY`: 서버용 (Vercel Function)
  - `VITE_GEMINI_API_KEY`: 클라이언트용 (도메인 제한 필수)
- **RLS**: Supabase Row Level Security로 데이터 접근 제어
- **익명 로그인**: 회원가입 없이 사용 가능

### 성능
- **이미지 압축**: `compressImage` 함수로 4MB 이하로 압축
- **LocalStorage 백업**: DB 실패 시에도 데이터 유지
- **Lazy Loading**: 필요한 컴포넌트만 로드

---

## 📊 **데이터 예시**

### 가이드 추천 데이터 (`guide_recommendations.json`)
```json
{
  "city": "도쿄",
  "country": "일본",
  "searchTerms": ["Tokyo", "Japan", "도쿄", "일본"],
  "items": [
    {
      "name": "카베진 코와 알파",
      "description": "양배추 유래 성분의 국민 위장약 (300정)",
      "shop": "돈키호테/드럭스토어",
      "localPrice": 1700,
      "currency": "JPY",
      "category": "의약품"
    }
  ]
}
```

---

## 🚀 **배포 환경**

- **호스팅**: Vercel
- **도메인**: `your-project.vercel.app`
- **환경 변수**:
  - `GEMINI_API_KEY` (서버)
  - `VITE_GEMINI_API_KEY` (클라이언트)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

---

## 📝 **주요 개선 사항 (버전 히스토리)**

- **v1.4.0**: 타임라인 이미지 공유, 도시 그룹핑 고도화
- **v1.3.0**: 현지어 표기 기능 추가
- **v1.2.0**: 예산 준수 로직 강화
- **v1.1.0**: 클라이언트 직접 API 호출 (Vercel 제한 우회)
- **v1.0.0**: 초기 런칭

---

## 🎯 **서비스 차별점**

1. **AI 기반 자동화**: 일정표 업로드만으로 전체 쇼핑 플랜 자동 생성
2. **현지 가이드 데이터 통합**: AI 추천 + 실제 가이드 추천의 하이브리드 접근
3. **예산 엄수**: 서버 사이드 검증으로 예산 초과 방지
4. **현지어 지원**: 언어 장벽 없이 쇼핑 가능
5. **실시간 협업**: Supabase Realtime으로 그룹 여행 지원
6. **오프라인 백업**: LocalStorage로 네트워크 없이도 데이터 유지

---

이 서비스는 **여행 쇼핑을 스마트하게 계획하고 예산을 효율적으로 관리**하려는 한국인 여행객을 위한 올인원 솔루션입니다! 🎉
