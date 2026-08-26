'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type Kind = 'prices' | 'ratings';
type Status = { type: 'success' | 'error'; message: string } | null;

export function RefreshButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState<Kind | null>(null);
  const [status, setStatus] = useState<Status>(null);

  async function handleRefresh(kind: Kind) {
    setLoading(kind);
    setStatus(null);
    try {
      const res = await fetch(`/api/${kind}/refresh`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? `Failed to refresh ${kind}`);
      }
      setStatus({ type: 'success', message: data?.message ?? `${kind === 'prices' ? 'Prices' : 'Ratings'} refreshed` });
      router.refresh();
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : `Failed to refresh ${kind}`,
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handleRefresh('prices')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-300 bg-emerald-600/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={cn(loading === 'prices' && 'animate-spin')} />
          Refresh Prices
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handleRefresh('ratings')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-300 bg-blue-600/10 border border-blue-500/20 rounded-lg hover:bg-blue-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={cn(loading === 'ratings' && 'animate-spin')} />
          Refresh Ratings
        </button>
      </div>
      {status && (
        <p className={cn('text-xs', status.type === 'success' ? 'text-emerald-400' : 'text-red-400')}>
          {status.message}
        </p>
      )}
    </div>
  );
}
