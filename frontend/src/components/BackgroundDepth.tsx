import React from 'react';
import { useSettings } from '../context/SettingsContext';

/**
 * Phase 8: Background Depth
 * Multi-layer ambient light blobs and gradient surfaces with ultra-slow motion.
 * Respects performance modes and automatically ceases animation when reduced.
 */
export const BackgroundDepth: React.FC = () => {
  const { settings } = useSettings();
  const shouldAnimate = settings.animationLevel === 'full';

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Top Left Flora Cyan Ambient Glow */}
      <div
        className={`absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-[140px] opacity-20 bg-gradient-to-br from-emerald-500/30 via-cyan-500/20 to-transparent ${
          shouldAnimate ? 'ambient-blob-1' : ''
        }`}
      />

      {/* Top Right Flora Violet Ambient Glow */}
      <div
        className={`absolute top-10 -right-32 w-[600px] h-[600px] rounded-full blur-[160px] opacity-25 bg-gradient-to-bl from-indigo-600/30 via-purple-600/20 to-transparent ${
          shouldAnimate ? 'ambient-blob-2' : ''
        }`}
      />

      {/* Center Subtle Deep Depth Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full blur-[180px] opacity-15 bg-gradient-to-r from-blue-700/15 via-indigo-500/10 to-transparent"
      />

      {/* Micro Grid Overlay for high-tech IDP aesthetic */}
      <div
        className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"
      />
    </div>
  );
};
