import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  ShieldCheck, 
  Sparkles,
  FileText,
  Activity,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import type { AnalyticsData } from '../types';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.analytics.get();
        setData(res);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Activity className="w-8 h-8 animate-spin text-brand-400" />
        <p className="text-xs text-slate-400">Loading document processing metrics...</p>
      </div>
    );
  }

  const { overview, distribution_by_class, recent_activity } = data;
  const totalDocs = overview.total_documents || 1;

  const classColors: Record<string, string> = {
    Invoice: 'bg-brand-500',
    Receipt: 'bg-emerald-500',
    Contract: 'bg-violet-500',
    Resume: 'bg-amber-500',
    IdentityProof: 'bg-cyan-500'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          IDP Intelligence & Extraction Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Real-time visibility into document throughput, Gemini multimodal confidence distribution, and human-in-the-loop audit rates.
        </p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-medium text-slate-400">Total Volume Ingested</p>
          <h3 className="text-3xl font-bold text-white mt-1">{overview.total_documents}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Across 5 supported schemas</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-medium text-slate-400">Average AI Confidence</p>
          <h3 className="text-3xl font-bold text-brand-400 mt-1">
            {Math.round(overview.average_confidence * 100)}%
          </h3>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Gemini 2.0 Multimodal Vision</span>
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-medium text-slate-400">Automation Straight-Through Rate</p>
          <h3 className="text-3xl font-bold text-emerald-400 mt-1">
            {overview.automation_rate}%
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Processed without manual corrections</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-medium text-slate-400">Pending Review Queue</p>
          <h3 className="text-3xl font-bold text-amber-400 mt-1">
            {overview.needs_review}
          </h3>
          <p className="text-[11px] text-amber-400/80 mt-1">Low confidence (&lt; 85%) flagged items</p>
        </div>
      </div>

      {/* Charts & Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Class Distribution Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-semibold text-white">Document Class Breakdown</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Live Taxonomy</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(distribution_by_class).map(([className, count]) => {
              const pct = Math.round((count / totalDocs) * 100);
              const colorClass = classColors[className] || 'bg-brand-500';
              return (
                <div key={className} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{className}</span>
                    <span className="font-mono text-slate-400">
                      {count} docs ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                      style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification & Quality Health Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Verification Funnel & Accuracy</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">HITL Metrics</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-mono">Verified Ratio</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">
                {overview.total_documents > 0
                  ? `${Math.round((overview.verified / overview.total_documents) * 100)}%`
                  : '100%'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Approved by enterprise analysts</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-mono">Flag Threshold</p>
              <p className="text-xl font-bold text-amber-400 mt-1">85.0%</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Auto-flags below 0.85 confidence</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-mono">Extraction Model</p>
              <p className="text-sm font-bold text-white mt-1">gemini-2.0-flash</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Native multimodal vision OCR</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-mono">Latency SLA</p>
              <p className="text-xl font-bold text-cyan-400 mt-1">&lt; 1.8s</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Fast sub-second extraction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Audit Log Timeline */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-white">Live Pipeline Audit Feed</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Immutable Compliance Trail</span>
        </div>

        {recent_activity.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No recent pipeline activity</p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {recent_activity.slice(0, 8).map(item => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-slate-200">
                      {item.action.replace('_', ' ')}
                    </span>
                    {item.details?.file_name && (
                      <span className="text-slate-400 ml-2 font-mono">
                        ({item.details.file_name})
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 font-mono shrink-0">
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
