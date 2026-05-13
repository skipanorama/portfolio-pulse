import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const portfolios = await prisma.portfolio.findMany({
      include: { holdings: true },
      orderBy: { name: 'asc' },
    });

    const enriched = portfolios.map(p => {
      const totalMarketValue = p.holdings.reduce((s, h) => s + (h.marketValue ?? 0), 0);
      const totalBookValue = p.holdings.reduce((s, h) => s + (h.bookValue ?? 0), 0);
      const totalUnrealizedGain = p.holdings.reduce((s, h) => s + (h.unrealizedGain ?? 0), 0);
      const totalUnrealizedGainPct = totalBookValue > 0 ? (totalUnrealizedGain / totalBookValue) * 100 : 0;
      return {
        ...p,
        totalMarketValue,
        totalBookValue,
        totalUnrealizedGain,
        totalUnrealizedGainPct,
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch portfolios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, owner, broker, accountType, accountId, currency } = body;

    if (!name || !owner || !broker || !accountType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        name: name.trim(),
        owner: owner.trim(),
        broker: broker.trim(),
        accountType: accountType.trim(),
        accountId: accountId ?? null,
        currency: currency ?? 'CAD',
      },
    });

    return NextResponse.json(portfolio, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 });
  }
}
