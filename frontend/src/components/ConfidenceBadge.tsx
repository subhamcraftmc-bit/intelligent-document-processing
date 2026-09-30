import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfidenceBadgeProps {
  score: number | null | undefined;
  isFlagged?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  isFlagged = false,
  showIcon = true,
  size = 'md'
}) => {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        N/A
      </span>
    );
  }

  const pct = Math.round(score * 100);

  // Green > 0.9, Yellow 0.7-0.9, Red < 0.7
  let colorStyles = '';
  let IconComponent = ShieldCheck;

  if (score >= 0.90) {
    colorStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    IconComponent = ShieldCheck;
  } else if (score >= 0.70) {
    colorStyles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    IconComponent = AlertTriangle;
  } else {
    colorStyles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    IconComponent = AlertCircle;
  }

  const sizeClasses = {
    sm: 'text-[11px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold'
  }[size];

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center font-mono font-medium rounded-full border transition-all ${sizeClasses} ${colorStyles}`}
        title={`AI Confidence Score: ${pct}%`}
      >
        {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
        <span>{pct}%</span>
      </span>

      {isFlagged && (
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
          title="Flagged for human verification (< 85% confidence)"
        >
          Review
        </span>
      )}
    </div>
  );
};
