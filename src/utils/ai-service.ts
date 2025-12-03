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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate plan');
    }

    return await response.json();
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
  try {
    const response = await fetch('/api/parse-itinerary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileBase64, mimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to parse itinerary');
    }

    return await response.json();
  } catch (error) {
    console.error('Itinerary parsing failed:', error);
    throw error;
  }
}
