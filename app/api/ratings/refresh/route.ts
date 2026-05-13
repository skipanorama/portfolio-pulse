import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchBatchRatings } from '@/lib/yahoo-finance';

export async function POST() {
  try {
    // Get all unique yahoo symbols from holdings
    const holdings = await prisma.holding.findMany({
      select: { yahooSymbol: true },
      distinct: ['yahooSymbol'],
    });

    const allSymbols = holdings.map(h => h.yahooSymbol);

    // Filter out symbols updated less than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRatings = await prisma.analystRating.findMany({
      where: {
        yahooSymbol: { in: allSymbols },
        lastUpdated: { gte: oneHourAgo },
      },
      select: { yahooSymbol: true },
    });
    const recentSet = new Set(recentRatings.map(r => r.yahooSymbol));

    const symbolsToUpdate = allSymbols.filter(s => !recentSet.has(s));

    if (symbolsToUpdate.length === 0) {
      return NextResponse.json({
        message: 'All ratings are up to date',
        updated: 0,
        skipped: allSymbols.length,
      });
    }

    // Fetch fresh ratings
    const ratingsMap = await fetchBatchRatings(symbolsToUpdate, 5);

    let updated = 0;
    let failed = 0;

    for (const [symbol, rating] of ratingsMap.entries()) {
      try {
        await prisma.analystRating.upsert({
          where: { yahooSymbol: symbol },
          update: {
            rating: rating.rating ?? null,
            ratingScore: rating.ratingScore ?? null,
            strongBuyCount: rating.strongBuyCount ?? null,
            buyCount: rating.buyCount ?? null,
            holdCount: rating.holdCount ?? null,
            sellCount: rating.sellCount ?? null,
            strongSellCount: rating.strongSellCount ?? null,
            targetPrice: rating.targetPrice ?? null,
            numberOfAnalysts: rating.numberOfAnalysts ?? null,
            lastUpdated: new Date(),
          },
          create: {
            yahooSymbol: symbol,
            rating: rating.rating ?? null,
            ratingScore: rating.ratingScore ?? null,
            strongBuyCount: rating.strongBuyCount ?? null,
            buyCount: rating.buyCount ?? null,
            holdCount: rating.holdCount ?? null,
            sellCount: rating.sellCount ?? null,
            strongSellCount: rating.strongSellCount ?? null,
            targetPrice: rating.targetPrice ?? null,
            numberOfAnalysts: rating.numberOfAnalysts ?? null,
            lastUpdated: new Date(),
          },
        });
        updated++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({
      message: 'Ratings refresh complete',
      total: allSymbols.length,
      attempted: symbolsToUpdate.length,
      updated,
      failed,
      skipped: recentSet.size,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to refresh ratings' }, { status: 500 });
  }
}
