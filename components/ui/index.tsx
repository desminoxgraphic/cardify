'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ───────────── Buttons ───────────── */

export type ButtonVariant = 'brand' | 'gold' | 'dark' | 'light' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'lg' | 'md' | 'sm';

const VARIANTS: Record<ButtonVariant, string> = {
  brand: 'bv-btn3d text-white hover:brightness-110',
  gold: 'bv-btn3d bg-gold text-ink-950 hover:brightness-105 [--bv-edge:#9A6A0E] [--bv-glow:rgba(245,197,66,0.55)]',
  dark: 'bv-btn3d text-white bg-[linear-gradient(180deg,#2A2A30_-30%,#0B0B0C_100%)] hover:brightness-125 [--bv-edge:#000] [--bv-glow:rgba(0,0,0,0.55)]',
  light: 'bv-btn3d bg-ivory-50 text-ink-950 hover:bg-white [--bv-edge:#C9C2B1] [--bv-glow:rgba(0,0,0,0.35)]',
  outline: 'bv-press bg-white text-ink-900 border border-ink-200 hover:bg-ink-100 shadow-lift',
  ghost: 'bv-press text-ink-500 hover:text-ink-900 hover:bg-ink-100',
  danger: 'bv-btn3d text-white bg-[linear-gradient(180deg,#F05252,#DC2626)] [--bv-edge:#991B1B] [--bv-glow:rgba(220,38,38,0.5)]',
  success: 'bv-btn3d text-white bg-[linear-gradient(180deg,#2BC66A,#15803D)] [--bv-edge:#14532D] [--bv-glow:rgba(22,163,74,0.55)]',
};

const SIZES: Record<ButtonSize, string> = {
  lg: 'min-h-[60px] px-6 text-[17px] rounded-button gap-2.5',
  md: 'min-h-[48px] px-5 text-[15px] rounded-2xl gap-2',
  sm: 'min-h-[40px] px-3.5 text-sm rounded-xl gap-1.5',
};

export function buttonClass(variant: ButtonVariant = 'dark', size: ButtonSize = 'md', full = false) {
  return cn(
    'inline-flex items-center justify-center font-bold select-none disabled:opacity-60 disabled:pointer-events-none',
    VARIANTS[variant],
    SIZES[size],
    full && 'w-full'
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'dark', size = 'md', full, loading, icon, trailingIcon, className, children, disabled, type = 'button', ...rest },
  ref
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={cn(buttonClass(variant, size, full), className)} {...rest}>
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});

export function IconButton({
  label,
  tone = 'glass',
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'glass' | 'light' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'bv-press w-11 h-11 rounded-full flex items-center justify-center shrink-0 disabled:opacity-35 disabled:pointer-events-none',
        tone === 'glass' ? 'bv-glass text-white hover:bg-white/20' : 'bg-white border border-ink-200 text-ink-900 hover:bg-ink-100 shadow-lift',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ───────────── Inputs ───────────── */

export function Field({
  id,
  label,
  icon,
  error,
  hint,
  required,
  className,
  inputClassName,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
  inputClassName?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[13px] font-bold text-ink-900 mb-1.5">
        {label} {required && <span className="text-danger-600">*</span>}
      </label>
      <div className="relative">
        {icon && <span className="absolute start-4 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">{icon}</span>}
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          dir="auto"
          {...input}
          className={cn(
            'w-full min-h-[52px] rounded-2xl border bg-white text-ink-950 text-base placeholder:text-ink-400 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent',
            icon ? 'ps-12 pe-4' : 'px-4',
            error ? 'border-danger-500 bg-danger-50' : 'border-ink-200',
            inputClassName
          )}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger-600 mt-1.5 font-semibold">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-500 mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

/* ───────────── Status & feedback ───────────── */

export function StatusPill({ status, children, className }: { status: 'active' | 'used' | 'neutral' | 'danger'; children: React.ReactNode; className?: string }) {
  const tone = {
    active: 'bg-success-50 text-success-700 border-success-500/30',
    used: 'bg-ink-100 text-ink-500 border-ink-200',
    neutral: 'bg-gold-50 text-gold-800 border-gold-300/60',
    danger: 'bg-danger-50 text-danger-700 border-danger-200',
  }[status];
  const dot = { active: 'bg-success-500', used: 'bg-ink-400', neutral: 'bg-gold-500', danger: 'bg-danger-500' }[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider whitespace-nowrap', tone, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-ink-200/60', className)} />;
}

export function StateMessage({
  icon,
  title,
  body,
  action,
  tone = 'light',
  className,
}: {
  icon: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <div className={cn('text-center px-6 py-10', className)}>
      <div
        className={cn(
          'mx-auto w-16 h-16 rounded-[20px] flex items-center justify-center',
          tone === 'light' ? 'bg-gradient-to-b from-ivory-50 to-ivory-200 text-ink-700 shadow-lift' : 'bv-glass text-white'
        )}
      >
        {icon}
      </div>
      <h3 className={cn('mt-4 text-lg font-extrabold', tone === 'light' ? 'text-ink-950' : 'text-white')}>{title}</h3>
      {body && <p className={cn('mt-1.5 text-sm', tone === 'light' ? 'text-ink-500' : 'text-white/70')}>{body}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex p-1 rounded-2xl bg-ink-100 border border-ink-200', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'min-h-[40px] px-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap',
            value === o.value ? 'bg-white text-ink-950 shadow-lift' : 'text-ink-500 hover:text-ink-900'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Bottom sheet on phones, centred dialog on larger screens. */
export function Dialog({
  open,
  onClose,
  labelledBy,
  children,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
  dismissible?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismissible && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, dismissible]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4 animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && dismissible && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="light-surface relative bg-ivory-50 rounded-t-sheet sm:rounded-sheet w-full max-w-md max-h-[92dvh] overflow-y-auto overscroll-contain p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl bv-sheet-up"
      >
        <div aria-hidden className="mx-auto -mt-2 mb-3 h-1.5 w-10 rounded-full bg-ink-200 sm:hidden" />
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 end-4 w-10 h-10 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center text-ink-900"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

/* ───────────── Brand ───────────── */

export function PoweredBy({ tone = 'light', className }: { tone?: 'light' | 'dark'; className?: string }) {
  return (
    <p className={cn('flex items-center justify-center gap-1.5 text-[11px] font-medium', tone === 'light' ? 'text-ink-400' : 'text-white/45', className)}>
      Powered by
      <Image src="/boostov-logo.png" alt="" width={14} height={14} />
      <span className={cn('font-bold', tone === 'light' ? 'text-ink-700' : 'text-white/85')}>
        boostov<span className="text-brand-blue">.ma</span>
      </span>
    </p>
  );
}

export function LogoTile({
  src,
  name,
  initials,
  size = 'md',
  accent = 'gold',
  className,
}: {
  src: string | null;
  name: string;
  initials: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  accent?: 'gold' | 'white';
  className?: string;
}) {
  const box = { sm: 'w-10 h-10 rounded-[12px] p-1', md: 'w-14 h-14 rounded-[16px] p-1.5', lg: 'w-20 h-20 rounded-[22px] p-2', xl: 'w-24 h-24 rounded-[26px] p-2' }[size];
  const text = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl', xl: 'text-3xl' }[size];
  return (
    <div
      className={cn(
        'relative bg-white overflow-hidden shrink-0 flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.25),0_18px_32px_-14px_rgba(0,0,0,0.7)]',
        accent === 'gold' ? 'ring-[3px] ring-gold-400' : 'ring-1 ring-white/40',
        box,
        className
      )}
    >
      {src ? (
        <Image src={src} alt={`${name} logo`} width={128} height={128} className="w-full h-full object-contain rounded-[inherit]" />
      ) : (
        <span className={cn('font-display font-extrabold text-ink-950', text)} dir="auto">{initials}</span>
      )}
    </div>
  );
}
