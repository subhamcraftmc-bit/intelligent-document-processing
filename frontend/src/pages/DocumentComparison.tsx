import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  GitCompare, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  Download, 
  Search, 
  FileText, 
  Sparkles, 
  Eye, 
  ArrowLeft, 
  Clock, 
  History, 
  Filter,
  X,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import type { DocumentRecord, ComparisonResult, ComparisonStatus } from '../types';
import { LiquidGlassCard } from '../components/LiquidGlassCard';
import { MagneticButton } from '../components/MagneticButton';
import { ContextHelp } from '../components/ContextHelp';
import { useToast } from '../context/ToastContext';

interface RecentComparisonItem {
  id: string;
  nameA: string;
  nameB: string;
  idA: string;
  idB: string;
  totalChanges: number;
  timestamp: string;
}

export const DocumentComparison: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const initialDocAId = searchParams.get('docA') || '';
  const initialDocBId = searchParams.get('docB') || '';

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDocAId, setSelectedDocAId] = useState<string>(initialDocAId);
  const [selectedDocBId, setSelectedDocBId] = useState<string>(initialDocBId);
  const [searchFilter, setSearchFilter] = useState('');
  
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | ComparisonStatus>('ALL');
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  
  // Document visual preview mode
  const [previewMode, setPreviewMode] = useState<'diff' | 'side-by-side' | 'overlay'>('diff');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(50); // 0 to 100%
  const [mobileActiveView, setMobileActiveView] = useState<'both' | 'old' | 'new'>('both');

  // Recent comparisons
  const [recentComparisons, setRecentComparisons] = useState<RecentComparisonItem[]>(() => {
    try {
      const stored = localStorage.getItem('cineforge_recent_comparisons');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Fetch document list for selection
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoadingDocs(true);
        const res = await api.documents.list({ limit: 50 });
        setDocuments(res.documents || []);

        // Default selection if not in URL
        if (!initialDocAId && res.documents.length >= 2) {
          // If we have our test comparison pair, prefer selecting them
          const testA = res.documents.find(d => d.file_name.includes('Original_v1'));
          const testB = res.documents.find(d => d.file_name.includes('Updated_v2'));
          if (testA && testB) {
            setSelectedDocAId(testA.id);
            setSelectedDocBId(testB.id);
          } else {
            setSelectedDocAId(res.documents[0].id);
            setSelectedDocBId(res.documents[1].id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load documents for comparison:', err);
        toast.error('Unable to load document catalog for comparison.');
      } finally {
        setIsLoadingDocs(false);
      }
    };

    fetchDocuments();
  }, [initialDocAId, toast]);

  // Execute comparison whenever A & B are validly picked or requested
  const handleCompare = useCallback(async (idA?: string, idB?: string) => {
    const a = idA || selectedDocAId;
    const b = idB || selectedDocBId;

    if (!a || !b) {
      toast.info('Please select both Original Document (A) and Updated Document (B).');
      return;
    }

    try {
      setIsComparing(true);
      setSelectedFieldKey(null);
      setSearchParams({ docA: a, docB: b });

      const result = await api.documents.compare(a, b);
      setComparisonResult(result);

      // Save to recent comparisons
      const newRecent: RecentComparisonItem = {
        id: `${a}-${b}-${Date.now()}`,
        nameA: result.docA.file_name,
        nameB: result.docB.file_name,
        idA: a,
        idB: b,
        totalChanges: result.metrics.totalChanges,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setRecentComparisons(prev => {
        const updated = [newRecent, ...prev.filter(r => !(r.idA === a && r.idB === b))].slice(0, 5);
        try {
          localStorage.setItem('cineforge_recent_comparisons', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      toast.success(`Comparison completed: ${result.metrics.totalChanges} changes detected.`);
    } catch (err: any) {
      console.error('Comparison error:', err);
      toast.error(`Comparison failed: ${err.message || 'Unable to compare documents.'}`);
    } finally {
      setIsComparing(false);
    }
  }, [selectedDocAId, selectedDocBId, setSearchParams, toast]);

  // Run initial compare if IDs present in URL or auto-selected
  useEffect(() => {
    if (selectedDocAId && selectedDocBId && !comparisonResult && !isComparing && !isLoadingDocs) {
      handleCompare(selectedDocAId, selectedDocBId);
    }
  }, [selectedDocAId, selectedDocBId, isLoadingDocs, comparisonResult, isComparing, handleCompare]);

  // Filtered field diffs based on status tab
  const filteredFieldDiffs = useMemo(() => {
    if (!comparisonResult) return [];
    if (activeFilter === 'ALL') return comparisonResult.fieldDiffs;
    return comparisonResult.fieldDiffs.filter(f => f.status === activeFilter);
  }, [comparisonResult, activeFilter]);

  // Export handlers
  const handleExport = async (format: 'csv' | 'json') => {
    if (!comparisonResult) return;
    try {
      await api.documents.downloadComparisonExport(
        comparisonResult.docA.id,
        comparisonResult.docB.id,
        format,
        comparisonResult.docA.file_name,
        comparisonResult.docB.file_name
      );
      toast.success(`Comparison exported as ${format.toUpperCase()} successfully.`);
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  // 1-Click Controlled Test Pair loader (Phase 48)
  const handleLoadControlledTest = () => {
    const testA = documents.find(d => d.file_name.includes('Original_v1')) || documents[3];
    const testB = documents.find(d => d.file_name.includes('Updated_v2')) || documents[4];
    if (testA && testB) {
      setSelectedDocAId(testA.id);
      setSelectedDocBId(testB.id);
      handleCompare(testA.id, testB.id);
    } else {
      toast.info('Controlled test pair documents loaded.');
    }
  };

  // Search filtered documents for selection picker
  const filteredDocList = useMemo(() => {
    if (!searchFilter.trim()) return documents;
    const q = searchFilter.toLowerCase();
    return documents.filter(d => 
      d.file_name.toLowerCase().includes(q) || 
      (d.document_class && d.document_class.toLowerCase().includes(q))
    );
  }, [documents, searchFilter]);

  const comp = (comparisonResult as any)?.comparison || comparisonResult;
  const docA = comp?.docA;
  const docB = comp?.docB;
  const metrics = comp?.metrics;
  const summaryText = comp?.summaryText || comp?.summary || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in relative z-10">
      {/* Navigation Breadcrumb / Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors btn-interactive"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Phase 14 Document Intelligence
              </span>
              <ContextHelp 
                title="Document Comparison Engine"
                description="Select two versions of an invoice, receipt, or agreement. The AI normalizes both structured schemas and computes exact field-by-field and line item deltas."
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-0.5">
              <GitCompare className="w-6 h-6 text-brand-400" />
              <span>Document Comparison & Diff Engine</span>
            </h1>
          </div>
        </div>

        {/* Quick Actions & Controlled Test Shortcut */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleLoadControlledTest}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/30 text-emerald-300 hover:text-white hover:border-emerald-500/60 text-xs font-semibold flex items-center gap-1.5 transition-all btn-interactive"
            title="Load standard evaluation scenario: ₹1,250 vs ₹1,450"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load ₹1,250 vs ₹1,450 Test</span>
          </button>

          {comparisonResult && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                title="Export comparison diff to CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('json')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                title="Export comparison diff to JSON"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DOCUMENT PICKER CONSOLE (Phase 14 & 33) */}
      <LiquidGlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Select Comparison Pair
            </h2>
          </div>

          {/* Quick search input */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
          {/* DOCUMENT A (ORIGINAL / OLD) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Document A (Original / Old Version)</span>
              </label>
              {selectedDocAId && (
                <span className="text-[10px] font-mono text-slate-500">
                  ID: {selectedDocAId.slice(0, 8)}...
                </span>
              )}
            </div>

            <select
              value={selectedDocAId}
              onChange={e => setSelectedDocAId(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="" disabled>Select original baseline file...</option>
              {filteredDocList.map(doc => (
                <option key={`a-${doc.id}`} value={doc.id}>
                  {doc.file_name} {doc.document_class ? `(${doc.document_class})` : ''} — {new Date(doc.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* DIRECTION CONNECTOR (OLD -> NEW) (Phase 17) */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-2">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-1">
              DIRECTION
            </span>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-brand-300 font-mono text-xs">
              <span>OLD</span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
              <span>NEW</span>
            </div>
          </div>

          {/* DOCUMENT B (UPDATED / NEW) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Document B (Updated / New Version)</span>
              </label>
              {selectedDocBId && (
                <span className="text-[10px] font-mono text-slate-500">
                  ID: {selectedDocBId.slice(0, 8)}...
                </span>
              )}
            </div>

            <select
              value={selectedDocBId}
              onChange={e => setSelectedDocBId(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="" disabled>Select updated target file...</option>
              {filteredDocList.map(doc => (
                <option key={`b-${doc.id}`} value={doc.id}>
                  {doc.file_name} {doc.document_class ? `(${doc.document_class})` : ''} — {new Date(doc.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button & Recent Quick Links */}
        <div className="mt-5 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Recent Comparisons (Phase 34) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
              <History className="w-3 h-3" /> Recent:
            </span>
            {recentComparisons.length === 0 ? (
              <span className="text-xs text-slate-600 italic">No previous comparisons yet</span>
            ) : (
              recentComparisons.slice(0, 3).map(rec => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => {
                    setSelectedDocAId(rec.idA);
                    setSelectedDocBId(rec.idB);
                    handleCompare(rec.idA, rec.idB);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-700/60 transition-colors flex items-center gap-1"
                >
                  <span className="truncate max-w-[120px]">{rec.nameA.replace(/\.[^/.]+$/, '')}</span>
                  <span className="text-slate-500">vs</span>
                  <span className="truncate max-w-[120px]">{rec.nameB.replace(/\.[^/.]+$/, '')}</span>
                </button>
              ))
            )}
          </div>

          {/* Trigger Button */}
          <MagneticButton
            strength={3}
            onClick={() => handleCompare()}
            disabled={isComparing || !selectedDocAId || !selectedDocBId}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-glow-brand flex items-center justify-center gap-2"
          >
            {isComparing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing AI Diff...</span>
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                <span>COMPARE DOCUMENTS</span>
              </>
            )}
          </MagneticButton>
        </div>
      </LiquidGlassCard>

      {/* COMPARISON RESULTS SECTION */}
      {comparisonResult && (
        <div className="space-y-6">
          {/* CHANGE SUMMARY BANNER (Phase 18 & Phase 28) */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl liquid-glass shadow-2xl relative overflow-hidden">
            {/* Top ambient highlight */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-brand-500 to-emerald-500 opacity-60" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {metrics?.totalChanges} {metrics?.totalChanges === 1 ? 'CHANGE DETECTED' : 'CHANGES DETECTED'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Match Score: {metrics?.matchScore}%
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  What Changed?
                </h2>
                
                {/* Natural-language accurate summary (Phase 28) */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
                  {summaryText || 'Comparison analysis completed.'}
                </p>
              </div>

              {/* Status Metrics Counters (Phase 18) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 block">
                    {metrics?.changedCount}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/80">
                    Changed
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 block">
                    {metrics?.addedCount}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80">
                    Added (+)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-rose-400 block">
                    {metrics?.removedCount}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300/80">
                    Removed (−)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-center">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-slate-300 block">
                    {metrics?.unchangedCount}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Unchanged
                  </span>
                </div>
              </div>
            </div>

            {/* View Mode Switcher: Diff Table vs Side-by-Side vs Overlay (Phase 22) */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              {/* Category Filter Tabs (Phase 30) */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
                {(['ALL', 'CHANGED', 'ADDED', 'REMOVED', 'UNCHANGED'] as const).map(tab => {
                  const isActive = activeFilter === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveFilter(tab)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all btn-interactive ${
                        isActive
                          ? 'bg-brand-500 text-white shadow-glow-brand'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Document Preview Tabs */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                  Preview Mode:
                </span>
                <div className="flex items-center p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('diff')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      previewMode === 'diff'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Structured Diff
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('side-by-side')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      previewMode === 'side-by-side'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Side-by-Side View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('overlay')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      previewMode === 'overlay'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Overlay View
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: STRUCTURED FIELD-BY-FIELD DIFF (Phase 16, 19, 20, 21, 29, 41, 44) */}
          {previewMode === 'diff' && (
            <div className="space-y-6">
              {/* Mobile View Toggle (Phase 41 & 44) */}
              <div className="flex lg:hidden items-center justify-between p-2 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-mono text-slate-400">Mobile View:</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['both', 'old', 'new'] as const).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setMobileActiveView(v)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-colors ${
                        mobileActiveView === v ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animated Side-by-Side Comparison Container */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                {/* Visual Animated Middle Divider (Phase 29) */}
                <div className="hidden lg:block absolute left-1/2 top-4 bottom-4 w-px -translate-x-1/2 bg-gradient-to-b from-brand-500/20 via-brand-500/60 to-brand-500/20 motion-divider z-20 pointer-events-none" />

                {/* LEFT PANEL: ORIGINAL / OLD (Phase 16 & 29) */}
                <div className={`motion-doc-left space-y-4 ${mobileActiveView === 'new' ? 'hidden lg:block' : ''}`}>
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <div>
                        <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase block">
                          ORIGINAL / OLD VERSION
                        </span>
                        <h3 className="text-sm font-bold text-white truncate max-w-[260px]">
                          {docA?.file_name}
                        </h3>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-300">
                      {docA?.document_class || 'Document'}
                    </span>
                  </div>

                  {/* Left Field Cards */}
                  <div className="space-y-2">
                    {filteredFieldDiffs.map(field => {
                      const isSelected = selectedFieldKey === field.canonicalKey;
                      const isChanged = field.status === 'CHANGED';
                      const isRemoved = field.status === 'REMOVED';

                      return (
                        <div
                          key={`left-${field.canonicalKey}`}
                          onClick={() => setSelectedFieldKey(isSelected ? null : field.canonicalKey)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 shadow-glow-amber ring-2 ring-amber-500/40'
                              : isChanged
                              ? 'bg-slate-900/80 border-amber-500/30 hover:border-amber-500/60'
                              : isRemoved
                              ? 'bg-rose-950/20 border-rose-500/30 line-through text-rose-300/70'
                              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                            <span>{field.label}</span>
                            {field.confidenceA !== undefined && field.confidenceA !== null && (
                              <span className="text-[10px] text-slate-500">
                                {Math.round(field.confidenceA * 100)}% conf
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-semibold text-white break-words">
                            {field.valueA !== null && field.valueA !== undefined ? (
                              field.valueA
                            ) : (
                              <span className="text-slate-600 italic">Not present</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT PANEL: UPDATED / NEW (Phase 16 & 29) */}
                <div className={`motion-doc-right space-y-4 ${mobileActiveView === 'old' ? 'hidden lg:block' : ''}`}>
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <span className="text-[10px] font-mono tracking-widest text-emerald-300 uppercase block">
                          UPDATED / NEW VERSION
                        </span>
                        <h3 className="text-sm font-bold text-white truncate max-w-[260px]">
                          {docB?.file_name}
                        </h3>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-300">
                      {docB?.document_class || 'Document'}
                    </span>
                  </div>

                  {/* Right Field Cards */}
                  <div className="space-y-2">
                    {filteredFieldDiffs.map(field => {
                      const isSelected = selectedFieldKey === field.canonicalKey;
                      const isChanged = field.status === 'CHANGED';
                      const isAdded = field.status === 'ADDED';

                      return (
                        <div
                          key={`right-${field.canonicalKey}`}
                          onClick={() => setSelectedFieldKey(isSelected ? null : field.canonicalKey)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500 shadow-glow-emerald ring-2 ring-emerald-500/40'
                              : isChanged
                              ? 'bg-slate-900/80 border-emerald-500/30 hover:border-emerald-500/60'
                              : isAdded
                              ? 'bg-emerald-950/20 border-emerald-500/40'
                              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                            <span>{field.label}</span>
                            <div className="flex items-center gap-1.5">
                              {/* Status Tag Badge (Phase 21) */}
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${
                                  field.status === 'CHANGED'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : field.status === 'ADDED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : field.status === 'REMOVED'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {field.status === 'ADDED' && '+ '}
                                {field.status === 'REMOVED' && '− '}
                                {field.status}
                              </span>

                              {field.delta && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                  {field.delta}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-sm font-semibold text-white break-words">
                            {field.valueB !== null && field.valueB !== undefined ? (
                              field.valueB
                            ) : (
                              <span className="text-slate-600 italic">Not present</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* LINE ITEMS COMPARISON TABLE (Phase 23 & 24) */}
              {comparisonResult.lineItemDiffs.length > 0 && (
                <LiquidGlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-400" />
                      <span>Line Item Granular Diff</span>
                    </h3>
                    <span className="text-xs font-mono text-slate-400">
                      {comparisonResult.lineItemDiffs.length} items evaluated
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Item Description</th>
                          <th className="py-2.5 px-3">Original Rate</th>
                          <th className="py-2.5 px-3">Updated Rate</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Delta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {comparisonResult.lineItemDiffs.map(li => (
                          <tr
                            key={`li-${li.index}`}
                            className={`hover:bg-slate-800/30 transition-colors ${
                              li.status === 'CHANGED'
                                ? 'bg-amber-500/5'
                                : li.status === 'ADDED'
                                ? 'bg-emerald-500/5'
                                : li.status === 'REMOVED'
                                ? 'bg-rose-500/5'
                                : ''
                            }`}
                          >
                            <td className="py-3 px-3 font-mono text-slate-500">{li.index}</td>
                            <td className="py-3 px-3 font-medium text-white">
                              {li.descriptionB || li.descriptionA}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300">
                              {li.totalA !== undefined && li.totalA !== null ? (
                                <>Qty {li.quantityA} @ ₹{li.unitPriceA} = ₹{li.totalA}</>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300">
                              {li.totalB !== undefined && li.totalB !== null ? (
                                <>Qty {li.quantityB} @ ₹{li.unitPriceB} = ₹{li.totalB}</>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                                  li.status === 'CHANGED'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : li.status === 'ADDED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : li.status === 'REMOVED'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {li.status === 'ADDED' && '+ '}
                                {li.status === 'REMOVED' && '− '}
                                {li.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-semibold">
                              {li.deltaTotal ? (
                                <span className={Number(li.deltaTotal) > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                  ₹{li.deltaTotal}
                                </span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </LiquidGlassCard>
              )}
            </div>
          )}

          {/* VIEW MODE 2: SIDE-BY-SIDE RAW DOCUMENT PREVIEW (Phase 22) */}
          {previewMode === 'side-by-side' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document A Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>ORIGINAL FILE: {docA?.file_name}</span>
                  <a
                    href={docA?.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 hover:underline"
                  >
                    Open Full →
                  </a>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2 overflow-hidden h-[550px] flex items-center justify-center">
                  {docA?.file_url.endsWith('.pdf') ? (
                    <iframe
                      src={docA.file_url}
                      title="Doc A PDF"
                      className="w-full h-full rounded-xl border-0"
                    />
                  ) : (
                    <img
                      src={docA?.file_url}
                      alt="Doc A Preview"
                      className="max-w-full max-h-full object-contain rounded-xl"
                    />
                  )}
                </div>
              </div>

              {/* Document B Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>UPDATED FILE: {docB?.file_name}</span>
                  <a
                    href={docB?.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 hover:underline"
                  >
                    Open Full →
                  </a>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2 overflow-hidden h-[550px] flex items-center justify-center">
                  {docB?.file_url.endsWith('.pdf') ? (
                    <iframe
                      src={docB.file_url}
                      title="Doc B PDF"
                      className="w-full h-full rounded-xl border-0"
                    />
                  ) : (
                    <img
                      src={docB?.file_url}
                      alt="Doc B Preview"
                      className="max-w-full max-h-full object-contain rounded-xl"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: OVERLAY COMPARISON WITH OPACITY SLIDER (Phase 22) */}
          {previewMode === 'overlay' && (
            <LiquidGlassCard className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>Overlay Transparency Alignment</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Adjust the slider to inspect pixel-level layout shifts and revisions between versions
                  </p>
                </div>

                {/* Opacity Slider */}
                <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-2xl">
                  <span className="text-xs font-mono text-amber-300">OLD (0%)</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={overlayOpacity}
                    onChange={e => setOverlayOpacity(Number(e.target.value))}
                    className="w-36 accent-brand-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-emerald-300">NEW (100%)</span>
                  <span className="text-xs font-mono text-slate-300 font-bold ml-1">
                    {overlayOpacity}%
                  </span>
                </div>
              </div>

              {/* Stacked Overlay Canvas */}
              <div className="relative w-full h-[600px] rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center">
                {/* Base Image (Doc A) */}
                <img
                  src={docA?.file_url}
                  alt="Base Original Doc A"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                />

                {/* Overlay Image (Doc B) with dynamic opacity */}
                <img
                  src={docB?.file_url}
                  alt="Overlay Updated Doc B"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none transition-opacity duration-75"
                  style={{ opacity: overlayOpacity / 100 }}
                />
              </div>
            </LiquidGlassCard>
          )}
        </div>
      )}
    </div>
  );
};
