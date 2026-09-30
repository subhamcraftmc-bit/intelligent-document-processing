import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfidenceRingProps {
  score: number | null | undefined;
  size?: number; // size in px
  strokeWidth?: number;
  showLabel?: boolean;
}

export const ConfidenceRing: React.FC<ConfidenceRingProps> = ({
  score,
  size = 54,
  strokeWidth = 5,
  showLabel = true
}) => {
  if (score === null || score === undefined) {
    return (
      <div className="flex items-center gap-2">
        <div 
          className="rounded-full border border-slate-800 bg-slate-900/60 flex items-center justify-center font-mono text-slate-500 text-xs"
          style={{ width: size, height: size }}
        >
          N/A
        </div>
        {showLabel && <span className="text-xs text-slate-500 font-mono">Unscored</span>}
      </div>
    );
  }

  const pct = Math.min(100, Math.max(0, Math.round(score * 100)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  let bandLabel = 'HIGH CONFIDENCE';
  let bandDesc = 'Confidence >= 85%. Automated approval threshold met.';
  let strokeColor = '#10b981'; // emerald-500
  let textColor = 'text-emerald-400';
  let bgColor = 'bg-emerald-500/10 border-emerald-500/30';
  let Icon = ShieldCheck;

  if (score < 0.70) {
    bandLabel = 'NEEDS REVIEW';
    bandDesc = 'Confidence < 70%. Mandatory human verification required.';
    strokeColor = '#f43f5e'; // rose-500
    textColor = 'text-rose-400';
    bgColor = 'bg-rose-500/10 border-rose-500/30';
    Icon = AlertCircle;
  } else if (score < 0.85) {
    bandLabel = 'MEDIUM CONFIDENCE';
    bandDesc = 'Confidence 70% - 84%. Flagged for secondary human inspection.';
    strokeColor = '#f59e0b'; // amber-500
    textColor = 'text-amber-400';
    bgColor = 'bg-amber-500/10 border-amber-500/30';
    Icon = AlertTriangle;
  }

  return (
    <div className="flex items-center gap-3">
      {/* SVG Radial Meter */}
      <div 
        className="relative flex items-center justify-center shrink-0" 
        style={{ width: size, height: size }}
        title={`${bandLabel}: ${pct}% - ${bandDesc}`}
      >
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className={`absolute font-mono font-bold text-xs ${textColor}`}>
          {pct}%
        </span>
      </div>

      {showLabel && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${bgColor} ${textColor}`}>
              <Icon className="w-3 h-3" />
              <span>{bandLabel}</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate mt-0.5 max-w-[180px]" title={bandDesc}>
            {bandDesc}
          </p>
        </div>
      )}
    </div>
  );
};
