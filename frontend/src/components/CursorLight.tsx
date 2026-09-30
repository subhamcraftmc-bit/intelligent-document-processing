import React, { useEffect, useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';

/**
 * Watery Cursor Interaction Engine (Phase 4 & Phase 6)
 * Emits soft liquid light moving over glass surfaces with inertia.
 * Dynamically projects specular reflection coordinates onto glass cards.
 */
export const CursorLight: React.FC = () => {
  const { settings } = useSettings();
  const [enabled, setEnabled] = useState(false);
  const [isInsideWindow, setIsInsideWindow] = useState(true);
  const lightRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -300, y: -300, targetX: -300, targetY: -300 });
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
      setIsInsideWindow(true);

      // Project specular light coordinates to nearest interactive glass card or button
      const target = e.target as HTMLElement | null;
      if (target && target.closest) {
        const card = target.closest('.liquid-glass-interactive, .btn-liquid-ripple') as HTMLElement | null;
        if (card) {
          const rect = card.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty('--mouse-x', `${x}%`);
          card.style.setProperty('--mouse-y', `${y}%`);
        }
      }
    };

    const handleMouseLeave = () => {
      setIsInsideWindow(false);
    };

    const handleMouseEnter = () => {
      setIsInsideWindow(true);
    };

    const updatePosition = () => {
      // Fluid interpolation for subtle liquid inertia
      posRef.current.x += (posRef.current.targetX - posRef.current.x) * 0.12;
      posRef.current.y += (posRef.current.targetY - posRef.current.y) * 0.12;

      if (lightRef.current) {
        lightRef.current.style.transform = `translate3d(${posRef.current.x - 175}px, ${posRef.current.y - 175}px, 0)`;
      }

      animFrameRef.current = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    animFrameRef.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [settings.cursorEffects, settings.animationLevel]);

  if (!enabled) return null;

  return (
    <div
      ref={lightRef}
      className={`pointer-events-none fixed top-0 left-0 z-30 w-[350px] h-[350px] rounded-full transition-opacity duration-300 ${
        isInsideWindow ? 'opacity-40' : 'opacity-0'
      }`}
      style={{
        background: 'radial-gradient(circle 140px at center, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.08), transparent 75%)',
        willChange: 'transform'
      }}
      aria-hidden="true"
    />
  );
};
