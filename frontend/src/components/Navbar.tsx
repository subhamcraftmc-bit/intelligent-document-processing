import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  BarChart3, 
  LogOut, 
  Sparkles, 
  LayoutDashboard,
  CheckCircle2,
  Command,
  Keyboard,
  Settings as SettingsIcon,
  HelpCircle,
  Menu,
  X,
  Presentation,
  GitCompare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenCommandPalette?: () => void;
  onOpenShortcuts?: () => void;
  onStartTour?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenCommandPalette, 
  onOpenShortcuts,
  onStartTour
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Upload', path: '/upload', icon: Upload },
    { label: 'Review Center', path: '/review', icon: CheckCircle2, badge: 'HITL' },
    { label: 'Compare', path: '/compare', icon: GitCompare, badge: 'AI Diff' },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
    { label: 'Help', path: '/help', icon: HelpCircle },
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl liquid-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6 xl:gap-8">
            <Link to="/dashboard" className="flex items-center gap-3 group btn-interactive">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white shadow-glow-brand group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-indigo-100" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  CineForge <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">IDP</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block -mt-1">
                  Gemini 2.0 Multimodal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 btn-interactive ${
                      isActive
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-[0_0_16px_rgba(99,102,241,0.25)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono border ${
                        item.badge === 'AI Diff' 
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' 
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header: Pitch Mode, Tour, Search Palette Trigger, Shortcuts, User */}
          <div className="flex items-center gap-2.5">
            {/* Hackathon Pitch Mode Button */}
            <Link
              to="/presentation"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-500/60 text-xs font-semibold transition-colors btn-interactive"
              title="Open Hackathon Judge Presentation Deck"
            >
              <Presentation className="w-3.5 h-3.5 text-purple-400" />
              <span>Pitch Mode</span>
            </Link>

            {/* Guided Tour Trigger Button */}
            {onStartTour && (
              <button
                id="start-product-tour-btn"
                type="button"
                onClick={onStartTour}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-brand-300 hover:border-brand-500/40 text-xs font-medium transition-colors btn-interactive"
                title="Start Guided Product Tour"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Tour</span>
              </button>
            )}

            {/* Quick Command Palette Button */}
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-mono transition-colors btn-interactive"
                title="Open Command Palette (Ctrl+K)"
              >
                <Command className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-slate-300 hidden lg:inline">Actions</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Shortcuts Help Button */}
            {onOpenShortcuts && (
              <button
                type="button"
                onClick={onOpenShortcuts}
                className="hidden sm:flex items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Keyboard Shortcuts (?)"
                aria-label="Keyboard Shortcuts"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            )}

            {/* Live Model Badge */}
            <div className="hidden 2xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gemini 2.0 Vision Online</span>
            </div>

            {user && (
              <div className="flex items-center gap-2.5 sm:pl-3 sm:border-l sm:border-slate-800">
                <Link to="/settings" className="text-right hidden md:block group">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-brand-300 transition-colors leading-none">
                    {user.full_name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {user.role || 'Analyst'}
                  </p>
                </Link>

                <Link
                  to="/settings"
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs shadow-inner hover:border-brand-500 transition-colors"
                  title={user.email}
                >
                  {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors btn-interactive"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors btn-interactive"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-800/80 motion-dropdown-enter space-y-1">
            <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-lg bg-slate-900/60 text-[11px] font-mono text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gemini 2.0 Online</span>
              </span>
              <Link to="/presentation" onClick={handleNavClick} className="text-purple-300 hover:underline">
                Pitch Mode →
              </Link>
            </div>

            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {onStartTour && (
              <button
                type="button"
                onClick={() => {
                  handleNavClick();
                  onStartTour();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/80 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Interactive Product Tour</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
