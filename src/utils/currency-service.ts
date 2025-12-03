// Initial static rates as fallback
export let EXCHANGE_RATES: Record<string, number> = {
    'USD': 1430,
    'JPY': 9.1,   // 1 JPY = 9.1 KRW
    'EUR': 1550,
    'THB': 42,
    'VND': 0.06,  // 1 VND = 0.06 KRW
    'CNY': 195,
    'TWD': 45,
    'HKD': 183,
    'SGD': 1060,
};

// Free API endpoint (no key required)
const API_URL = 'https://open.er-api.com/v6/latest/KRW';

export async function fetchExchangeRates() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data && data.rates) {
            // The API returns 1 KRW = X TargetCurrency
            // We want 1 TargetCurrency = Y KRW, so we invert the rate
            const newRates: Record<string, number> = {};
            Object.entries(data.rates).forEach(([code, rate]) => {
                newRates[code] = 1 / (rate as number);
            });

            EXCHANGE_RATES = { ...EXCHANGE_RATES, ...newRates };
            // console.log('Updated exchange rates:', EXCHANGE_RATES);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('exchange-rates-updated'));
            }
        }
    } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
    }
}

// Call this when app starts
// fetchExchangeRates();

export function convertToKRW(amount: number, currencyCode: string): number {
    const rate = EXCHANGE_RATES[currencyCode.toUpperCase()];
    if (!rate) return amount;
    return Math.round(amount * rate);
}

export function convertFromKRW(amountKRW: number, currencyCode: string): number {
    const rate = EXCHANGE_RATES[currencyCode.toUpperCase()];
    if (!rate) return amountKRW;

    // Handle low value currencies like VND for better display (don't round to integer immediately if < 1)
    // But usually we want integer for display.
    // For JPY, 1000 KRW / 9.1 = 109 JPY.
    return Math.round(amountKRW / rate);
}
