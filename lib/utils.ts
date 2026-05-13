import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RatingLabel } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined, currency = 'CAD'): string {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function ratingToLabel(rating: string | null | undefined, score?: number | null): RatingLabel {
  if (!rating && !score) return 'N/A';

  if (rating) {
    const r = rating.toLowerCase().replace(/[_\s]/g, '');
    if (r === 'strongbuy') return 'Strong Buy';
    if (r === 'buy') return 'Buy';
    if (r === 'hold' || r === 'neutral') return 'Hold';
    if (r === 'sell' || r === 'underperform') return 'Sell';
    if (r === 'strongsell') return 'Strong Sell';
  }

  if (score != null) {
    if (score <= 1.5) return 'Strong Buy';
    if (score <= 2.5) return 'Buy';
    if (score <= 3.5) return 'Hold';
    if (score <= 4.5) return 'Sell';
    return 'Strong Sell';
  }

  return 'N/A';
}

export function ratingColor(label: RatingLabel): string {
  switch (label) {
    case 'Strong Buy': return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    case 'Buy': return 'text-green-400 bg-green-500/15 border-green-500/30';
    case 'Hold': return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    case 'Sell': return 'text-orange-400 bg-orange-500/15 border-orange-500/30';
    case 'Strong Sell': return 'text-red-400 bg-red-500/15 border-red-500/30';
    default: return 'text-slate-400 bg-slate-500/15 border-slate-500/30';
  }
}

export function ratingDotColor(label: RatingLabel): string {
  switch (label) {
    case 'Strong Buy': return 'bg-emerald-400';
    case 'Buy': return 'bg-green-400';
    case 'Hold': return 'bg-amber-400';
    case 'Sell': return 'bg-orange-400';
    case 'Strong Sell': return 'bg-red-400';
    default: return 'bg-slate-500';
  }
}

export function ratingScore(label: RatingLabel): number {
  switch (label) {
    case 'Strong Buy': return 1;
    case 'Buy': return 2;
    case 'Hold': return 3;
    case 'Sell': return 4;
    case 'Strong Sell': return 5;
    default: return 6;
  }
}

export function getYahooSymbol(symbol: string, currency: string, exchange?: string | null): string {
  // Known US-traded symbols (no suffix needed)
  const usSymbols = new Set([
    'BABA','GLW','IBM','KD','JD','LOW','SPLY','TCEHY','SNDL','AXP','GE','GEHC','GEV',
    'WAB','ARKK','BRK.B','BRK-B','META','NOW','UBER','AMD','GOOGL','AVY','C','LLY',
    'GS','HSBC','IHI','LMT','MA','NKE','ORCL','PSKY','PEP','PFE','SPGI','SBUX','VZ',
    'HOOD','TCEHY','XEF','XMC',
  ]);

  // Canadian stocks that need .TO suffix
  const tsxSymbols: Record<string, string> = {
    'ACO.X': 'ACO-X.TO',
    'ATRL': 'ATRL.TO',
    'BB': 'BB.TO',
    'BCE': 'BCE.TO',
    'CNQ': 'CNQ.TO',
    'EMA': 'EMA.TO',
    'ENB': 'ENB.TO',
    'FTS': 'FTS.TO',
    'GIB.A': 'GIB-A.TO',
    'HUT': 'HUT.TO',
    'K': 'K.TO',
    'KEY': 'KEY.TO',
    'MFC': 'MFC.TO',
    'NTR': 'NTR.TO',
    'PSK': 'PSK.TO',
    'SU': 'SU.TO',
    'T': 'T.TO',
    'TD': 'TD.TO',
    'XLY': 'CBDY.V',
    'BMO': 'BMO.TO',
    'SHOP': 'SHOP.TO',
    'BNG': 'BNG.V',
    'NSCI': 'NSCI.V',
    'ATD': 'ATD.TO',
    'FM': 'FM.TO',
    'SAY': 'SAY.V',
    'WSP': 'WSP.TO',
    'ALA': 'ALA.TO',
    'ABX': 'ABX.TO',
    'BEPC': 'BEPC.TO',
    'BEP.UN': 'BEP-UN.TO',
    'CNR': 'CNR.TO',
    'CVE': 'CVE.TO',
    'IGM': 'IGM.TO',
    'XEF': 'XEF.TO',
    'XMC': 'XMC.TO',
    'L': 'L.TO',
    'OVV': 'OVV.TO',
    'POW': 'POW.TO',
    'QSR': 'QSR.TO',
    'SRU.UN': 'SRU-UN.TO',
    'SUNC': 'SUNC.TO',
    'TRI': 'TRI.TO',
    'WCP': 'WCP.TO',
    'CAE': 'CAE.TO',
    'CP': 'CP.TO',
    'D.UN': 'D-UN.TO',
    'FTT': 'FTT.TO',
    'MG': 'MG.TO',
    'REI.UN': 'REI-UN.TO',
    'SLF': 'SLF.TO',
    'ATCO': 'ACO-X.TO',
    'GIB': 'GIB-A.TO',
    'KINROSS': 'K.TO',
    'KEYERA': 'KEY.TO',
    'MANULIFE': 'MFC.TO',
  };

  if (tsxSymbols[symbol]) return tsxSymbols[symbol];
  if (usSymbols.has(symbol)) return symbol;

  // If currency is CAD and not in either list, assume TSX
  if (currency === 'CAD' && !symbol.includes('.') && !symbol.includes('-')) {
    if (symbol.length <= 5 && /^[A-Z.]+$/.test(symbol)) {
      return `${symbol}.TO`;
    }
  }

  return symbol;
}
