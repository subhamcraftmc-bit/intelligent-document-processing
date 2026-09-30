import React, { useEffect, useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';

export const CursorLight: React.FC = () => {
  const { settings } = useSettings();
  const [enabled, setEnabled] = useState(false);
  const lightRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -200, y: -200, targetX: -200, targetY: -200 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Only enable if desktop pointer, not touch, and settings allow
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReducedMotion || !settings.cursorEffects || settings.animationLevel === 'off') {
      setEnabled(false);
      return;
    }

    setEnabled(true);

    const handleMouseMove = (e: MouseEvent) => {
      posRef.current.targetX = e.clientX;
      posRef.current.targetY = e.clientY;

      // Update global CSS variables for specular reflection on nearby glass cards
      const target = e.target as HTMLElement | null;
      if (target && target.closest) {
        const card = target.closest('.liquid-glass-interactive') as HTMLElement | null;
        if (card) {
          const rect = card.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty('--mouse-x', `${x}%`);
          card.style.setProperty('--mouse-y', `${y}%`);
        }
      }
    };

    const updatePosition = () => {
      // Smooth interpolation for subtle liquid inertia
      posRef.current.x += (posRef.current.targetX - posRef.current.x) * 0.15;
      posRef.current.y += (posRef.current.targetY - posRef.current.y) * 0.15;

      if (lightRef.current) {
        lightRef.current.style.transform = `translate3d(${posRef.current.x - 150}px, ${posRef.current.y - 150}px, 0)`;
      }

      animFrameRef.current = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animFrameRef.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [settings.cursorEffects, settings.animationLevel]);

  if (!enabled) return null;

  return (
    <div
      ref={lightRef}
      className="pointer-events-none fixed top-0 left-0 z-30 w-[300px] h-[300px] rounded-full opacity-35 transition-opacity duration-500"
      style={{
        background: 'radial-gradient(circle 120px at center, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.05), transparent 70%)',
        willChange: 'transform'
      }}
      aria-hidden="true"
    />
  );
};
