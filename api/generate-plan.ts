import { GoogleGenAI } from '@google/genai';

export const config = {
  runtime: 'edge',
};

interface ScheduleItem {
  day: number;
  date: string;
  location: string;
}

export default async function handler(req: Request) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error: Missing API Key' }), { status: 500, headers });
  }

  try {
    const body = await req.json();
    const { travelInfo, guideRecommendations } = body;

    if (!travelInfo) {
      return new Response(JSON.stringify({ error: 'travelInfo is missing' }), { status: 400, headers });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

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
      ${travelInfo.schedule?.map((s: ScheduleItem) => `      Day ${s.day} (${s.date}): ${s.location}`).join('\n') || 'Not specified'}
  
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    const text = response.text;

    let jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

    const json = JSON.parse(jsonStr);
    return new Response(JSON.stringify(json), { status: 200, headers });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers });
  }
}
