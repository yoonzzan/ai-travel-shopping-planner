import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { fileBase64, mimeType } = await req.json();
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            return new Response(JSON.stringify({ error: 'Server configuration error: Missing API Key' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-09-2025' });

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

        const result = await model.generateContent([prompt, filePart]);
        const response = await result.response;
        const text = response.text();

        // Clean up JSON string
        let jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
        // Ensure we only have the JSON object
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const json = JSON.parse(jsonStr);

        return new Response(JSON.stringify(json), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
