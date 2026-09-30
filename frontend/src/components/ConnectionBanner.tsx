import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const ConnectionBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== 'undefined' ? navigator.onLine : true);
  const [showRestored, setShowRestored] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) {
    return null;
  }

  if (!isOnline) {
    return (
      <div 
        role="alert" 
        className="sticky top-16 z-50 bg-rose-950/90 border-b border-rose-500/40 text-rose-200 px-4 py-2 text-xs flex items-center justify-between backdrop-blur-md animate-fade-in"
      >
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
            <span className="font-semibold">Connection lost.</span>
            <span className="hidden sm:inline text-rose-300/80">
              You are offline. Cached records remain viewable, but extraction requires internet.
            </span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Check Network</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      role="status" 
      className="sticky top-16 z-50 bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-200 px-4 py-2 text-xs backdrop-blur-md animate-fade-in"
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto">
        <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-semibold">Connection restored.</span>
        <span className="text-emerald-300/80">Backend and Gemini AI pipeline reconnected.</span>
      </div>
    </div>
  );
};
