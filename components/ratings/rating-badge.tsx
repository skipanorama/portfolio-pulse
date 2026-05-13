import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus, HelpCircle } from 'lucide-react';
import { cn, ratingToLabel, ratingColor } from '@/lib/utils';
import type { RatingLabel } from '@/types';

interface RatingBadgeProps {
  rating?: string | null;
  score?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

function RatingIcon({ label, size }: { label: RatingLabel; size: number }) {
  const props = { size, strokeWidth: 2 };
  switch (label) {
    case 'Strong Buy': return <TrendingUp {...props} />;
    case 'Buy': return <ArrowUp {...props} />;
    case 'Hold': return <Minus {...props} />;
    case 'Sell': return <ArrowDown {...props} />;
    case 'Strong Sell': return <TrendingDown {...props} />;
    default: return <HelpCircle {...props} />;
  }
}

export function RatingBadge({ rating, score, size = 'md', showIcon = true }: RatingBadgeProps) {
  const label = ratingToLabel(rating, score);
  const colorClass = ratingColor(label);

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-2.5 py-1.5 gap-2',
  };

  const iconSize = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-semibold tracking-wide',
        sizeClasses[size],
        colorClass
      )}
    >
      {showIcon && <RatingIcon label={label} size={iconSize[size]} />}
      {label}
    </span>
  );
}
