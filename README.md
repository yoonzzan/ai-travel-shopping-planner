# ✈️ AI 여행 쇼핑 플래너 (AI Travel Shopping Planner)

여행 일정표(이미지/PDF)를 업로드하면, AI가 여행지, 일정, 예산을 분석하여 **최적의 쇼핑 리스트와 동선**을 자동으로 계획해주는 스마트 웹 애플리케이션입니다.

## ✨ 주요 기능

1.  **📄 여행 일정 자동 분석**
    *   여행사 일정표나 E-ticket(이미지, PDF)을 업로드하면 AI가 여행지, 날짜, 도시별 일정을 자동으로 추출합니다.
    *   **특징**: Vercel 서버 제한을 우회하기 위해 브라우저에서 직접 Google Gemini API를 호출하여 빠르고 안정적입니다.

2.  **🛍️ 맞춤형 쇼핑 플랜 생성**
    *   사용자의 예산(30만원, 100만원 등)과 취향(화장품, 패션, 식품 등)을 고려하여 쇼핑 리스트를 추천합니다.
    *   **예산 준수**: 설정한 예산을 초과하지 않도록 AI가 아이템 개수와 가격대를 자동으로 조절합니다.
    *   **출처 구분**: 현지 가이드 추천 아이템(Guide)과 AI 트렌드 추천 아이템(AI)을 명확히 구분하여 신뢰도를 높였습니다.

3.  **💰 실시간 예산 관리**
    *   면세점, 현지 쇼핑 등 지출 내역을 실시간으로 추적하고 남은 예산을 보여줍니다.
    *   환율 계산 기능이 내장되어 있어 현지 가격을 원화로 쉽게 확인할 수 있습니다.

4.  **🗺️ 타임라인 & 동선 최적화**
    *   여행 일차별로 쇼핑할 수 있는 최적의 장소와 아이템을 타임라인 형태로 제공합니다.

5.  **🗣️ 현지어 소통 지원 (New!)**
    *   쇼핑 시 현지 상인에게 바로 보여줄 수 있도록 **상품명을 현지어(태국어, 일본어 등)로 변환**하여 보여줍니다.
    *   아이템 카드의 '🗣️' 버튼을 누르면 큰 글씨의 현지어 카드가 팝업됩니다.

## 🛠️ 기술 스택

*   **Frontend**: React, TypeScript, Vite, Tailwind CSS
*   **Backend**: Vercel Serverless Functions (Node.js)
*   **AI**: Google Gemini 2.5 Flash (Generative AI)
*   **Deployment**: Vercel

## 🚀 설치 및 실행 방법

### 1. 프로젝트 클론 및 의존성 설치
```bash
git clone https://github.com/yoonzzan/ai-travel-shopping-planner.git
cd ai-travel-shopping-planner
npm install
```

### 2. 환경 변수 설정 (.env)
프로젝트 루트에 `.env` 파일을 생성하고 아래와 같이 설정합니다.
보안을 위해 **서버용 키**와 **브라우저용 키**를 분리하여 사용하는 것을 권장합니다.

```env
# [서버용] Vercel Function에서 사용 (제한 없음)
GEMINI_API_KEY=your_google_gemini_api_key_here

# [클라이언트용] 브라우저에서 이미지 분석 시 사용 (Google Console에서 도메인 제한 필수!)
VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
```

> **⚠️ 중요: 보안 설정**
> `VITE_GEMINI_API_KEY`는 브라우저에 노출되므로, 반드시 Google Cloud Console에서 **"HTTP 리퍼러(웹사이트) 제한"**을 걸어야 합니다.
> *   허용 도메인: `http://localhost:5173/*`, `https://your-project.vercel.app/*`

### 3. 로컬 개발 서버 실행

**방법 A: 전체 기능 실행 (권장)**
API(서버리스 함수)를 포함한 모든 기능을 테스트하려면 Vercel CLI가 필요합니다.
```bash
npm i -g vercel
vercel dev
```

**방법 B: 프론트엔드만 실행**
UI만 빠르게 확인하고 싶을 때 사용합니다. (AI 생성 등 API 기능은 작동하지 않음)
```bash
npm run dev
```

## 📂 프로젝트 구조

```
src/
├── components/         # UI 컴포넌트
│   ├── OnboardingFlow.tsx  # 여행 정보 입력 및 파일 업로드
│   ├── HomePage.tsx        # 메인 대시보드 (예산, 진행률)
│   ├── ShoppingListDetail.tsx # 상세 쇼핑 리스트 및 아이템 관리
│   ├── TimelineView.tsx    # 타임라인 뷰
│   ├── LiveShopping.tsx    # 실시간 쇼핑 모드
│   └── FileUpload.tsx      # 파일 업로드 및 파싱 UI
├── utils/
│   ├── ai-service.ts       # Google Gemini AI 통신 로직
│   ├── db-service.ts       # Supabase DB CRUD 로직
│   └── currency-service.ts # 환율 계산 유틸리티
├── hooks/
│   └── useShoppingPlan.ts  # 쇼핑 플랜 상태 관리 및 동기화 훅
├── types/                  # TypeScript 타입 정의
└── supabase/               # Supabase 클라이언트 설정
api/
└── generate-plan.ts        # 쇼핑 플랜 생성 서버리스 함수 (AI 프롬프트 포함)
```

## 🗄️ 데이터베이스 스키마 (Supabase)

### 1. `trips` (여행 정보)
사용자의 여행 기본 정보를 저장합니다.
*   `id`: UUID (Primary Key)
*   `user_id`: UUID (사용자 식별)
*   `destination`: String (여행지)
*   `start_date`: Date (시작일)
*   `end_date`: Date (종료일)
*   `budget`: Integer (총 예산)
*   `created_at`: Timestamp

### 2. `shopping_items` (쇼핑 아이템)
각 여행에 속한 개별 쇼핑 아이템을 저장합니다.
*   `id`: UUID (Primary Key)
*   `trip_id`: UUID (Foreign Key -> trips.id)
*   `product_name`: String (상품명)
*   `estimated_price`: Integer (예상 가격 - 원화)
*   `local_price`: Integer (현지 가격 - 선택)
*   `currency_code`: String (통화 코드 - 예: USD, JPY)
*   `location_id`: String (구매 장소 ID - 예: departure, day_1_bangkok)
*   `purchased`: Boolean (구매 여부)
*   `is_recommended`: Boolean (AI 추천 아이템 여부)
*   `local_name`: String (현지어 상품명)

## 📝 최신 업데이트 내역

*   **v1.3.0**: 현지어 표기 기능 추가, 로딩 애니메이션 개선, UI 최적화
*   **v1.2.0**: 예산 준수 로직 강화 (AI가 예산을 초과하지 않도록 엄격 제어)
*   **v1.1.0**: 이미지 업로드 방식을 클라이언트 직접 호출로 변경 (Vercel 500 에러 해결)
*   **v1.0.0**: 초기 런칭

## 📄 라이선스

Copyright © 2025 yoonzzan. All rights reserved.
