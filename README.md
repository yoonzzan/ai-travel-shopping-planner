# AI Travel Shopping Planner

AI Travel Shopping Planner is a smart web application designed to help travelers create personalized shopping itineraries. By leveraging Google's Gemini AI, it generates tailored shopping recommendations based on your destination, travel schedule, budget, and personal preferences.

## 🚀 Features

- **AI-Powered Recommendations**: Generates a customized shopping list using Google Gemini AI, balancing "Must-Buy" guide items with personalized trend-based suggestions.
- **Smart Itinerary Integration**: Automatically maps shopping locations to your daily travel schedule.
- **Budget Management**: Real-time budget tracking with automatic currency conversion (KRW, USD, JPY, THB, etc.).
- **Duty-Free Planning**: Separate sections for departure and arrival duty-free shopping.
- **Live Shopping Mode**: A checklist mode for use during the trip to track purchases and spending.
- **Drag & Drop Interface**: Easily organize and manage your shopping items.
- **Real-time Collaboration**: (Experimental) Sync shopping lists with travel companions via Supabase.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS, Radix UI, Lucide React
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database / Auth**: Supabase
- **AI Model**: Google Gemini (via `@google/generative-ai`)
- **State Management**: React Hooks & Context

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

You will also need:
- A **Google Gemini API Key**
- A **Supabase Project** (URL and Anon Key)

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-travel-shopping-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add the following keys:
   ```env
   # Google Gemini API
   GEMINI_API_KEY=your_gemini_api_key_here

   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## 📂 Project Structure

```
.
├── api/                 # Vercel Serverless Functions (Backend)
│   ├── generate-plan.ts # AI Shopping Plan Generation
│   └── ...
├── src/
│   ├── components/      # React UI Components
│   ├── hooks/           # Custom React Hooks (e.g., useShoppingPlan)
│   ├── supabase/        # Supabase Client Configuration
│   ├── types/           # TypeScript Type Definitions
│   ├── utils/           # Utility Functions (Currency, DB, etc.)
│   └── App.tsx          # Main Application Entry
├── public/              # Static Assets
└── ...
```

## 📖 Usage Guide

1. **Onboarding**: Enter your travel destination, dates, budget, and preferences.
2. **Plan Generation**: The AI will generate a day-by-day shopping plan.
3. **Review & Edit**:
   - View items by day or location.
   - Add custom items or remove recommendations.
   - Check the estimated budget in KRW.
4. **Live Mode**: When shopping, switch to "Live Mode" to check off items as you buy them.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.