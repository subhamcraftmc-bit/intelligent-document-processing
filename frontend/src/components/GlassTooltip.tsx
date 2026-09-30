import React, { useState, useRef } from 'react';

interface GlassTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const GlassTooltip: React.FC<GlassTooltipProps> = ({
  content,
  children,
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsExiting(false);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsExiting(true);
    timerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
    }, 120);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }[position];

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute ${positionClasses} z-50 pointer-events-none whitespace-nowrap rounded-xl bg-slate-900/95 border border-slate-700/80 px-3 py-1.5 text-[11px] font-medium text-slate-200 shadow-xl backdrop-blur-xl liquid-glass ${
            isExiting ? 'motion-tooltip-exit' : 'motion-tooltip-enter'
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
