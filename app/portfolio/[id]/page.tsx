export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart2, Settings, List } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatCurrency, formatPercent, ratingToLabel, ratingDotColor, cn } from '@/lib/utils';
import { HoldingsTable } from '@/components/portfolio/holdings-table';
import { RatingBadge } from '@/components/ratings/rating-badge';
import type { Holding, RatingLabel } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

async function getPortfolio(id: number) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id },
    include: { holdings: true },
  });
  if (!portfolio) return null;

  const yahooSymbols = [...new Set(portfolio.holdings.map(h => h.yahooSymbol))];
  const ratings = await prisma.analystRating.findMany({
    where: { yahooSymbol: { in: yahooSymbols } },
  });
  const ratingMap = new Map(ratings.map(r => [r.yahooSymbol, r]));

  const holdings: Holding[] = portfolio.holdings.map(h => ({
    ...h,
    avgCost: h.avgCost ?? null,
    bookValue: h.bookValue ?? null,
    marketPrice: h.marketPrice ?? null,
    marketValue: h.marketValue ?? null,
    unrealizedGain: h.unrealizedGain ?? null,
    exchange: h.exchange ?? null,
    rating: ratingMap.get(h.yahooSymbol)
      ? {
          ...ratingMap.get(h.yahooSymbol)!,
          lastUpdated: ratingMap.get(h.yahooSymbol)!.lastUpdated.toISOString(),
        }
      : null,
  }));

  const totalMV = holdings.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  const totalBook = holdings.reduce((s, h) => s + (h.bookValue ?? 0), 0);
  const totalGain = holdings.reduce((s, h) => s + (h.unrealizedGain ?? 0), 0);
  const totalGainPct = totalBook > 0 ? (totalGain / totalBook) * 100 : 0;

  return {
    ...portfolio,
    holdings,
    totalMarketValue: totalMV,
    totalBookValue: totalBook,
    totalUnrealizedGain: totalGain,
    totalUnrealizedGainPct: totalGainPct,
  };
}

const RATING_LABELS: RatingLabel[] = ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell', 'N/A'];

export default async function PortfolioDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = 'holdings' } = await searchParams;

  const numId = parseInt(id);
  if (isNaN(numId)) notFound();

  const portfolio = await getPortfolio(numId);
  if (!portfolio) notFound();

  const isGain = portfolio.totalUnrealizedGain >= 0;

  // Asset type breakdown
  const assetTypeMap = new Map<string, number>();
  for (const h of portfolio.holdings) {
    assetTypeMap.set(h.assetType, (assetTypeMap.get(h.assetType) ?? 0) + (h.marketValue ?? 0));
  }
  const assetTypes = [...assetTypeMap.entries()].sort((a, b) => b[1] - a[1]);

  // Rating distribution
  const byRating: Record<RatingLabel, number> = {
    'Strong Buy': 0, 'Buy': 0, 'Hold': 0, 'Sell': 0, 'Strong Sell': 0, 'N/A': 0,
  };
  for (const h of portfolio.holdings) {
    const label = ratingToLabel(h.rating?.rating, h.rating?.ratingScore);
    byRating[label]++;
  }
  const totalRatings = Object.values(byRating).reduce((s, n) => s + n, 0);

  // Top gainers / losers
  const withPct = portfolio.holdings
    .filter(h => h.bookValue && h.bookValue > 0)
    .map(h => ({ ...h, pct: ((h.unrealizedGain ?? 0) / h.bookValue!) * 100 }));
  const topGainers = [...withPct].sort((a, b) => b.pct - a.pct).slice(0, 5);
  const topLosers = [...withPct].sort((a, b) => a.pct - b.pct).slice(0, 5);

  const tabs = ['holdings', 'analytics', 'settings'] as const;
  type Tab = typeof tabs[number];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
        <ArrowLeft size={14} />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{portfolio.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {portfolio.broker} · {portfolio.accountType} · {portfolio.owner}
              {portfolio.accountId && <span> · #{portfolio.accountId}</span>}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(portfolio.totalMarketValue)}</p>
            <p className={cn('text-sm font-medium mt-0.5', isGain ? 'text-emerald-400' : 'text-red-400')}>
              {isGain
                ? <span className="inline-flex items-center gap-1"><TrendingUp size={13} />{formatPercent(portfolio.totalUnrealizedGainPct)}</span>
                : <span className="inline-flex items-center gap-1"><TrendingDown size={13} />{formatPercent(portfolio.totalUnrealizedGainPct)}</span>
              }
              <span className="ml-2">{isGain ? '+' : ''}{formatCurrency(portfolio.totalUnrealizedGain)}</span>
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-[hsl(222,47%,16%)]">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">Holdings</p>
            <p className="text-xl font-bold text-white mt-0.5">{portfolio.holdings.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">Book Value</p>
            <p className="text-xl font-bold text-white mt-0.5 tabular-nums">{formatCurrency(portfolio.totalBookValue)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">Currency</p>
            <p className="text-xl font-bold text-white mt-0.5">{portfolio.currency}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[hsl(222,47%,16%)]">
        {tabs.map(t => (
          <Link
            key={t}
            href={`/portfolio/${id}?tab=${t}`}
            className={cn(
              'px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              tab === t
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-600'
            )}
          >
            {t === 'holdings' && <List size={13} className="inline mr-1.5" />}
            {t === 'analytics' && <BarChart2 size={13} className="inline mr-1.5" />}
            {t === 'settings' && <Settings size={13} className="inline mr-1.5" />}
            {t}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'holdings' && (
        <div className="glass-card rounded-2xl p-6">
          <HoldingsTable holdings={portfolio.holdings} currency={portfolio.currency} />
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Rating Distribution */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <BarChart2 size={15} className="text-blue-400" />
              Analyst Rating Distribution
            </h3>
            <div className="space-y-3">
              {RATING_LABELS.map(label => {
                const count = byRating[label] ?? 0;
                const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                const dotColor = ratingDotColor(label);
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-24 shrink-0">
                      <div className={cn('w-2 h-2 rounded-full', dotColor)} />
                      <span className="text-xs text-slate-400">{label}</span>
                    </div>
                    <div className="flex-1 h-2 bg-[hsl(222,47%,14%)] rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', dotColor)} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 tabular-nums w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Asset Allocation */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-5">Asset Allocation</h3>
            <div className="space-y-3">
              {assetTypes.map(([type, value]) => {
                const pct = portfolio.totalMarketValue > 0 ? (value / portfolio.totalMarketValue) * 100 : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 capitalize w-24 shrink-0">{type.replace('_', ' ')}</span>
                    <div className="flex-1 h-2 bg-[hsl(222,47%,14%)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300 tabular-nums w-28 text-right">
                      <span>{formatCurrency(value)}</span>
                      <span className="text-slate-600">({pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Gainers */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-emerald-400" />
              Top Gainers
            </h3>
            <div className="space-y-2">
              {topGainers.map(h => (
                <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-[hsl(222,47%,14%)] last:border-0">
                  <div>
                    <span className="text-sm font-mono font-semibold text-white">{h.symbol}</span>
                    <span className="ml-2"><RatingBadge rating={h.rating?.rating} score={h.rating?.ratingScore} size="sm" showIcon={false} /></span>
                  </div>
                  <span className="text-emerald-400 font-semibold text-sm">+{h.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingDown size={15} className="text-red-400" />
              Top Losers
            </h3>
            <div className="space-y-2">
              {topLosers.map(h => (
                <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-[hsl(222,47%,14%)] last:border-0">
                  <div>
                    <span className="text-sm font-mono font-semibold text-white">{h.symbol}</span>
                    <span className="ml-2"><RatingBadge rating={h.rating?.rating} score={h.rating?.ratingScore} size="sm" showIcon={false} /></span>
                  </div>
                  <span className="text-red-400 font-semibold text-sm">{h.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="glass-card rounded-2xl p-6 max-w-xl">
          <h3 className="text-sm font-semibold text-white mb-6">Portfolio Settings</h3>
          <form className="space-y-4" action={`/api/portfolios/${id}`} method="PATCH">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wide mb-1.5">Portfolio Name</label>
              <input
                type="text"
                name="name"
                defaultValue={portfolio.name}
                className="w-full px-3 py-2 text-sm bg-[hsl(222,47%,12%)] border border-[hsl(222,47%,20%)] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wide mb-1.5">Owner</label>
              <input
                type="text"
                name="owner"
                defaultValue={portfolio.owner}
                className="w-full px-3 py-2 text-sm bg-[hsl(222,47%,12%)] border border-[hsl(222,47%,20%)] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wide mb-1.5">Broker</label>
              <input
                type="text"
                name="broker"
                defaultValue={portfolio.broker}
                className="w-full px-3 py-2 text-sm bg-[hsl(222,47%,12%)] border border-[hsl(222,47%,20%)] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[hsl(222,47%,16%)]">
            <h4 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h4>
            <p className="text-xs text-slate-500 mb-3">Deleting a portfolio will remove all holdings permanently.</p>
            <form action={`/api/portfolios/${id}`} method="DELETE">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Delete Portfolio
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
