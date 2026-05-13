import yahooFinance from 'yahoo-finance2';
import type { AnalystRating } from '@/types';

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
