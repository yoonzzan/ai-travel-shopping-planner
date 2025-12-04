import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log('[API] parse-itinerary v3 (Fetch + Config) started');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { fileBase64, mimeType } = req.body;
    console.log(`[API] Received request. MimeType: ${mimeType}, Base64 Length: ${fileBase64?.length}`);

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        console.error('[API] Error: Missing API Key');
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    try {
        console.log('[API] Sending request to Gemini REST API...');

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

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-09-2025:generateContent?key=${API_KEY}`,
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
                                    data: fileBase64
                                }
                            }
                        ]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] Gemini API Error:', errorText);
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[API] Received response from Gemini');

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No text generated from Gemini');
        }

        console.log('[API] Raw response text length:', text.length);

        // Clean up JSON string
        let jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
        // Ensure we only have the JSON object
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const json = JSON.parse(jsonStr);
        console.log('[API] JSON parsed successfully');

        res.status(200).json(json);
    } catch (error) {
        console.error('[API] Error occurred:', error);
        res.status(500).json({ error: (error as Error).message });
    }
}
