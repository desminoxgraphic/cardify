'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Star3D } from '@/components/Star3D';
import { Confetti, Finger } from './objects';

const WORDS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

/**
 * Big golden stars. Until the customer touches them, a looping demo shows a finger tapping
 * the stars one by one. A real touch stops the demo for good. The rating is a visual guide
 * only (it is chosen again on Google) and is never stored.
 */
export function StarRating({
  value,
  onChange,
  businessName,
}: {
  value: number;
  onChange: (value: number) => void;
  businessName: string;
}) {
  const [demo, setDemo] = useState(true);
  const [demoValue, setDemoValue] = useState(0);
  const [tick, setTick] = useState(0);
  const timer = useRef<number | null>(null);

  // Demo loop: 0 → 1 → … → 5, hold, reset. Disabled for reduced motion.
  useEffect(() => {
    if (!demo) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDemo(false);
      return;
    }
    let step = 0;
    const run = () => {
      step = (step + 1) % 9; // 1..5 fill, 6..8 hold, 0 reset
      setDemoValue(step <= 5 ? step : 5);
      if (step === 0) setDemoValue(0);
      timer.current = window.setTimeout(run, step === 0 ? 700 : step >= 6 ? 500 : 520);
    };
    timer.current = window.setTimeout(run, 900);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [demo]);

  const stopDemo = () => {
    if (demo) {
      setDemo(false);
      setDemoValue(0);
    }
  };

  const shown = demo ? demoValue : value;
  const celebrating = !demo && value >= 4;

  return (
    <div className="w-full">
      <div
        className="relative w-full bv-plinth rounded-[30px] px-2 py-3.5 short:py-2.5"
        onPointerDown={stopDemo}
        role="radiogroup"
        aria-label={`Rate ${businessName}`}
      >
        <div className="relative flex justify-between">
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= shown;
            const justFilled = demo ? star === demoValue : star === value;
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={!demo && value === star}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                onClick={() => {
                  stopDemo();
                  onChange(star);
                  setTick((t) => t + 1);
                  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(star >= 4 ? [10, 30, 14] : 10);
                }}
                className="relative flex-1 aspect-square max-w-[76px] flex items-center justify-center rounded-2xl"
              >
                {filled && justFilled && (
                  <span key={`fx-${demo ? `d${demoValue}` : tick}`} aria-hidden className="absolute inset-0">
                    <span className="absolute inset-1 rounded-full border-2 border-gold-300 bv-burst" />
                    <Confetti count={8} distance={44} />
                  </span>
                )}
                <span
                  key={filled ? `on-${demo ? 'd' : tick}-${star}` : 'off'}
                  className={`block w-[90%] ${filled ? 'bv-pop' : ''}`}
                  style={filled && !demo ? { animationDelay: `${(star - 1) * 45}ms` } : undefined}
                >
                  <Star3D filled={filled} className={`block w-full h-auto ${filled ? 'drop-shadow-[0_10px_16px_rgba(245,158,11,0.55)]' : ''}`} />
                </span>
              </button>
            );
          })}

          {/* Demo finger */}
          {demo && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-[58%] w-11 transition-[left] duration-500 ease-out"
              style={{ left: `calc(${Math.max(demoValue, 1) * 20 - 10}% - 8px)` }}
            >
              <div key={demoValue} className={demoValue > 0 ? 'bv-tap' : ''}>
                <Finger className="w-full h-auto drop-shadow-[0_8px_10px_rgba(0,0,0,0.45)]" />
              </div>
            </div>
          )}
        </div>
        {celebrating && <Confetti key={`c-${tick}`} count={26} distance={170} />}
      </div>

      <div className="mt-3 min-h-[52px] text-center" aria-live="polite">
        {demo ? (
          <p className="text-[15px] text-white/80 pt-2">Tap a star to rate <bdi>{businessName}</bdi>.</p>
        ) : value > 0 ? (
          <>
            <p key={`w-${tick}`} className={`font-display italic font-extrabold text-[24px] leading-tight bv-pop-in ${value >= 4 ? 'text-gold' : 'text-white'}`}>
              {WORDS[value - 1]}{value >= 4 ? '!' : ''}
            </p>
            <p className="text-sm text-white/75">Choose {value} star{value > 1 ? 's' : ''} again on Google to post it.</p>
          </>
        ) : (
          <p className="text-[15px] text-white/80 pt-2">Tap a star to rate <bdi>{businessName}</bdi>.</p>
        )}
      </div>
    </div>
  );
}
