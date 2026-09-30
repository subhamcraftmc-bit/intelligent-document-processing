import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  LayoutDashboard, 
  Upload, 
  CheckCircle2, 
  BarChart3, 
  FileText, 
  Sparkles, 
  Keyboard, 
  X,
  ArrowRight,
  Settings as SettingsIcon,
  HelpCircle,
  Presentation,
  Moon,
  Info
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcuts: () => void;
  onStartTour?: () => void;
}

interface CommandAction {
  id: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  handler: () => void;
  badge?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  onOpenShortcuts,
  onStartTour
}) => {
  const navigate = useNavigate();
  const { settings, setTheme } = useSettings();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions: CommandAction[] = [
    {
      id: 'dashboard',
      label: 'Go to Dashboard Console',
      category: 'Navigation',
      icon: LayoutDashboard,
      handler: () => { navigate('/dashboard'); onClose(); }
    },
    {
      id: 'upload',
      label: 'Upload New Document(s)',
      category: 'Navigation',
      icon: Upload,
      handler: () => { navigate('/upload'); onClose(); }
    },
    {
      id: 'review',
      label: 'Open Review Center (Human-in-the-Loop)',
      category: 'Navigation',
      icon: CheckCircle2,
      badge: 'Flagged Queue',
      handler: () => { navigate('/review'); onClose(); }
    },
    {
      id: 'analytics',
      label: 'View IDP Analytics & Metrics',
      category: 'Navigation',
      icon: BarChart3,
      handler: () => { navigate('/analytics'); onClose(); }
    },
    {
      id: 'settings',
      label: 'Open Settings & Preferences',
      category: 'Navigation',
      icon: SettingsIcon,
      handler: () => { navigate('/settings'); onClose(); }
    },
    {
      id: 'help',
      label: 'Open Help Center & FAQ',
      category: 'Help',
      icon: HelpCircle,
      handler: () => { navigate('/help'); onClose(); }
    },
    {
      id: 'presentation',
      label: 'Launch Hackathon Pitch Mode',
      category: 'Presentation',
      icon: Presentation,
      badge: 'Judge Deck',
      handler: () => { navigate('/presentation'); onClose(); }
    },
    {
      id: 'tour',
      label: 'Start Interactive Product Tour',
      category: 'Quick Actions',
      icon: Sparkles,
      badge: 'Guided',
      handler: () => { 
        onClose(); 
        if (onStartTour) onStartTour(); 
      }
    },
    {
      id: 'theme',
      label: `Toggle Theme (Current: ${settings.theme})`,
      category: 'Appearance',
      icon: Moon,
      handler: () => {
        const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        toast.info(`Theme toggled to ${nextTheme}.`);
        onClose();
      }
    },
    {
      id: 'about',
      label: 'About CineForge Architecture & Tech Stack',
      category: 'Information',
      icon: Info,
      handler: () => { navigate('/about'); onClose(); }
    },
    {
      id: 'demo',
      label: 'Open Seeded Demo Document (Apex Invoice)',
      category: 'Quick Actions',
      icon: Sparkles,
      badge: 'Demo Mode',
      handler: () => { navigate('/documents/b1111111-1111-1111-1111-111111111111'); onClose(); }
    },
    {
      id: 'shortcuts',
      label: 'Show Keyboard Shortcuts Guide',
      category: 'Help',
      icon: Keyboard,
      badge: '?',
      handler: () => { onClose(); onOpenShortcuts(); }
    }
  ];

  const filtered = actions.filter(a => 
    a.label.toLowerCase().includes(query.toLowerCase()) || 
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].handler();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div 
        className="liquid-glass border border-brand-500/40 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search action..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-400">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands or actions found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.handler()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? 'bg-brand-500/20 text-white border border-brand-500/40 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-brand-500/20 text-brand-300' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-slate-100">{item.label}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">{item.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-brand-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>CineForge IDP Fast Navigation</span>
        </div>
      </div>
    </div>
  );
};
