export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { Briefcase, ArrowUpRight, TrendingUp, TrendingDown, Plus } from 'lucide-react';

async function getPortfolios() {
  const portfolios = await prisma.portfolio.findMany({
    include: { holdings: true },
    orderBy: { name: 'asc' },
  });
  return portfolios.map(p => {
    const totalMV = p.holdings.reduce((s, h) => s + (h.marketValue ?? 0), 0);
    const totalBook = p.holdings.reduce((s, h) => s + (h.bookValue ?? 0), 0);
    const totalGain = p.holdings.reduce((s, h) => s + (h.unrealizedGain ?? 0), 0);
    return {
      ...p,
      totalMarketValue: totalMV,
      totalBookValue: totalBook,
      totalUnrealizedGain: totalGain,
      totalUnrealizedGainPct: totalBook > 0 ? (totalGain / totalBook) * 100 : 0,
    };
  });
}

export default async function PortfoliosPage() {
  const portfolios = await getPortfolios();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Portfolios</h1>
          <p className="text-slate-500 text-sm mt-1">{portfolios.length} portfolios</p>
        </div>
        <Link
          href="/import"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
        >
          <Plus size={14} />
          New Portfolio
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {portfolios.map(p => {
          const isPos = p.totalUnrealizedGain >= 0;
          return (
            <Link
              key={p.id}
              href={`/portfolio/${p.id}`}
              className="glass-card rounded-2xl p-5 hover:border-blue-500/30 hover:bg-[hsl(222,47%,12%)] transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Briefcase size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm group-hover:text-blue-300 transition-colors">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.broker}</p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors mt-1" />
              </div>

              <div className="space-y-1 mb-4">
                <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(p.totalMarketValue)}</p>
                <p className={cn('text-sm font-medium flex items-center gap-1', isPos ? 'text-emerald-400' : 'text-red-400')}>
                  {isPos ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {isPos ? '+' : ''}{formatCurrency(p.totalUnrealizedGain)}
                  <span className="opacity-75">({formatPercent(p.totalUnrealizedGainPct)})</span>
                </p>
              </div>

              <div className="pt-3 border-t border-[hsl(222,47%,16%)] grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-wide">Type</p>
                  <p className="text-xs font-medium text-slate-300 mt-0.5">{p.accountType}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-wide">Owner</p>
                  <p className="text-xs font-medium text-slate-300 mt-0.5">{p.owner}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-wide">Holdings</p>
                  <p className="text-xs font-medium text-slate-300 mt-0.5">{p.holdings.length}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
