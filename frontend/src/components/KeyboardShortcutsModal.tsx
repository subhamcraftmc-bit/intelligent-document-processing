import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘ / Ctrl + K', desc: 'Open Command Palette from anywhere' },
    { key: '/', desc: 'Focus global document search bar' },
    { key: 'U', desc: 'Jump to Document Upload' },
    { key: 'R', desc: 'Jump to Review Center' },
    { key: 'D', desc: 'Return to Console Dashboard' },
    { key: 'A', desc: 'Open Document Analytics' },
    { key: '?', desc: 'Show this keyboard shortcuts guide' },
    { key: 'Esc', desc: 'Close any active modal or palette' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 id="shortcuts-title" className="text-base font-bold text-white">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-slate-400">Power user navigation controls</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map(s => (
            <div 
              key={s.key} 
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
            >
              <span className="text-slate-300 font-medium">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-brand-300 shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-glow-brand"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
