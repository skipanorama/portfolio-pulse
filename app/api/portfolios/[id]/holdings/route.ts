import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getYahooSymbol } from '@/lib/utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const holdings = await prisma.holding.findMany({
      where: { portfolioId: numId },
      orderBy: [{ marketValue: 'desc' }],
    });

    const yahooSymbols = [...new Set(holdings.map((h: { yahooSymbol: string }) => h.yahooSymbol))];
    const ratings = await prisma.analystRating.findMany({
      where: { yahooSymbol: { in: yahooSymbols } },
    });
    const ratingMap = new Map(ratings.map((r: { yahooSymbol: string }) => [r.yahooSymbol, r]));

    return NextResponse.json(
      holdings.map((h: { yahooSymbol: string }) => ({ ...h, rating: ratingMap.get(h.yahooSymbol) ?? null }))
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch holdings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();
    const { holdings } = body;

    if (!Array.isArray(holdings)) {
      return NextResponse.json({ error: 'holdings must be an array' }, { status: 400 });
    }

    // Verify portfolio exists
    const portfolio = await prisma.portfolio.findUnique({ where: { id: numId } });
    if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });

    const created = await prisma.holding.createMany({
      data: holdings.map((h: {
        symbol: string;
        yahooSymbol?: string;
        name: string;
        quantity: number;
        currency?: string;
        avgCost?: number | null;
        bookValue?: number | null;
        marketPrice?: number | null;
        marketValue?: number | null;
        unrealizedGain?: number | null;
        assetType?: string;
        exchange?: string | null;
      }) => ({
        portfolioId: numId,
        symbol: h.symbol,
        yahooSymbol: h.yahooSymbol ?? getYahooSymbol(h.symbol, h.currency ?? portfolio.currency),
        name: h.name,
        quantity: h.quantity,
        currency: h.currency ?? portfolio.currency,
        avgCost: h.avgCost ?? null,
        bookValue: h.bookValue ?? null,
        marketPrice: h.marketPrice ?? null,
        marketValue: h.marketValue ?? null,
        unrealizedGain: h.unrealizedGain ?? null,
        assetType: h.assetType ?? 'stock',
        exchange: h.exchange ?? null,
      })),
    });

    return NextResponse.json({ created: created.count }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create holdings' }, { status: 500 });
  }
}
