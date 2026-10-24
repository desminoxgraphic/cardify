'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton, PoweredBy } from '@/components/ui';
import { withAlpha } from '@/lib/brand-theme';
import { Confetti, GiftBox } from './objects';

export type BrandTheme = { glow: string; deep: string; dark: string; light: string; neutral: boolean };

/** Lacquer backdrop lit by the merchant colour (gold light for neutral brands). Fixed, behind everything. */
export function Stage({ theme }: { theme?: BrandTheme }) {
  const glow = theme?.glow ?? '#F5C542';
  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden bg-ink-950">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(90% 55% at 50% -5%, ${withAlpha(glow, theme?.neutral === false ? 0.42 : 0.24)}, transparent 62%), radial-gradient(70% 40% at 100% 70%, ${withAlpha(glow, 0.1)}, transparent 70%), linear-gradient(180deg, #141416 0%, #0A0A0B 70%)`,
        }}
      />
      <div className="absolute inset-0 bv-grain" />
    </div>
  );
}

const STEP_NAMES = ['Thank you', 'Review', 'Share', 'Details', 'Reward'];

export function StepNav({
  step,
  canBack,
  canForward,
  onBack,
  onForward,
  forwardHint,
}: {
  step: number;
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
  forwardHint?: string;
}) {
  return (
    <header className="sticky top-0 z-30 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2">
      <nav className="flex items-center gap-2" aria-label="Steps">
        <IconButton label={step > 1 ? `Back to ${STEP_NAMES[step - 2]}` : 'Back'} onClick={onBack} disabled={!canBack}>
          <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
        </IconButton>
        <div
          className="bv-glass flex-1 h-11 rounded-full flex items-center gap-1.5 px-4 min-w-0"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={step}
          aria-label={`Step ${step} of 5: ${STEP_NAMES[step - 1]}`}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="relative h-1.5 rounded-full overflow-hidden bg-white/20 transition-[flex-grow] duration-500 ease-out"
              style={{ flexGrow: i === step ? 2.6 : 1, flexBasis: 0 }}
            >
              <span
                className="absolute inset-0 bg-gold origin-left transition-transform duration-500 ease-out rtl:origin-right"
                style={{ transform: `scaleX(${i <= step ? 1 : 0})` }}
              />
            </span>
          ))}
          <span className="ms-2 text-xs font-bold text-white/85 tabular-nums">{step}/5</span>
        </div>
        <IconButton label={step < 5 ? `Forward to ${STEP_NAMES[step]}` : 'Forward'} onClick={onForward} disabled={!canForward} title={forwardHint}>
          <ChevronRight className="w-5 h-5 rtl:rotate-180" />
        </IconButton>
      </nav>
    </header>
  );
}

/** Ivory action sheet; the footer (primary actions) sticks to the bottom of the screen above the keyboard. */
export function ActionSheet({ children, footer }: { children?: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="light-surface relative z-20 bg-ivory-100 text-ink-950 rounded-t-sheet md:rounded-sheet md:mb-6 shadow-sheet bv-sheet-up">
      {children ? <div className="px-5 pt-5 pb-3 short:pt-4">{children}</div> : <div className="pt-3" />}
      {footer && (
        <div className="sticky bottom-0 z-10 px-5 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] bg-ivory-100/95 backdrop-blur-sm rounded-b-[inherit]">
          {footer}
          <PoweredBy className="mt-3" />
        </div>
      )}
    </div>
  );
}

/** Merchant banner shown whole at its own shape (never cropped, never covered), capped in height and centred. */
export function BannerFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex justify-center">
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={600}
        priority
        sizes="(max-width: 440px) 100vw, 440px"
        className="w-auto h-auto max-w-full max-h-[clamp(140px,30svh,250px)] short:max-h-[clamp(110px,22svh,150px)] rounded-[20px] ring-1 ring-white/15 shadow-float"
      />
    </div>
  );
}

/** Step 4: the reward ticket slides up out of a sleeve. The sleeve sits below the card and never covers its text. */
export function TicketSleeve({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative pb-[9%]">
      <div className="relative z-10 bv-sleeve-out">{children}</div>
      <div
        aria-hidden
        className="absolute inset-x-[-2%] bottom-0 z-20 h-[13%] rounded-[14px] bg-[linear-gradient(180deg,#26262B,#0E0E10)] shadow-[0_-1px_0_rgba(255,255,255,0.12)_inset,0_18px_30px_-12px_rgba(0,0,0,0.8)] flex items-center justify-center"
      >
        <span className="text-[10px] font-bold tracking-[0.3em] text-gold-300/80 uppercase truncate px-4">{label}</span>
      </div>
    </div>
  );
}

/**
 * The unwrap moment after a card is created: gift shakes, lid pops, light rays, card rises out.
 * Children = the real card, revealed at the end.
 */
export function UnwrapReveal({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* gift + rays, gone after ~1.3s */}
      <div aria-hidden className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <div className="relative w-[52%] animate-[bv-fade_300ms_1250ms_reverse_both]">
          <div className="absolute left-1/2 top-[30%] -translate-x-1/2 w-[190%] aspect-square bv-rays" style={{ animationDelay: '650ms' }}>
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {Array.from({ length: 12 }).map((_, i) => (
                <path key={i} d="M100 100 L96 0 L104 0 Z" fill="#FFE7A0" opacity="0.5" transform={`rotate(${i * 30} 100 100)`} />
              ))}
            </svg>
          </div>
          <GiftBox className="relative w-full h-auto" shaking opening />
        </div>
      </div>
      <div className="relative z-10 bv-card-rise" style={{ animationDelay: '900ms' }}>
        {children}
      </div>
      <Confetti count={28} distance={180} delay="1500ms" />
    </div>
  );
}
