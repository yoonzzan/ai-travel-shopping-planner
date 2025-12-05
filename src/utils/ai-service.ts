import type { TravelInfo, ShoppingPlan } from '../types';
import guideData from '../data/guide_recommendations.json';

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
  // Collect all unique cities from destination and schedule to get comprehensive recommendations
  const citiesToCheck = new Set<string>();
  if (travelInfo.destination) citiesToCheck.add(travelInfo.destination);
  travelInfo.schedule?.forEach(s => citiesToCheck.add(s.location));

  const guideRecommendations = Array.from(citiesToCheck)
    .map(city => getGuideRecommendations(city))
    .filter(rec => rec !== '')
    .join('\n\n');

  try {
    const response = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ travelInfo, guideRecommendations }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Server error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) errorMessage = errorJson.error;
      } catch {
        // If not JSON, use the raw text (truncated if too long)
        errorMessage = `Server Error (${response.status}): ${errorText.slice(0, 100)}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('AI Generation failed:', error);
    throw error;
  }
}



// ... (existing imports)

export async function parseItineraryFile(fileBase64: string, mimeType: string): Promise<Partial<TravelInfo>> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Client-side API key (VITE_GEMINI_API_KEY) is missing.');
    }

    // Initialize Gemini Client
    // Note: The @google/genai package might have a different import structure depending on version.
    // Using the REST API approach via fetch is safer and lighter for the client if SDK issues arise,
    // but let's try the direct fetch approach first to avoid SDK bundle size issues.

    const promptText = `
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

    // Direct REST API call from client (Lightweight & Secure with Domain Restriction)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: fileBase64 // The client already has the base64 string without prefix
                }
              }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No text generated from Gemini');
    }

    // Clean up JSON string
    let jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(jsonStr);

  } catch (error) {
    console.error('Itinerary parsing failed:', error);
    throw error;
  }
}
