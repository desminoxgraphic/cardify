'use client';

import React, { useRef } from 'react';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  /** Border radius of the card face, used for the glare layer. */
  radius?: string;
  /** Gentle idle sway when the user is not touching the card. */
  idle?: boolean;
  /** Extra layers rendered in 3D space around the card (e.g. floating badges). */
  satellites?: React.ReactNode;
}

/**
 * Lightweight 3D tilt: pointer/touch position drives CSS variables (no re-renders),
 * transform-only so it stays smooth on low-end phones.
 */
export function Card3D({ children, className = '', radius = '22px', idle = true, satellites }: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null);

  const setTilt = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
    el.style.setProperty('--rx', `${(0.5 - y) * 16}deg`);
    el.style.setProperty('--ry', `${(x - 0.5) * 22}deg`);
    el.style.setProperty('--gx', `${x * 100}%`);
    el.style.setProperty('--gy', `${y * 100}%`);
    el.dataset.active = 'true';
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.dataset.active = 'false';
  };

  return (
    <div
      className={`relative [perspective:1100px] touch-pan-y ${className}`}
      onPointerMove={(e) => setTilt(e.clientX, e.clientY)}
      onPointerDown={(e) => setTilt(e.clientX, e.clientY)}
      onPointerLeave={reset}
      onPointerUp={reset}
      onPointerCancel={reset}
    >
      {/* Spotlight + ground shadow so the card separates from the brand stage */}
      <div aria-hidden className="absolute -inset-10 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.22),transparent)]" />
      <div aria-hidden className="absolute inset-x-[10%] -bottom-5 h-8 rounded-[50%] bg-black/45 blur-xl bv-shadow-breathe" />
      <div
        ref={ref}
        data-active="false"
        className="bv-3d-tilt relative [transform-style:preserve-3d]"
        style={{ transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))' }}
      >
        <div className={`relative [transform-style:preserve-3d] ${idle ? 'bv-sway' : ''}`}>
          {children}
          <div
            aria-hidden
            className="bv-glare pointer-events-none absolute inset-0"
            style={{
              borderRadius: radius,
              background: 'radial-gradient(circle at var(--gx, 30%) var(--gy, 0%), rgba(255,255,255,0.35), transparent 55%)',
            }}
          />
          {satellites}
        </div>
      </div>
    </div>
  );
}
