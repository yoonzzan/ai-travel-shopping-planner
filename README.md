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
```bash
npm run dev
```

## 📂 프로젝트 구조

```
src/
├── components/     # UI 컴포넌트 (Onboarding, HomePage, ShoppingList 등)
├── utils/
│   ├── ai-service.ts   # AI 통신 로직 (클라이언트 직접 호출 포함)
│   └── image-utils.ts  # 이미지 압축 및 처리
api/
└── generate-plan.ts    # 쇼핑 플랜 생성 API (예산 및 로직 제어)
```

## 📝 최신 업데이트 내역

*   **v1.2.0**: 예산 준수 로직 강화 (AI가 예산을 초과하지 않도록 엄격 제어)
*   **v1.1.0**: 이미지 업로드 방식을 클라이언트 직접 호출로 변경 (Vercel 500 에러 해결)
*   **v1.0.0**: 초기 런칭
