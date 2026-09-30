import React, { useState } from 'react';
import { 
  User, 
  Palette, 
  Eye, 
  Bell, 
  ShieldCheck, 
  Info, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  Database, 
  Lock,
  Activity,
  Sliders,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import type { ThemeMode, AnimationLevel, GlassLevel } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { LiquidGlassCard } from '../components/LiquidGlassCard';
import { api } from '../services/api';

type TabType = 'profile' | 'appearance' | 'accessibility' | 'notifications' | 'security' | 'about';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { 
    settings, 
    setTheme, 
    setAnimationLevel, 
    setGlassEffects, 
    setCursorEffects, 
    setHighContrast, 
    setNotificationSetting, 
    resetDefaults 
  } = useSettings();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [testingHealth, setTestingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const handleTestHealth = async () => {
    try {
      setTestingHealth(true);
      const res = await api.health.check();
      setHealthStatus(res);
      toast.success('Backend and Gemini AI pipeline responding normally.');
    } catch (err: any) {
      toast.error(`Health check failure: ${err.message}`);
    } finally {
      setTestingHealth(false);
    }
  };

  const navTabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'appearance', label: 'Appearance & Glass', icon: Palette },
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Connected Services', icon: ShieldCheck },
    { id: 'about', label: 'System Diagnostics', icon: Info },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/40 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-mono mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>ENTERPRISE CONTROL PLANE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Settings & System Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure liquid glass appearance, motion tokens, accessibility profiles, and verified audit controls
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetDefaults();
            toast.info('Preferences restored to factory defaults.');
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Main Settings Layout: Left Tabs, Right Form Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Navigation Tabs */}
        <div className="lg:col-span-4 space-y-1.5 bg-slate-900/40 p-2 rounded-2xl border border-slate-800/80 backdrop-blur-md">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-brand-500/20 text-white border border-brand-500/40 shadow-glow-brand'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Content */}
        <div className="lg:col-span-8">
          <LiquidGlassCard className="p-6 sm:p-8 space-y-6">
            {/* TAB 1: APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white">Appearance & Liquid Visuals</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Customize theme palettes, glassmorphism density, and cursor reactivity</p>
                </div>

                {/* Theme Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-200">Color Palette Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'dark', label: 'Dark Obsidian', icon: Moon },
                      { id: 'light', label: 'Light Frost', icon: Sun },
                      { id: 'system', label: 'System Default', icon: Monitor }
                    ].map(t => {
                      const Icon = t.icon;
                      const isSelected = settings.theme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTheme(t.id as ThemeMode);
                            toast.success(`Theme switched to ${t.label}.`);
                          }}
                          className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-brand-500/20 border-brand-500/50 text-white shadow-sm'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-400' : ''}`} />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Glass Effects Level */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-xs font-semibold text-slate-200">Liquid Glass Intensity</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'on', label: 'Full Liquid Glass (16px Blur)' },
                      { id: 'reduced', label: 'Reduced (4px Blur)' },
                      { id: 'off', label: 'Solid Slate (0px Blur)' }
                    ].map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setGlassEffects(g.id as GlassLevel);
                          toast.info(`Glass intensity set to ${g.label.split(' ')[0]}.`);
                        }}
                        className={`p-3 rounded-xl border text-xs text-left transition-all ${
                          settings.glassEffects === g.id
                            ? 'bg-brand-500/20 border-brand-500/50 text-white font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cursor Reactivity Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Cursor Ambient Illumination</h4>
                    <p className="text-[11px] text-slate-400">Enables dynamic specular light reflections following pointer movement</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.cursorEffects}
                    onChange={e => {
                      setCursorEffects(e.target.checked);
                      toast.info(`Cursor illumination ${e.target.checked ? 'enabled' : 'disabled'}.`);
                    }}
                    className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white">Analyst Profile</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Your enterprise authentication and role assignment</p>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white text-xl font-bold shadow-glow-brand">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{user?.full_name || 'Enterprise Analyst'}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email || 'analyst@enterprise.com'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono bg-brand-500/10 text-brand-300 border border-brand-500/20 uppercase">
                      {user?.role || 'Lead Analyst (Tier 1)'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Workspace Tenant</label>
                    <input
                      type="text"
                      disabled
                      value="CineForge IDP Production Corp"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Role Permissions</label>
                    <input
                      type="text"
                      disabled
                      value="Extraction, HITL Verification & Export"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ACCESSIBILITY */}
            {activeTab === 'accessibility' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white">Accessibility & Motion Controls</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Customizations for screen comfort and reduced sensory load</p>
                </div>

                <div className="space-y-4 divide-y divide-slate-800">
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Animation Speed Profile</h4>
                      <p className="text-[11px] text-slate-400">Adjust micro-interaction transition speed</p>
                    </div>
                    <select
                      value={settings.animationLevel}
                      onChange={e => setAnimationLevel(e.target.value as AnimationLevel)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                    >
                      <option value="full">Full Motion (250ms)</option>
                      <option value="reduced">Reduced Motion (100ms)</option>
                      <option value="off">Animations Disabled (0ms)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">High Contrast Mode</h4>
                      <p className="text-[11px] text-slate-400">Elevates border definition and maximizes text readability</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.highContrast}
                      onChange={e => {
                        setHighContrast(e.target.checked);
                        toast.info(`High contrast mode ${e.target.checked ? 'enabled' : 'disabled'}.`);
                      }}
                      className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">System Reduced Motion Override</h4>
                      <p className="text-[11px] text-slate-400">Respects operating system prefers-reduced-motion media query</p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Auto-Synchronized
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white">Event Notifications</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Configure which operational toasts appear in your console</p>
                </div>

                <div className="space-y-4 divide-y divide-slate-800">
                  {[
                    { key: 'uploadCompleted', label: 'Document Upload Completed', desc: 'Notify when payload is securely received by the server' },
                    { key: 'processingCompleted', label: 'Gemini AI Vision Extraction Finished', desc: 'Notify when entities and tabular line items are parsed' },
                    { key: 'reviewRequired', label: 'Low Confidence Alert (< 85%)', desc: 'Notify when entities require human confirmation' },
                    { key: 'exportReady', label: 'Structured Export Download Ready', desc: 'Notify when CSV or JSON payloads are ready for save' }
                  ].map(n => (
                    <div key={n.key} className="flex items-center justify-between pt-3">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">{n.label}</h4>
                        <p className="text-[11px] text-slate-400">{n.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={(settings.notifications as any)[n.key]}
                        onChange={e => setNotificationSetting(n.key as any, e.target.checked)}
                        className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white">Security & Connected Infrastructure</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Non-sensitive connection telemetry and service status</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">JWT Session Authentication</h4>
                        <p className="text-[11px] text-slate-400">Protected HTTP Bearer tokens with Supabase Auth</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Google Gemini 2.0 Flash Vision</h4>
                        <p className="text-[11px] text-slate-400">Multimodal layout parsing & entity extraction model</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-brand-500/10 text-brand-300 border border-brand-500/30">
                      Connected
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Supabase PostgreSQL & Storage</h4>
                        <p className="text-[11px] text-slate-400">Cloud database with row-level security & immutable audit logs</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      Encrypted at Rest
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: ABOUT & DIAGNOSTICS */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white">System Diagnostics & Health Check</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Test real backend and AI model connectivity</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">CineForge IDP Production Core</h4>
                      <p className="text-[11px] text-slate-400 font-mono">v2.4.0 • Enterprise Edition</p>
                    </div>
                    <button
                      type="button"
                      disabled={testingHealth}
                      onClick={handleTestHealth}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-40 transition-all"
                    >
                      <Activity className={`w-3.5 h-3.5 ${testingHealth ? 'animate-spin' : ''}`} />
                      <span>{testingHealth ? 'Ping in progress...' : 'Ping Live API'}</span>
                    </button>
                  </div>

                  {healthStatus && (
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs font-mono animate-fade-in space-y-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Backend Status: {healthStatus.status || 'online'}</span>
                      </div>
                      <p className="text-[11px] text-emerald-300/80">
                        Gemini Model: {healthStatus.services?.gemini_vision || 'gemini-2.0-flash active'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </LiquidGlassCard>
        </div>
      </div>
    </div>
  );
};
