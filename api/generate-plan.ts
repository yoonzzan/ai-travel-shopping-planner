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
      You are a professional travel shopping planner for KOREAN travelers.
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
  
      **LANGUAGE INSTRUCTION (CRITICAL)**:
      - **ALL OUTPUT MUST BE IN KOREAN (한국어).**
      - Product names, descriptions, reasons, tips, and shop names MUST be in Korean.
      - Exception: You may keep the original English/Local brand name in parentheses if helpful (e.g., "말린 망고 (7D Dried Mangoes)").
  
      **CRITICAL INSTRUCTION**:
      Recommend REAL, POPULAR, and SPECIFIC items that travelers actually buy in ${travelInfo.destination}.
      - Focus on "Must-Buy" items, local specialties, and famous souvenirs.
      - Avoid generic suggestions like "Chocolate" or "T-shirt". Instead, suggest specific brands or famous products.
      - Consider the user's budget and interests.
      - **BALANCED RECOMMENDATION STRATEGY (30:70 Rule)**:
        1. **Guide Recommendations (approx. 30%)**: Select only the top 2-3 "Must-Buy" items from the provided guide data.
        2. **AI Recommendations (approx. 70%)**: Fill the rest with UNIQUE, TRENDY, and PERSONALIZED items.
      - **Avoid Repetition**: Do not just list everything from the guide. Curate strictly.
      
      **PRICE INSTRUCTION**:
      - You MUST estimate the price for every item. Do NOT return 0.
      - \`localPrice\`: The price in local currency (e.g. JPY, THB). Use the guide data if available.
      - \`estimatedPrice\`: The approximate price in KRW (Korean Won). Calculate based on current exchange rates.
  
      **BUDGET COMPLIANCE (CRITICAL)**:
      - **TOTAL BUDGET LIMIT**: The sum of all item prices MUST NOT exceed ${travelInfo.budget} KRW.
      - **Adjust Item Selection**: If the budget is low (e.g., 300,000 KRW), do NOT recommend expensive luxury items. Focus on affordable souvenirs, snacks, and local crafts.
      - **Quantity Control**: Do not recommend too many items if it breaks the budget. Prioritize quality over quantity.
      - **Price Check**: Before finalizing the list, sum up the prices. If it exceeds ${travelInfo.budget} KRW, remove the least important items.
  
      **SOURCE ATTRIBUTION (STRICT)**:
      - \`source\`: Set to "guide" **ONLY IF** the item is explicitly listed in the provided "LOCAL GUIDE RECOMMENDATIONS" section.
      - \`source\`: Set to "ai" if the item is your own suggestion based on general knowledge and trends.
      - **DO NOT lie.** If it's not in the guide text provided above, mark it as "ai".
      
      **IMPORTANT CHANGE**: Plan the shopping itinerary **DAY BY DAY** according to the user's schedule.
      - The top-level keys in "cityShopping" MUST be unique for each day, e.g., "day_1_bangkok", "day_2_pattaya".
      - Even if the city is the same for multiple days (e.g., Day 2 Bangkok, Day 3 Bangkok), create SEPARATE entries for each day (e.g., "day_2_bangkok", "day_3_bangkok").
      - **CITY SPLITTING**: If a day involves multiple cities (e.g., "Napoli, Pompeii"), you MUST create SEPARATE "cityShopping" entries for each city (e.g., "day_1_napoli", "day_1_pompeii").
      - Do NOT merge them into one location "Napoli, Pompeii".
      - Assign items to the correct city entry based on where they are bought.
      - Distribute the recommended items logically across the days to balance the schedule.
      - For EACH item, specify the "shopName" or "mallName" where it can be purchased (e.g., "Big C Market", "Central World").
      - **ROUTE OPTIMIZATION**: Sort the items list logically by shopName within each day. Group items that can be bought at the same place together.
  
      **JSON RESPONSE FORMAT**:
      You must return a single valid JSON object matching the structure below.
      {
        "dutyFree": {
          "departure": {
            "id": "departure",
            "location": "인천공항 면세점 (출국)",
            "timing": "출국 전",
            "items": [
              {
                "id": "unique_id",
                "category": "카테고리 (한국어)",
                "product": "상품명 (한국어)",
                "brand": "브랜드명",
                "estimatedPrice": 35000,
                "localPrice": 25,
                "currencyCode": "USD",
                "reason": "추천 이유 (한국어)",
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
            "location": "도시명 (한국어, 예: 방콕)",
            "day": 1,
            "timing": "여행 중",
            "items": [
              {
                "id": "unique_id_1",
                "category": "식품",
                "product": "말린 망고 (7D Dried Mangoes)",
                "brand": "7D",
                "estimatedPrice": 5000,
                "localPrice": 150,
                "currencyCode": "THB",
                "reason": "가이드 데이터에 있는 필수 기념품입니다.",
                "priority": "high",
                "purchased": false,
                "shopName": "빅씨 마켓",
                "source": "guide"
              },
              {
                "id": "unique_id_2",
                "category": "패션",
                "product": "코끼리 바지",
                "brand": "No Brand",
                "estimatedPrice": 4000,
                "localPrice": 100,
                "currencyCode": "THB",
                "reason": "요즘 한국인 여행객 사이에서 유행하는 아이템입니다.",
                "priority": "medium",
                "purchased": false,
                "shopName": "야시장",
                "source": "ai"
              }
            ],
            "subtotal": 0,
            "tips": ["쇼핑 꿀팁 (한국어)"]
          }
        },
        "budgetSummary": {
          "dutyFree": 0,
          "cityShopping": 0,
          "total": 0,
          "remaining": 0
        },
        "timeline": ["1일차: 방콕", "2일차: 파타야"]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-preview-09-2025',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response text generated from AI model');
    }

    let jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

    const json = JSON.parse(jsonStr);

    // Recalculate totals to ensure accuracy (AI math can be unreliable)
    let dutyFreeTotal = 0;
    let cityShoppingTotal = 0;

    // 1. Calculate Departure Duty Free
    if (json.dutyFree?.departure?.items) {
      const subtotal = json.dutyFree.departure.items.reduce((sum: number, item: any) => sum + (item.estimatedPrice || 0), 0);
      json.dutyFree.departure.subtotal = subtotal;
      dutyFreeTotal += subtotal;
    }

    // 2. Calculate Arrival Duty Free
    if (json.dutyFree?.arrival?.items) {
      const subtotal = json.dutyFree.arrival.items.reduce((sum: number, item: any) => sum + (item.estimatedPrice || 0), 0);
      json.dutyFree.arrival.subtotal = subtotal;
      dutyFreeTotal += subtotal;
    }

    // 3. Calculate City Shopping
    if (json.cityShopping) {
      Object.values(json.cityShopping).forEach((location: any) => {
        if (location.items) {
          const subtotal = location.items.reduce((sum: number, item: any) => sum + (item.estimatedPrice || 0), 0);
          location.subtotal = subtotal;
          cityShoppingTotal += subtotal;
        }
      });
    }

    // 4. Update Budget Summary (Initial Calculation)
    json.budgetSummary = {
      dutyFree: dutyFreeTotal,
      cityShopping: cityShoppingTotal,
      total: dutyFreeTotal + cityShoppingTotal,
      remaining: (travelInfo.budget || 0) - (dutyFreeTotal + cityShoppingTotal)
    };

    // ---------------------------------------------------------
    // 🛡️ STRICT BUDGET ENFORCEMENT LOGIC (Server-Side)
    // ---------------------------------------------------------
    const budgetLimit = travelInfo.budget || 0;

    if (budgetLimit > 0 && json.budgetSummary.total > budgetLimit) {
      console.log(`[Budget] Exceeded! Total: ${json.budgetSummary.total}, Limit: ${budgetLimit}. Trimming items...`);

      // 1. Collect all items with their references
      type ItemRef = {
        item: any;
        parentList: any[];
        locationId: string; // for debugging
        isDutyFree: boolean;
      };

      let allItems: ItemRef[] = [];

      // Collect Duty Free Items
      if (json.dutyFree?.departure?.items) {
        json.dutyFree.departure.items.forEach((item: any) => allItems.push({ item, parentList: json.dutyFree.departure.items, locationId: 'departure', isDutyFree: true }));
      }
      if (json.dutyFree?.arrival?.items) {
        json.dutyFree.arrival.items.forEach((item: any) => allItems.push({ item, parentList: json.dutyFree.arrival.items, locationId: 'arrival', isDutyFree: true }));
      }

      // Collect City Shopping Items
      if (json.cityShopping) {
        Object.values(json.cityShopping).forEach((location: any) => {
          if (location.items) {
            location.items.forEach((item: any) => allItems.push({ item, parentList: location.items, locationId: location.id, isDutyFree: false }));
          }
        });
      }

      // 2. Sort items by "Removability" (High score = Remove first)
      // Criteria:
      // - Source: 'ai' (removable) > 'guide' (keep if possible)
      // - Priority: 'low' > 'medium' > 'high'
      // - Price: Higher price = Higher chance to remove (to cut budget fast)
      allItems.sort((a, b) => {
        const scoreA = (a.item.source === 'ai' ? 1000 : 0) +
          (a.item.priority === 'low' ? 500 : a.item.priority === 'medium' ? 200 : 0) +
          (a.item.estimatedPrice / 10000); // Weight price slightly

        const scoreB = (b.item.source === 'ai' ? 1000 : 0) +
          (b.item.priority === 'low' ? 500 : b.item.priority === 'medium' ? 200 : 0) +
          (b.item.estimatedPrice / 10000);

        return scoreB - scoreA; // Descending order (Highest score first)
      });

      // 3. Remove items until budget is met
      let currentTotal = json.budgetSummary.total;

      for (const ref of allItems) {
        if (currentTotal <= budgetLimit) break;

        // Remove item from its parent list
        const index = ref.parentList.indexOf(ref.item);
        if (index > -1) {
          ref.parentList.splice(index, 1); // Remove!
          currentTotal -= (ref.item.estimatedPrice || 0);
          console.log(`[Budget] Removed item: ${ref.item.product} (${ref.item.estimatedPrice} KRW) from ${ref.locationId}`);
        }
      }

      // 4. Recalculate Totals after trimming
      dutyFreeTotal = 0;
      cityShoppingTotal = 0;

      if (json.dutyFree?.departure?.items) {
        const subtotal = json.dutyFree.departure.items.reduce((sum: number, item: any) => sum + (item.estimatedPrice || 0), 0);
        json.dutyFree.departure.subtotal = subtotal;
        dutyFreeTotal += subtotal;
      }
      if (json.dutyFree?.arrival?.items) {
        const subtotal = json.dutyFree.arrival.items.reduce((sum: number, item: any) => sum + (item.estimatedPrice || 0), 0);
        json.dutyFree.arrival.subtotal = subtotal;
        dutyFreeTotal += subtotal;
      }
      if (json.cityShopping) {
        Object.values(json.cityShopping).forEach((location: any) => {
          if (location.items) {
            const subtotal = location.items.reduce((sum: number, item: any) => sum + (item.estimatedPrice || 0), 0);
            location.subtotal = subtotal;
            cityShoppingTotal += subtotal;
          }
        });
      }

      // Final Update
      json.budgetSummary = {
        dutyFree: dutyFreeTotal,
        cityShopping: cityShoppingTotal,
        total: dutyFreeTotal + cityShoppingTotal,
        remaining: budgetLimit - (dutyFreeTotal + cityShoppingTotal)
      };
    }

    return new Response(JSON.stringify(json), { status: 200, headers });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers });
  }
}
