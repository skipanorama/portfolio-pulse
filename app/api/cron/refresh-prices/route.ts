import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchBatchPrices } from '@/lib/yahoo-finance';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && cronSecret.trim()) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret.trim()}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const holdings = await prisma.holding.findMany({
      select: { id: true, yahooSymbol: true, quantity: true, bookValue: true },
    });

    const symbols = [...new Set(holdings.map((h: { yahooSymbol: string }) => h.yahooSymbol))];
    const priceMap = await fetchBatchPrices(symbols);

    let updated = 0;
    let failed = 0;
    const now = new Date();

    await Promise.all(
      holdings.map(async (h: { id: number; yahooSymbol: string; quantity: number; bookValue: number | null }) => {
        const priceData = priceMap.get(h.yahooSymbol);
        if (!priceData) return;
        try {
          const marketPrice = priceData.price;
          const marketValue = marketPrice * h.quantity;
          const unrealizedGain = h.bookValue != null ? marketValue - h.bookValue : null;
          await prisma.holding.update({
            where: { id: h.id },
            data: { marketPrice, marketValue, unrealizedGain, lastPriceUpdate: now },
          });
          updated++;
        } catch {
          failed++;
        }
      })
    );

    console.log(`[Cron] Price refresh: ${updated} updated, ${failed} failed`);

    return NextResponse.json({
      ok: true,
      total: holdings.length,
      updated,
      failed,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error('[Cron] Price refresh error:', err);
    return NextResponse.json({ error: 'Price refresh failed' }, { status: 500 });
  }
}
