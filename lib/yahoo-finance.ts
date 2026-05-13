import YahooFinance from 'yahoo-finance2';
import type { AnalystRating } from '@/types';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function fetchAnalystRating(yahooSymbol: string): Promise<Partial<AnalystRating> | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (yahooFinance.quoteSummary as any)(yahooSymbol, {
      modules: ['financialData', 'recommendationTrend'],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const financial = (result as any)?.financialData;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trend = (result as any)?.recommendationTrend?.trend?.[0];

    if (!financial && !trend) return null;

    const ratingKey: string | null = financial?.recommendationKey ?? null;
    const ratingScoreRaw = financial?.recommendationMean;
    const ratingScoreVal: number | null = ratingScoreRaw != null ? parseFloat(String(ratingScoreRaw)) : null;

    return {
      yahooSymbol,
      rating: ratingKey || null,
      ratingScore: ratingScoreVal,
      strongBuyCount: trend?.strongBuy ?? null,
      buyCount: trend?.buy ?? null,
      holdCount: trend?.hold ?? null,
      sellCount: trend?.sell ?? null,
      strongSellCount: trend?.strongSell ?? null,
      targetPrice: financial?.targetMeanPrice != null
        ? parseFloat(String(financial.targetMeanPrice))
        : null,
      numberOfAnalysts: financial?.numberOfAnalystOpinions != null
        ? parseInt(String(financial.numberOfAnalystOpinions))
        : null,
    };
  } catch {
    return null;
  }
}

interface PriceData {
  price: number;
  currency: string;
}

export async function fetchBatchPrices(
  symbols: string[]
): Promise<Map<string, PriceData>> {
  const results = new Map<string, PriceData>();
  const batchSize = 20;

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quotes = await (yahooFinance.quote as any)(batch);
      const arr: any[] = Array.isArray(quotes) ? quotes : [quotes]; // eslint-disable-line @typescript-eslint/no-explicit-any
      for (const q of arr) {
        if (q?.symbol && q?.regularMarketPrice != null) {
          results.set(q.symbol, { price: q.regularMarketPrice, currency: q.currency ?? 'USD' });
        }
      }
    } catch {
      // Fall back to individual fetches
      for (const sym of batch) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const q = await (yahooFinance.quote as any)(sym);
          if (q?.regularMarketPrice != null) {
            results.set(sym, { price: q.regularMarketPrice, currency: q.currency ?? 'USD' });
          }
        } catch { /* skip */ }
      }
    }
    if (i + batchSize < symbols.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  return results;
}

export async function fetchBatchRatings(
  symbols: string[],
  batchSize = 5
): Promise<Map<string, Partial<AnalystRating>>> {
  const results = new Map<string, Partial<AnalystRating>>();

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (symbol) => {
        const rating = await fetchAnalystRating(symbol);
        if (rating) results.set(symbol, rating);
      })
    );
    if (i + batchSize < symbols.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return results;
}
