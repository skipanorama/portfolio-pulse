import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchBatchRatings } from '@/lib/yahoo-finance';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel cron jobs are secured by Vercel's infrastructure
  // Optionally verify CRON_SECRET if set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && cronSecret.trim()) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret.trim()}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const holdings = await prisma.holding.findMany({
      select: { yahooSymbol: true },
      distinct: ['yahooSymbol'],
    });

    const symbols = holdings.map((h: { yahooSymbol: string }) => h.yahooSymbol);
    const ratingsMap = await fetchBatchRatings(symbols, 5);

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

    console.log(`[Cron] Ratings refresh: ${updated} updated, ${failed} failed`);

    return NextResponse.json({
      ok: true,
      total: symbols.length,
      updated,
      failed,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron] Ratings refresh error:', err);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
