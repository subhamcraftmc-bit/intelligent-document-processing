import React, { useRef, useState } from 'react';
import { useSettings } from '../context/SettingsContext';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number; // max movement in px (default 3px)
  variant?: 'primary' | 'secondary' | 'glass';
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 3,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const { settings } = useSettings();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current || !settings.cursorEffects || settings.animationLevel === 'off') return;

    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    setOffset({
      x: deltaX * strength,
      y: deltaY * strength
    });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  const variantStyles = {
    primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand border border-brand-400/30',
    secondary: 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80',
    glass: 'bg-slate-900/60 hover:bg-slate-800/80 text-white backdrop-blur-md border border-slate-700/60 shadow-lg'
  }[variant];

  return (
    <button
      ref={btnRef}
      type={props.type || 'button'}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`btn-liquid-ripple inline-flex items-center justify-center font-semibold text-xs rounded-xl transition-all duration-200 select-none btn-interactive ${variantStyles} ${className}`}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        ...props.style
      }}
      {...props}
    >
      {children}
    </button>
  );
};
