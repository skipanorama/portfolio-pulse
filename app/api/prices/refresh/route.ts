import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchBatchPrices } from '@/lib/yahoo-finance';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const holdings = await prisma.holding.findMany({
      select: { id: true, yahooSymbol: true, quantity: true, bookValue: true },
    });

    const symbols = [...new Set(holdings.map((h: { yahooSymbol: string }) => h.yahooSymbol))];
    const priceMap = await fetchBatchPrices(symbols);

    let updated = 0;
    const now = new Date();

    await Promise.all(
      holdings.map(async (h: { id: number; yahooSymbol: string; quantity: number; bookValue: number | null }) => {
        const priceData = priceMap.get(h.yahooSymbol);
        if (!priceData) return;
        const marketPrice = priceData.price;
        const marketValue = marketPrice * h.quantity;
        const unrealizedGain = h.bookValue != null ? marketValue - h.bookValue : null;
        await prisma.holding.update({
          where: { id: h.id },
          data: { marketPrice, marketValue, unrealizedGain, lastPriceUpdate: now },
        });
        updated++;
      })
    );

    const origin = new URL(req.url).origin;
    return NextResponse.redirect(new URL('/', origin));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to refresh prices' }, { status: 500 });
  }
}
