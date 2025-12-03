import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TravelInfo, ShoppingPlan } from '../types';
import guideData from '../data/guide_recommendations.json';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
} else {
  console.warn('Missing Gemini API Key. AI features will not work.');
}

interface GuideItem {
  name: string;
  description: string;
  shop: string;
  estimatedPrice: number;
  localPrice: number;
  currency: string;
  category: string;
}

interface GuideRecommendation {
  city: string;
  country: string;
  searchTerms: string[];
  items: GuideItem[];
}

const typedGuideData = guideData as unknown as { recommendations: GuideRecommendation[] };

function getGuideRecommendations(city: string): string {
  const recommendations = typedGuideData.recommendations.find(rec =>
    rec.searchTerms.some(term => city.toLowerCase().includes(term.toLowerCase())) ||
    rec.city.toLowerCase().includes(city.toLowerCase()) ||
    rec.country.toLowerCase().includes(city.toLowerCase())
  );

  if (!recommendations) return '';

  return `
    **LOCAL GUIDE RECOMMENDATIONS for ${recommendations.city}**:
    The following items are highly recommended by local experts. Please consider including them:
    ${JSON.stringify(recommendations.items, null, 2)}
  `;
}

export async function generateShoppingPlan(travelInfo: TravelInfo): Promise<ShoppingPlan> {
  if (!genAI) {
    throw new Error('AI service not initialized. Please check API key.');
  }

  // Collect all unique cities from destination and schedule to get comprehensive recommendations
  const citiesToCheck = new Set<string>();
  if (travelInfo.destination) citiesToCheck.add(travelInfo.destination);
  travelInfo.schedule?.forEach(s => citiesToCheck.add(s.location));

  const guideRecommendations = Array.from(citiesToCheck)
    .map(city => getGuideRecommendations(city))
    .filter(rec => rec !== '')
    .join('\n\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    You are a professional travel shopping planner.
    Create a detailed shopping plan for a trip to ${travelInfo.destination}.
    
    Travel Details:
    - Duration: ${travelInfo.startDate} to ${travelInfo.endDate}
    - Budget: ${travelInfo.budget} KRW
    - Companions: ${travelInfo.companions?.join(', ') || 'None'}
    - Interests: ${travelInfo.preferences.join(', ')}
    - Purpose: ${travelInfo.purposes.join(', ')}
    - Daily Schedule:
    ${travelInfo.schedule?.map(s => `      Day ${s.day} (${s.date}): ${s.location}`).join('\n') || 'Not specified'}

    ${guideRecommendations}

    **CRITICAL INSTRUCTION**:
    Recommend REAL, POPULAR, and SPECIFIC items that travelers actually buy in ${travelInfo.destination}.
    - Focus on "Must-Buy" items, local specialties, and famous souvenirs.
    - Avoid generic suggestions like "Chocolate" or "T-shirt". Instead, suggest specific brands or famous products (e.g., "G7 Coffee", "Dried Mangoes (7D)", "Jim Thompson Silk").
    - Consider the user's budget and interests.
    - **BALANCED RECOMMENDATION STRATEGY (30:70 Rule)**:
      1. **Guide Recommendations (approx. 30%)**: Select only the top 2-3 "Must-Buy" items from the provided guide data that best fit the user's profile. These are the "safe bets".
      2. **AI Recommendations (approx. 70%)**: Fill the rest with UNIQUE, TRENDY, and PERSONALIZED items based on the user's specific interests and current trends. Surprise the user with hidden gems that are NOT in the guide data.
    - **Avoid Repetition**: Do not just list everything from the guide. Curate strictly.
    
    **PRICE INSTRUCTION**:
    - You MUST estimate the price for every item. Do NOT return 0.
    - \`localPrice\`: The price in local currency (e.g. JPY, THB). Use the guide data if available.
    - \`estimatedPrice\`: The approximate price in KRW (Korean Won). Calculate based on current exchange rates.

    **SOURCE ATTRIBUTION**:
    - \`source\`: Set to "guide" if the item is from the provided guide recommendations. Set to "ai" if it is your own suggestion based on general knowledge.
    
    **IMPORTANT CHANGE**: Plan the shopping itinerary **DAY BY DAY** according to the user's schedule.
    - The top-level keys in "cityShopping" MUST be unique for each day, e.g., "day_1_bangkok", "day_2_pattaya".
    - Even if the city is the same for multiple days (e.g., Day 2 Bangkok, Day 3 Bangkok), create SEPARATE entries for each day (e.g., "day_2_bangkok", "day_3_bangkok").
    - **CITY SPLITTING**: If a day involves multiple cities (e.g., "Napoli, Pompeii"), you MUST create SEPARATE "cityShopping" entries for each city (e.g., "day_1_napoli", "day_1_pompeii").
    - Do NOT merge them into one location "Napoli, Pompeii".
    - Assign items to the correct city entry based on where they are bought.
    - Distribute the recommended items logically across the days to balance the schedule.
    - For EACH item, specify the "shopName" or "mallName" where it can be purchased (e.g., "Big C Market", "Central World").
    - **ROUTE OPTIMIZATION**: Sort the items list logically by shopName within each day. Group items that can be bought at the same place together.

    **JSON FORMATTING RULES**:
    - Output MUST be valid JSON.
    - **NO trailing commas** in arrays or objects (this is the most common error).
    - All keys MUST be double-quoted.
    - Do not include comments in the JSON.
    - Ensure the JSON is complete and ends with "}".

    Please provide the response in the following JSON format ONLY, no markdown.
    IMPORTANT: All text content (location names, product names, reasons, tips, etc.) MUST be in Korean.
    {
      "dutyFree": {
        "departure": {
          "id": "departure",
          "location": "인천공항 면세점 (출국)",
          "timing": "출국 전",
          "items": [
            {
              "id": "unique_id",
              "category": "Category",
              "product": "Product Name",
              "brand": "Brand",
              "estimatedPrice": 35000,
              "localPrice": 25,
              "currencyCode": "USD",
              "reason": "Why recommended",
              "priority": "high/medium/low",
              "purchased": false,
              "source": "ai"
            }
          ],
          "subtotal": 0
        },
        "arrival": {
          "id": "arrival",
          "location": "인천공항 면세점 (입국)",
          "timing": "입국 후",
          "items": [],
          "subtotal": 0
        }
      },
      "cityShopping": {
        "day_1_cityname": {
          "id": "day_1_cityname",
          "location": "City Name (e.g., 방콕)",
          "day": 1,
          "timing": "여행 중",
          "items": [
            {
              "id": "unique_id",
              "category": "Category",
              "product": "Product Name",
              "brand": "Brand",
              "estimatedPrice": 15000,
              "localPrice": 400,
              "currencyCode": "THB",
              "reason": "Why recommended",
              "priority": "high/medium/low",
              "purchased": false,
              "shopName": "Specific Shop Name (e.g. 빅씨 마켓)",
              "source": "guide"
            }
          ],
          "subtotal": 0,
          "tips": ["City specific shopping tip"]
        },
        "day_2_cityname": {
          "id": "day_2_cityname",
          "location": "City Name",
          "day": 2,
          "timing": "여행 중",
          "items": []
        }
      },
      "budgetSummary": {
        "dutyFree": 0,
        "cityShopping": 0,
        "total": 0,
        "remaining": 0
      },
      "timeline": ["Day 1: City A", "Day 2: City B"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up markdown code blocks if present and extract JSON object
    let jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();

    // Extract JSON object if there's extra text
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    // Simple cleanup for common JSON errors (like trailing commas)
    // Remove trailing commas before closing braces/brackets
    jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('AI Generation failed:', error);
    throw error;
  }
}

export async function parseItineraryFile(fileBase64: string, mimeType: string): Promise<{
  destination: string;
  startDate: string;
  endDate: string;
  schedule: { day: number; date: string; location: string }[];
}> {
  if (!genAI) {
    throw new Error('AI service not initialized. Please check API key.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    Analyze this travel itinerary file (image or PDF).
    Extract the following information:
    1. Destination (City name in Korean, e.g., 방콕, 다낭)
    2. Start Date (YYYY-MM-DD)
    3. End Date (YYYY-MM-DD)
    4. Daily Schedule: For each day, extract the Day number, Date, and Main Location/City (in Korean).

    Return ONLY a JSON object with these keys: 
    - "destination": string
    - "startDate": string (YYYY-MM-DD)
    - "endDate": string (YYYY-MM-DD)
    - "schedule": array of objects { "day": number, "date": string, "location": string }

    If you cannot find specific information, make a reasonable guess based on context or return null/empty.
    IMPORTANT: Ensure "location" is the city or main area name in Korean (e.g., "다낭", "호이안", "바나힐"). If multiple cities, separate them with commas (e.g., "다낭, 호이안").
    `;

  const filePart = {
    inlineData: {
      data: fileBase64,
      mimeType: mimeType,
    },
  };

  try {
    const result = await model.generateContent([prompt, filePart]);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json\n?|\n?```/g, '');
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Itinerary parsing failed:', error);
    throw error;
  }
}
