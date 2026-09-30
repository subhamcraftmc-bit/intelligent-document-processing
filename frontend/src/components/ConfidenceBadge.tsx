import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfidenceBadgeProps {
  score: number | null | undefined;
  isFlagged?: boolean;
  showIcon?: boolean;
  showTier?: boolean;
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  isFlagged = false,
  showIcon = true,
  showTier = false,
  showBar = false,
  size = 'md'
}) => {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
        N/A
      </span>
    );
  }

  const pct = Math.min(100, Math.max(0, Math.round(score * 100)));

  // Tier categorization
  let tierLabel = 'HIGH';
  let colorStyles = '';
  let barColor = 'bg-emerald-500';
  let IconComponent = ShieldCheck;
  let reasonText = 'High confidence entity extraction (>= 85%). Validated against layout schema.';

  if (score < 0.70) {
    tierLabel = 'NEEDS REVIEW';
    colorStyles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    barColor = 'bg-rose-500';
    IconComponent = AlertCircle;
    reasonText = 'Low confidence (< 70%). OCR text unclear or schema mismatch. Requires verification.';
  } else if (score < 0.85) {
    tierLabel = 'MEDIUM';
    colorStyles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    barColor = 'bg-amber-500';
    IconComponent = AlertTriangle;
    reasonText = 'Medium confidence (70-84%). Potential ambiguity in OCR bounding box.';
  } else {
    tierLabel = 'HIGH';
    colorStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    barColor = 'bg-emerald-500';
    IconComponent = ShieldCheck;
    reasonText = 'High confidence entity extraction (>= 85%). Multimodal vision verified.';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold'
  }[size];

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="inline-flex items-center gap-1.5">
        <span
          className={`inline-flex items-center font-mono font-medium rounded-full border transition-all ${sizeClasses} ${colorStyles}`}
          title={`${tierLabel}: ${pct}% — ${reasonText}`}
        >
          {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>{pct}%</span>
          {showTier && (
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 ml-0.5">
              {tierLabel}
            </span>
          )}
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

      {showBar && (
        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
};
