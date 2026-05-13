import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: numId },
      include: { holdings: true },
    });

    if (!portfolio) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const yahooSymbols = [...new Set(portfolio.holdings.map(h => h.yahooSymbol))];
    const ratings = await prisma.analystRating.findMany({
      where: { yahooSymbol: { in: yahooSymbols } },
    });
    const ratingMap = new Map(ratings.map(r => [r.yahooSymbol, r]));

    const holdingsWithRatings = portfolio.holdings.map(h => ({
      ...h,
      rating: ratingMap.get(h.yahooSymbol) ?? null,
    }));

    const totalMarketValue = holdingsWithRatings.reduce((s, h) => s + (h.marketValue ?? 0), 0);
    const totalBookValue = holdingsWithRatings.reduce((s, h) => s + (h.bookValue ?? 0), 0);
    const totalUnrealizedGain = holdingsWithRatings.reduce((s, h) => s + (h.unrealizedGain ?? 0), 0);

    return NextResponse.json({
      ...portfolio,
      holdings: holdingsWithRatings,
      totalMarketValue,
      totalBookValue,
      totalUnrealizedGain,
      totalUnrealizedGainPct: totalBookValue > 0 ? (totalUnrealizedGain / totalBookValue) * 100 : 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();
    const { name, owner, broker, accountType, accountId, currency } = body;

    const portfolio = await prisma.portfolio.update({
      where: { id: numId },
      data: {
        ...(name && { name: name.trim() }),
        ...(owner && { owner: owner.trim() }),
        ...(broker && { broker: broker.trim() }),
        ...(accountType && { accountType: accountType.trim() }),
        ...(accountId !== undefined && { accountId }),
        ...(currency && { currency }),
      },
    });

    return NextResponse.json(portfolio);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update portfolio' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    await prisma.portfolio.delete({ where: { id: numId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete portfolio' }, { status: 500 });
  }
}
