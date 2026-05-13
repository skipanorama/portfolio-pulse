'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import type { Holding, RatingLabel } from '@/types';
import { formatCurrency, formatPercent, formatNumber, ratingToLabel, cn } from '@/lib/utils';
import { RatingBadge } from '@/components/ratings/rating-badge';

interface HoldingsTableProps {
  holdings: Holding[];
  loading?: boolean;
  currency?: string;
}

type SortKey = keyof Holding | 'ratingLabel' | 'gainPct';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 20;

const RATING_FILTERS: (RatingLabel | 'All')[] = ['All', 'Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell', 'N/A'];

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 11 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  );
}

function RatingDistBar({ strongBuy, buy, hold, sell, strongSell }: {
  strongBuy?: number | null;
  buy?: number | null;
  hold?: number | null;
  sell?: number | null;
  strongSell?: number | null;
}) {
  const total = (strongBuy ?? 0) + (buy ?? 0) + (hold ?? 0) + (sell ?? 0) + (strongSell ?? 0);
  if (!total) return null;

  const pct = (n: number | null | undefined) => ((n ?? 0) / total) * 100;

  return (
    <div className="flex gap-0.5 w-24 h-2 rounded-full overflow-hidden" title={`${strongBuy ?? 0}SB / ${buy ?? 0}B / ${hold ?? 0}H / ${sell ?? 0}S / ${strongSell ?? 0}SS`}>
      {pct(strongBuy) > 0 && <div className="bg-emerald-400" style={{ width: `${pct(strongBuy)}%` }} />}
      {pct(buy) > 0 && <div className="bg-green-400" style={{ width: `${pct(buy)}%` }} />}
      {pct(hold) > 0 && <div className="bg-amber-400" style={{ width: `${pct(hold)}%` }} />}
      {pct(sell) > 0 && <div className="bg-orange-400" style={{ width: `${pct(sell)}%` }} />}
      {pct(strongSell) > 0 && <div className="bg-red-400" style={{ width: `${pct(strongSell)}%` }} />}
    </div>
  );
}

export function HoldingsTable({ holdings, loading = false, currency = 'CAD' }: HoldingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('marketValue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingLabel | 'All'>('All');
  const [page, setPage] = useState(1);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  }, [sortKey]);

  const filtered = useMemo(() => {
    return holdings.filter(h => {
      const matchSearch = !search ||
        h.symbol.toLowerCase().includes(search.toLowerCase()) ||
        h.name.toLowerCase().includes(search.toLowerCase());
      const label = ratingToLabel(h.rating?.rating, h.rating?.ratingScore);
      const matchRating = ratingFilter === 'All' || label === ratingFilter;
      return matchSearch && matchRating;
    });
  }, [holdings, search, ratingFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      if (sortKey === 'ratingLabel') {
        const scoreMap: Record<string, number> = { 'Strong Buy': 1, 'Buy': 2, 'Hold': 3, 'Sell': 4, 'Strong Sell': 5, 'N/A': 6 };
        aVal = scoreMap[ratingToLabel(a.rating?.rating, a.rating?.ratingScore)] ?? 6;
        bVal = scoreMap[ratingToLabel(b.rating?.rating, b.rating?.ratingScore)] ?? 6;
      } else if (sortKey === 'gainPct') {
        aVal = a.bookValue ? ((a.unrealizedGain ?? 0) / a.bookValue) * 100 : 0;
        bVal = b.bookValue ? ((b.unrealizedGain ?? 0) / b.bookValue) * 100 : 0;
      } else {
        aVal = (a[sortKey as keyof Holding] as number | string) ?? 0;
        bVal = (b[sortKey as keyof Holding] as number | string) ?? 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const headers = ['Symbol', 'Name', 'Qty', 'Currency', 'Avg Cost', 'Market Price', 'Market Value', 'Unrealized G/L', 'G/L %', 'Rating', 'Target Price', '# Analysts'];
    const rows = sorted.map(h => {
      const pct = h.bookValue ? ((h.unrealizedGain ?? 0) / h.bookValue * 100).toFixed(2) : '';
      return [
        h.symbol, `"${h.name}"`, h.quantity, h.currency,
        h.avgCost ?? '', h.marketPrice ?? '', h.marketValue ?? '',
        h.unrealizedGain ?? '', pct,
        ratingToLabel(h.rating?.rating, h.rating?.ratingScore),
        h.rating?.targetPrice ?? '', h.rating?.numberOfAnalysts ?? '',
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'holdings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown size={12} className="text-slate-600" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-blue-400" />
      : <ChevronDown size={12} className="text-blue-400" />;
  }

  function Th({ col, label, className }: { col: SortKey; label: string; className?: string }) {
    return (
      <th
        className={cn('px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer select-none whitespace-nowrap hover:text-slate-300 transition-colors', className)}
        onClick={() => handleSort(col)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <SortIcon col={col} />
        </span>
      </th>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search symbol or name…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[hsl(222,47%,12%)] border border-[hsl(222,47%,20%)] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <select
              value={ratingFilter}
              onChange={e => { setRatingFilter(e.target.value as RatingLabel | 'All'); setPage(1); }}
              className="pl-8 pr-3 py-2 text-sm bg-[hsl(222,47%,12%)] border border-[hsl(222,47%,20%)] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
            >
              {RATING_FILTERS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{filtered.length} holdings</span>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-[hsl(222,47%,14%)] border border-[hsl(222,47%,20%)] rounded-lg hover:bg-[hsl(222,47%,18%)] transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[hsl(222,47%,16%)]">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(222,47%,9%)]">
            <tr>
              <Th col="symbol" label="Symbol" />
              <Th col="name" label="Name" className="min-w-[180px]" />
              <Th col="quantity" label="Qty" />
              <Th col="avgCost" label="Avg Cost" />
              <Th col="marketPrice" label="Price" />
              <Th col="marketValue" label="Mkt Value" />
              <Th col="unrealizedGain" label="Unreal. G/L" />
              <Th col="gainPct" label="G/L %" />
              <Th col="ratingLabel" label="Rating" />
              <Th col="unrealizedGain" label="Distribution" className="min-w-[120px]" />
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Target / Analysts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(222,47%,14%)]">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : paginated.length === 0
                ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-slate-500 text-sm">
                      No holdings found
                    </td>
                  </tr>
                )
                : paginated.map(h => {
                  const gainPct = h.bookValue && h.bookValue !== 0 ? (h.unrealizedGain ?? 0) / h.bookValue * 100 : null;
                  const isPos = (h.unrealizedGain ?? 0) >= 0;

                  return (
                    <tr key={h.id} className="hover:bg-[hsl(222,47%,11%)] transition-colors">
                      {/* Symbol */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-blue-300 text-xs bg-blue-500/10 px-1.5 py-0.5 rounded">
                          {h.symbol}
                        </span>
                      </td>
                      {/* Name */}
                      <td className="px-4 py-3 text-slate-300 max-w-[220px]">
                        <span className="block truncate" title={h.name}>{h.name}</span>
                        <span className="text-[10px] text-slate-600">{h.currency} · {h.assetType}</span>
                      </td>
                      {/* Qty */}
                      <td className="px-4 py-3 text-slate-300 tabular-nums">
                        {formatNumber(h.quantity, h.quantity % 1 === 0 ? 0 : 3)}
                      </td>
                      {/* Avg Cost */}
                      <td className="px-4 py-3 text-slate-400 tabular-nums text-xs">
                        {h.avgCost != null ? formatCurrency(h.avgCost, h.currency) : '—'}
                      </td>
                      {/* Market Price */}
                      <td className="px-4 py-3 text-slate-200 tabular-nums font-medium">
                        {h.marketPrice != null ? formatCurrency(h.marketPrice, h.currency) : '—'}
                      </td>
                      {/* Market Value */}
                      <td className="px-4 py-3 text-slate-100 tabular-nums font-semibold">
                        {formatCurrency(h.marketValue, h.currency)}
                      </td>
                      {/* Unrealized G/L */}
                      <td className={cn('px-4 py-3 tabular-nums font-medium', isPos ? 'text-emerald-400' : 'text-red-400')}>
                        {h.unrealizedGain != null ? (isPos ? '+' : '') + formatCurrency(h.unrealizedGain, h.currency) : '—'}
                      </td>
                      {/* G/L % */}
                      <td className={cn('px-4 py-3 tabular-nums font-medium text-sm', gainPct != null && gainPct >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {gainPct != null ? formatPercent(gainPct) : '—'}
                      </td>
                      {/* Rating */}
                      <td className="px-4 py-3">
                        <RatingBadge rating={h.rating?.rating} score={h.rating?.ratingScore} size="sm" />
                      </td>
                      {/* Distribution */}
                      <td className="px-4 py-3">
                        <RatingDistBar
                          strongBuy={h.rating?.strongBuyCount}
                          buy={h.rating?.buyCount}
                          hold={h.rating?.holdCount}
                          sell={h.rating?.sellCount}
                          strongSell={h.rating?.strongSellCount}
                        />
                      </td>
                      {/* Target / Analysts */}
                      <td className="px-4 py-3 text-slate-400 tabular-nums text-xs">
                        {h.rating?.targetPrice != null
                          ? <span className="text-slate-200">{formatCurrency(h.rating.targetPrice, h.currency)}</span>
                          : '—'
                        }
                        {h.rating?.numberOfAnalysts != null && (
                          <span className="text-slate-600 ml-1">/ {h.rating.numberOfAnalysts}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages} · {sorted.length} results
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[hsl(222,47%,14%)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
              return (
                <button
                  key={i}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-7 h-7 rounded text-xs font-medium transition-colors',
                    page === p
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[hsl(222,47%,14%)]'
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[hsl(222,47%,14%)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
