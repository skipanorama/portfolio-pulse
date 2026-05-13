export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { TrendingUp, TrendingDown, RefreshCw, Star, Award, BarChart2, Briefcase, ArrowUpRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatCurrency, formatPercent, ratingToLabel, ratingColor, ratingDotColor, cn } from '@/lib/utils';
import { RatingBadge } from '@/components/ratings/rating-badge';
import type { RatingLabel } from '@/types';

async function getDashboardData() {
  const portfolios = await prisma.portfolio.findMany({
    include: {
      holdings: true,
    },
    orderBy: { name: 'asc' },
  });

  const allYahooSymbols = [...new Set(
    portfolios.flatMap(p => p.holdings.map(h => h.yahooSymbol))
  )];

  const ratings = await prisma.analystRating.findMany({
    where: { yahooSymbol: { in: allYahooSymbols } },
  });

  const ratingMap = new Map(ratings.map(r => [r.yahooSymbol, r]));

  // Enrich holdings with ratings
  const enrichedPortfolios = portfolios.map(p => {
    const holdingsWithRatings = p.holdings.map(h => ({
      ...h,
      rating: ratingMap.get(h.yahooSymbol) ?? null,
    }));

    const totalMV = holdingsWithRatings.reduce((s, h) => s + (h.marketValue ?? 0), 0);
    const totalBook = holdingsWithRatings.reduce((s, h) => s + (h.bookValue ?? 0), 0);
    const totalGain = holdingsWithRatings.reduce((s, h) => s + (h.unrealizedGain ?? 0), 0);

    return {
      ...p,
      holdings: holdingsWithRatings,
      totalMarketValue: totalMV,
      totalBookValue: totalBook,
      totalUnrealizedGain: totalGain,
      totalUnrealizedGainPct: totalBook > 0 ? (totalGain / totalBook) * 100 : 0,
    };
  });

  // Global totals
  const totalMV = enrichedPortfolios.reduce((s, p) => s + p.totalMarketValue, 0);
  const totalBook = enrichedPortfolios.reduce((s, p) => s + p.totalBookValue, 0);
  const totalGain = enrichedPortfolios.reduce((s, p) => s + p.totalUnrealizedGain, 0);
  const totalGainPct = totalBook > 0 ? (totalGain / totalBook) * 100 : 0;

  // Rating distribution across all holdings
  const byRating: Record<RatingLabel, number> = {
    'Strong Buy': 0, 'Buy': 0, 'Hold': 0, 'Sell': 0, 'Strong Sell': 0, 'N/A': 0,
  };

  const allHoldings = enrichedPortfolios.flatMap(p => p.holdings);
  for (const h of allHoldings) {
    const r = h.rating;
    const label = ratingToLabel(r?.rating, r?.ratingScore);
    byRating[label] = (byRating[label] ?? 0) + 1;
  }

  // Best/Worst performers
  const holdingsWithGain = allHoldings.filter(h => h.bookValue && h.bookValue > 0);
  const sorted = [...holdingsWithGain].sort((a, b) => {
    const aPct = ((a.unrealizedGain ?? 0) / a.bookValue!) * 100;
    const bPct = ((b.unrealizedGain ?? 0) / b.bookValue!) * 100;
    return bPct - aPct;
  });

  const bestPerformer = sorted[0] ?? null;
  const worstPerformer = sorted[sorted.length - 1] ?? null;
  const biggestHolding = [...allHoldings].sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))[0] ?? null;

  const lastRatingsUpdate = ratings.length > 0
    ? new Date(Math.max(...ratings.map(r => r.lastUpdated.getTime())))
    : null;

  const lastPriceUpdate = (() => {
    const dates = allHoldings
      .map(h => h.lastPriceUpdate)
      .filter((d): d is Date => d != null);
    return dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
  })();

  return {
    portfolios: enrichedPortfolios,
    totalMV, totalBook, totalGain, totalGainPct,
    byRating, bestPerformer, worstPerformer, biggestHolding,
    lastRatingsUpdate,
    lastPriceUpdate,
    totalHoldings: allHoldings.length,
  };
}

const RATING_LABELS: RatingLabel[] = ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell', 'N/A'];

export default async function DashboardPage() {
  const data = await getDashboardData();
  const isGain = data.totalGain >= 0;
  const totalRatings = Object.values(data.byRating).reduce((s, n) => s + n, 0);

  const fmtTime = (d: Date) =>
    d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            {data.portfolios.length} portfolios · {data.totalHoldings} holdings
            {data.lastPriceUpdate && (
              <span> · Prices: {fmtTime(data.lastPriceUpdate)}</span>
            )}
            {data.lastRatingsUpdate && (
              <span> · Ratings: {fmtTime(data.lastRatingsUpdate)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form action="/api/prices/refresh" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-300 bg-emerald-600/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-600/20 transition-colors"
            >
              <RefreshCw size={14} />
              Refresh Prices
            </button>
          </form>
          <form action="/api/ratings/refresh" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-300 bg-blue-600/10 border border-blue-500/20 rounded-lg hover:bg-blue-600/20 transition-colors"
            >
              <RefreshCw size={14} />
              Refresh Ratings
            </button>
          </form>
        </div>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="glass-card rounded-2xl p-6 col-span-1 sm:col-span-2 xl:col-span-1 glow-blue">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Total Portfolio Value</p>
          <p className="text-3xl font-bold text-white tabular-nums">{formatCurrency(data.totalMV)}</p>
          <p className="text-xs text-slate-500 mt-1">Book: {formatCurrency(data.totalBook)}</p>
        </div>
        {/* Total Gain */}
        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Total Unrealized G/L</p>
          <p className={cn('text-2xl font-bold tabular-nums', isGain ? 'text-emerald-400' : 'text-red-400')}>
            {isGain ? '+' : ''}{formatCurrency(data.totalGain)}
          </p>
          <p className={cn('text-sm font-medium mt-1', isGain ? 'text-emerald-400' : 'text-red-400')}>
            {isGain
              ? <span className="flex items-center gap-1"><TrendingUp size={13} />{formatPercent(data.totalGainPct)}</span>
              : <span className="flex items-center gap-1"><TrendingDown size={13} />{formatPercent(data.totalGainPct)}</span>
            }
          </p>
        </div>
        {/* Best Performer */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-1.5 mb-2">
            <Award size={13} className="text-emerald-400" />
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Best Performer</p>
          </div>
          {data.bestPerformer ? (
            <>
              <p className="text-lg font-bold text-white">{data.bestPerformer.symbol}</p>
              <p className="text-xs text-slate-500 truncate">{data.bestPerformer.name}</p>
              <p className="text-emerald-400 text-sm font-semibold mt-1">
                +{((( data.bestPerformer.unrealizedGain ?? 0) / data.bestPerformer.bookValue!) * 100).toFixed(1)}%
              </p>
            </>
          ) : <p className="text-slate-500 text-sm">No data</p>}
        </div>
        {/* Worst Performer */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown size={13} className="text-red-400" />
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Worst Performer</p>
          </div>
          {data.worstPerformer ? (
            <>
              <p className="text-lg font-bold text-white">{data.worstPerformer.symbol}</p>
              <p className="text-xs text-slate-500 truncate">{data.worstPerformer.name}</p>
              <p className="text-red-400 text-sm font-semibold mt-1">
                {((( data.worstPerformer.unrealizedGain ?? 0) / data.worstPerformer.bookValue!) * 100).toFixed(1)}%
              </p>
            </>
          ) : <p className="text-slate-500 text-sm">No data</p>}
        </div>
      </div>

      {/* Ratings distribution + Biggest Holding */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ratings Distribution */}
        <div className="glass-card rounded-2xl p-6 xl:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Analyst Ratings Distribution</h2>
            <span className="ml-auto text-xs text-slate-500">{totalRatings} holdings total</span>
          </div>
          <div className="space-y-3">
            {RATING_LABELS.map(label => {
              const count = data.byRating[label] ?? 0;
              const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
              const dotColor = ratingDotColor(label);
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-24 shrink-0">
                    <div className={cn('w-2 h-2 rounded-full', dotColor)} />
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                  <div className="flex-1 h-2 bg-[hsl(222,47%,14%)] rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', dotColor)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 w-16 justify-end">
                    <span className="text-xs font-semibold text-slate-200 tabular-nums">{count}</span>
                    <span className="text-xs text-slate-600">({pct.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Biggest Holding */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Star size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Largest Position</h2>
          </div>
          {data.biggestHolding ? (
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-white font-mono">{data.biggestHolding.symbol}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{data.biggestHolding.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[hsl(222,47%,12%)] rounded-lg p-2.5">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wide">Market Value</p>
                  <p className="text-sm font-bold text-white mt-0.5 tabular-nums">
                    {formatCurrency(data.biggestHolding.marketValue, data.biggestHolding.currency)}
                  </p>
                </div>
                <div className="bg-[hsl(222,47%,12%)] rounded-lg p-2.5">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wide">G/L</p>
                  <p className={cn('text-sm font-bold mt-0.5 tabular-nums', (data.biggestHolding.unrealizedGain ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {formatCurrency(data.biggestHolding.unrealizedGain ?? 0, data.biggestHolding.currency)}
                  </p>
                </div>
              </div>
              <RatingBadge
                rating={(data.biggestHolding as { rating?: { rating?: string | null; ratingScore?: number | null } | null }).rating?.rating}
                score={(data.biggestHolding as { rating?: { rating?: string | null; ratingScore?: number | null } | null }).rating?.ratingScore}
                size="md"
              />
            </div>
          ) : <p className="text-slate-500 text-sm">No data</p>}
        </div>
      </div>

      {/* Portfolio Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Briefcase size={18} className="text-blue-400" />
            Portfolios
          </h2>
          <Link href="/import" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            + Import New
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.portfolios.map(p => {
            const isPos = p.totalUnrealizedGain >= 0;
            const topHoldings = [...p.holdings]
              .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))
              .slice(0, 3);

            return (
              <Link
                key={p.id}
                href={`/portfolio/${p.id}`}
                className="glass-card rounded-2xl p-5 hover:border-blue-500/30 hover:bg-[hsl(222,47%,12%)] transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-white text-sm group-hover:text-blue-300 transition-colors">{p.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.broker} · {p.accountType} · {p.owner}</p>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors mt-0.5" />
                </div>

                <div className="mb-4">
                  <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(p.totalMarketValue)}</p>
                  <p className={cn('text-xs font-medium mt-0.5', isPos ? 'text-emerald-400' : 'text-red-400')}>
                    {isPos ? '+' : ''}{formatCurrency(p.totalUnrealizedGain)}
                    <span className="ml-1 opacity-80">({formatPercent(p.totalUnrealizedGainPct)})</span>
                  </p>
                </div>

                {topHoldings.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-[hsl(222,47%,16%)]">
                    <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold mb-2">Top Holdings</p>
                    {topHoldings.map(h => (
                      <div key={h.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-blue-300">{h.symbol}</span>
                          <RatingBadge
                            rating={(h as { rating?: { rating?: string | null; ratingScore?: number | null } | null }).rating?.rating}
                            score={(h as { rating?: { rating?: string | null; ratingScore?: number | null } | null }).rating?.ratingScore}
                            size="sm"
                            showIcon={false}
                          />
                        </div>
                        <span className="text-xs text-slate-300 tabular-nums">{formatCurrency(h.marketValue, h.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-[hsl(222,47%,16%)] flex items-center justify-between">
                  <span className="text-xs text-slate-600">{p.holdings.length} holdings</span>
                  <span className="text-xs text-slate-600">{p.currency}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
