'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { RewardCard } from '@/components/RewardCard';
import { SaveCardButton } from '@/components/SaveCardButton';
import { PublicBusiness, Reward } from '@/lib/types';
import { getBrandTheme, withAlpha } from '@/lib/brand-theme';
import { formatDate } from '@/lib/utils';
import { RewardPreviewCard } from '@/components/RewardPreviewCard';
import { Card3D } from '@/components/Card3D';
import { Star3D } from '@/components/Star3D';
import { Symbol3D, type SymbolKind } from '@/components/Symbol3D';
import {
  Share2,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  PenLine,
  User,
  Phone,
  Store,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5;

export default function CustomerExperiencePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>(1);
  // Visual-only star picker on the review step; nothing is stored or sent.
  const [rating, setRating] = useState(0);
  const [ratingTick, setRatingTick] = useState(0);

  // Presentation-only: flip-reveal the card the first time it appears after creation.
  const [revealCard, setRevealCard] = useState(false);
  const prevStepRef = useRef<Step>(1);
  const revealDoneRef = useRef(false);
  useEffect(() => {
    if (prevStepRef.current === 4 && step === 5 && !revealDoneRef.current) {
      revealDoneRef.current = true;
      setRevealCard(true);
      const timer = window.setTimeout(() => setRevealCard(false), 2400);
      prevStepRef.current = step;
      return () => window.clearTimeout(timer);
    }
    prevStepRef.current = step;
  }, [step]);

  // Form State (Screen 4)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reward State (Screen 5)
  const [reward, setReward] = useState<Reward | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Share Fallback state
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  // Fetch Business details
  useEffect(() => {
    if (!slug) return;

    async function fetchBusiness() {
      try {
        setLoading(true);
        const res = await fetch(`/api/business/${slug}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error === 'Database not configured.' ? 'Database not configured.' : 'Business not available.');
          return;
        }
        if (!data.business || !data.business.is_active) {
          setError('Business not available.');
          return;
        }
        setBusiness(data.business);

        // Store only an opaque reference locally; reload authoritative reward data from Supabase.
        const queryRewardId = new URL(window.location.href).searchParams.get('reward');
        let savedRewardId = localStorage.getItem(`cardify:${slug}:rewardId`);
        const legacyReward = localStorage.getItem(`cardify:${slug}:reward`);
        if (!savedRewardId && legacyReward) {
          try { savedRewardId = JSON.parse(legacyReward).id || null; } catch {}
          localStorage.removeItem(`cardify:${slug}:reward`);
        }
        const rewardId = queryRewardId || savedRewardId;
        if (rewardId) {
          const rewardResponse = await fetch(`/api/rewards/${encodeURIComponent(rewardId)}?business_id=${encodeURIComponent(data.business.id)}`);
          const rewardData = await rewardResponse.json();
          if (rewardResponse.ok && rewardData.reward) {
            setReward(rewardData.reward);
            setStep(5);
            setLoading(false);
            return;
          }
          localStorage.removeItem(`cardify:${slug}:rewardId`);
        }

        const savedStep = localStorage.getItem(`cardify:${slug}:step`);
        if (savedStep) {
          const s = parseInt(savedStep, 10);
          if (s >= 1 && s <= 4) {
            setStep(s as Step);
          }
        }
      } catch (err) {
        console.error('Failed to load business:', err);
        setError('Unable to load this business right now.');
      } finally {
        setLoading(false);
      }
    }

    fetchBusiness();
  }, [slug]);

  // Persist current step
  const updateStep = (nextStep: Step) => {
    setStep(nextStep);
    if (slug && nextStep < 5) {
      localStorage.setItem(`cardify:${slug}:step`, nextStep.toString());
    }
  };

  // Screen 2: Google Review Click
  const handleGoogleReviewClick = () => {
    if (business?.google_review_url) {
      window.open(business.google_review_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Screen 3: Web Share API Click
  const handleShareClick = async () => {
    if (!business) return;
    const shareData = {
      title: business.name,
      text: business.share_message || `Check out ${business.name}!`,
      url: business.share_url || (typeof window !== 'undefined' ? window.location.href : ''),
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share dismissed:', err);
      }
    } else {
      // Fallback: Copy link
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        console.error('Copy link failed:', err);
      }
    }
  };

  // Screen 4: Submit Details & Create Card
  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors: { name?: string; phone?: string } = {};
    if (!customerName.trim()) {
      errors.name = 'Please enter your name.';
    }

    const cleanPhone = customerPhone.trim();
    if (!cleanPhone) {
      errors.phone = 'Please enter your phone number.';
    } else if (cleanPhone.replace(/\D/g, '').length < 6) {
      errors.phone = 'Please enter a valid phone number.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/rewards/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business!.id,
          customer_name: customerName.trim(),
          customer_phone: cleanPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.reward) {
        setSubmitError(data.error || "We couldn't create your card. Please try again.");
        setSubmitting(false);
        return;
      }

      setReward(data.reward);
      localStorage.setItem(`cardify:${slug}:rewardId`, data.reward.id);
      localStorage.removeItem(`cardify:${slug}:step`);
      const rewardUrl = new URL(window.location.href);
      rewardUrl.searchParams.set('reward', data.reward.id);
      window.history.replaceState({}, '', rewardUrl);
      setStep(5);
    } catch (err) {
      console.error('Failed to create reward:', err);
      setSubmitError("We couldn't create your card. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Business Initial Fallback helper
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };


  const theme = getBrandTheme(business?.primary_color);
  const stageStyle: React.CSSProperties = {
    background: `radial-gradient(120% 55% at 85% 0%, rgba(255,255,255,0.22), transparent 55%), radial-gradient(90% 50% at 0% 100%, rgba(0,0,0,0.35), transparent 60%), linear-gradient(170deg, ${theme.deep} 0%, ${theme.dark} 100%)`,
  };
  const neutralStageStyle: React.CSSProperties = {
    background: 'radial-gradient(120% 60% at 90% 0%, rgba(255,255,255,0.12), transparent 55%), linear-gradient(165deg, #1E293B 0%, #0B1120 100%)',
  };

  // Loading Screen
  if (loading) {
    return (
      <main className="relative min-h-svh flex flex-col text-white" aria-busy="true" aria-label="Loading store">
        <Stage style={neutralStageStyle} />
        <div className="relative mx-auto w-full max-w-[440px] flex-1 flex flex-col">
          <div className="px-4 pt-[max(12px,env(safe-area-inset-top))]"><div className="h-11 rounded-full bg-white/10 animate-pulse" /></div>
          <div className="flex-1 px-5 flex flex-col justify-center gap-4">
            <div className="h-44 rounded-[28px] bg-white/10 animate-pulse" />
            <div className="h-9 w-4/5 rounded-xl bg-white/15 animate-pulse" />
            <div className="h-4 w-1/2 rounded-full bg-white/10 animate-pulse" />
          </div>
          <Sheet
            footer={
              <div className="h-[60px] rounded-[20px] bg-slate-100 flex items-center justify-center gap-2 text-sm font-semibold text-[#64748B]">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading store...
              </div>
            }
          >
            <div className="grid grid-cols-3 gap-2.5">
              {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-[20px] bg-slate-100 animate-pulse" />)}
            </div>
          </Sheet>
        </div>
      </main>
    );
  }

  // Not Found / Disabled Screen
  if (error || !business) {
    return (
      <main className="relative min-h-svh flex flex-col text-white">
        <Stage style={neutralStageStyle} />
        <div className="relative mx-auto w-full max-w-[440px] flex-1 flex flex-col">
          <div className="flex-1 px-6 flex flex-col justify-center bv-hero-in">
            <div className="w-20 h-20 rounded-[26px] bv-glass flex items-center justify-center">
              <Store className="w-9 h-9 text-white/85" strokeWidth={1.5} />
            </div>
            <h1 className="mt-7 text-[34px] leading-[1.05] font-extrabold tracking-[-0.03em]">
              {error === 'Database not configured.' ? 'Configuration Required' : 'Business Not Available'}
            </h1>
            <p className="mt-3 text-base text-white/70 max-w-[320px]">
              {error === 'Database not configured.'
                ? 'boostov.ma needs its Supabase environment variables before this store can load.'
                : 'This store page is currently inactive or does not exist.'}
            </p>
          </div>
          <Sheet footer={<span />}>{null}</Sheet>
        </div>
      </main>
    );
  }

  const initials = getInitials(business.name);
  const stepNames = ['Thank you', 'Review', 'Share', 'Details', 'Reward'];
  // Back/forward are always shown. Step 5 is reachable only once a card exists.
  const canReach = (n: number) => n >= 1 && n <= 5 && (n < 5 || !!reward);
  const goTo = (n: number) => {
    if (canReach(n)) updateStep(n as Step);
  };

  const primaryButton =
    'bv-btn3d w-full min-h-[60px] text-white font-bold px-6 rounded-[20px] flex items-center justify-center gap-2.5 text-[17px] hover:brightness-110 disabled:opacity-70';
  const primaryStyle = {
    background: `linear-gradient(180deg, ${theme.light} -40%, ${theme.deep} 100%)`,
    '--bv-edge': theme.dark,
    '--bv-glow': withAlpha(theme.deep, 0.85),
  } as React.CSSProperties;
  const darkStyle = { background: 'linear-gradient(180deg, #1E293B -30%, #0B1020 100%)', '--bv-edge': '#000000' } as React.CSSProperties;
  const ghostButton =
    'bv-press w-full min-h-[48px] rounded-[16px] text-[15px] font-semibold text-[#475569] hover:bg-slate-50 hover:text-[#0F172A] flex items-center justify-center gap-1.5 transition-colors';

  const logoTile = (sizeClass: string, textClass: string, rounded = 'rounded-[24px]') => (
    <div className={`${sizeClass} ${rounded} relative bg-gradient-to-b from-white to-slate-200 p-1.5 shadow-[0_3px_0_rgba(0,0,0,0.25),0_22px_40px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_#fff] ring-4 ring-white/20 overflow-hidden shrink-0`}>
      {business.logo_url ? (
        <Image src={business.logo_url} alt={`${business.name} logo`} width={112} height={112} className="w-full h-full object-contain rounded-[inherit]" />
      ) : (
        <div className={`w-full h-full rounded-[inherit] flex items-center justify-center font-black text-white ${textClass}`} style={{ background: theme.deep }}>
          {initials}
        </div>
      )}
    </div>
  );

  const ratingWords = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  // Per-step decorative 3D symbols on the stage (hidden on short screens so they never crowd content)
  const stageSymbols: Record<Step, { kind: SymbolKind; className: string; delay?: string }[]> = {
    1: [],
    2: [
      { kind: 'star', className: 'top-[76px] -end-7 w-24 rotate-[14deg]' },
      { kind: 'sparkle', className: 'top-[150px] start-4 w-9', delay: '1.4s' },
    ],
    3: [
      { kind: 'heart', className: 'top-[78px] -end-5 w-20 rotate-[12deg]' },
      { kind: 'sparkle', className: 'top-[120px] start-5 w-8', delay: '0.8s' },
    ],
    4: [{ kind: 'sparkle', className: 'top-[80px] end-6 w-9', delay: '0.4s' }],
    5: [{ kind: 'sparkle', className: 'top-[80px] end-6 w-9', delay: '0.4s' }],
  };

  const cardHolderPreview = reward ? reward.customer_name : customerName;

  return (
    <main className="relative min-h-svh flex flex-col text-white overflow-x-clip">
      <Stage style={stageStyle} />
      {/* Step symbols */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden short:hidden">
        <div className="relative mx-auto max-w-[440px] h-full">
          {stageSymbols[step].map((symbol, i) => (
            <div key={`${step}-${i}`} className={`absolute ${symbol.className} bv-pop-in`} style={{ animationDelay: `${120 + i * 120}ms` }}>
              <div className="bv-float" style={{ animationDelay: symbol.delay }}>
                <Symbol3D kind={symbol.kind} className="w-full h-auto drop-shadow-[0_14px_18px_rgba(0,0,0,0.35)]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[440px] flex-1 flex flex-col">
        {/* TOP BAR: back · progress · forward (always visible) */}
        <header className="sticky top-0 z-30 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2">
          <nav className="flex items-center gap-2" aria-label="Steps">
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              disabled={!canReach(step - 1)}
              aria-label={step > 1 ? `Back to ${stepNames[step - 2]}` : 'Back'}
              className="bv-glass bv-press w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 hover:bg-white/25 disabled:opacity-35 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
            <div
              className="bv-glass flex-1 h-11 rounded-full flex items-center gap-1.5 px-4 min-w-0"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={5}
              aria-valuenow={step}
              aria-label={`Step ${step} of 5: ${stepNames[step - 1]}`}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ flexGrow: i === step ? 2.4 : 1, flexBasis: 0, backgroundColor: i <= step ? '#FFFFFF' : 'rgba(255,255,255,0.28)' }}
                />
              ))}
              <span className="ms-2 text-xs font-bold text-white/90 tabular-nums">{step}/5</span>
            </div>
            <button
              type="button"
              onClick={() => goTo(step + 1)}
              disabled={!canReach(step + 1)}
              aria-label={step < 5 ? `Forward to ${stepNames[step]}` : 'Forward'}
              title={step === 4 && !reward ? 'Create your card first' : undefined}
              className="bv-glass bv-press w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 hover:bg-white/25 disabled:opacity-35 disabled:pointer-events-none"
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-180" />
            </button>
          </nav>
        </header>

        {/* ───────── STEP 1: THANK YOU ───────── */}
        {step === 1 && (
          <>
            <section key="hero-1" className="flex-1 flex flex-col justify-center px-5 pt-2 pb-7 short:pb-5">
              <div className="relative bv-hero-in">
                {business.cover_image_url ? (
                  // Store photo shown whole and uncovered (no text on top) so it stays legible.
                  <div className="relative w-full h-[clamp(150px,30svh,250px)] short:h-[clamp(130px,24svh,170px)] rounded-[28px] overflow-hidden ring-1 ring-white/25 shadow-[0_28px_50px_-22px_rgba(0,0,0,0.75)] bg-black/20">
                    <Image src={business.cover_image_url} alt={`${business.name} storefront`} fill priority sizes="(max-width: 440px) 100vw, 440px" className="object-cover object-center" />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                ) : (
                  <div className="relative h-[clamp(150px,28svh,230px)] short:h-[clamp(120px,22svh,160px)] flex items-center justify-center">
                    <div aria-hidden className="absolute w-[70%] aspect-square rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.22),transparent)]" />
                    <div className="bv-float relative w-[clamp(110px,22svh,170px)] short:w-[clamp(96px,18svh,120px)]">
                      <Symbol3D kind="heart" className="w-full h-auto drop-shadow-[0_24px_30px_rgba(0,0,0,0.45)]" />
                    </div>
                    <div aria-hidden className="absolute top-[12%] end-[16%] w-9 bv-float" style={{ animationDelay: '0.9s' }}>
                      <Symbol3D kind="sparkle" className="w-full h-auto" />
                    </div>
                    <div aria-hidden className="absolute bottom-[14%] start-[18%] w-6 bv-float" style={{ animationDelay: '1.7s' }}>
                      <Symbol3D kind="sparkle" className="w-full h-auto" />
                    </div>
                  </div>
                )}
                <div className="absolute -bottom-9 start-4">{logoTile('w-[84px] h-[84px] short:w-[68px] short:h-[68px]', 'text-2xl')}</div>
                {business.cover_image_url && (
                  <div aria-hidden className="absolute -bottom-[58px] end-2 w-[52px] bv-float">
                    <Symbol3D kind="heart" className="w-full h-auto drop-shadow-[0_14px_18px_rgba(0,0,0,0.45)]" />
                  </div>
                )}
              </div>

              <div className="mt-12 short:mt-11 bv-hero-in" style={{ animationDelay: '80ms' }}>
                <p className="text-xs font-bold tracking-[0.22em] uppercase text-white/75">Thank you</p>
                <h1 className="mt-2 text-[clamp(30px,9.6vw,42px)] short:text-[clamp(26px,8vw,32px)] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance break-words">
                  Thanks for visiting {business.name} ❤️
                </h1>
                <p className="mt-2.5 text-base text-white/80">We appreciate your support.</p>
              </div>
            </section>

            <Sheet
              footer={
                <button onClick={() => goTo(2)} style={primaryStyle} className={primaryButton}>
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                </button>
              }
            >
              <ol className="grid grid-cols-3 gap-2.5" aria-label="What happens next">
                {[
                  { kind: 'star' as const, title: 'Review', text: 'on Google Maps' },
                  { kind: 'heart' as const, title: 'Share', text: 'with friends' },
                  { kind: 'ticket' as const, title: `${business.discount_percentage}% OFF`, text: 'next visit' },
                ].map((item, index) => (
                  <li
                    key={item.kind}
                    className={`bv-tile3d relative rounded-[20px] border p-3 short:p-2.5 ${
                      index === 2 ? 'text-white border-transparent' : 'bg-gradient-to-b from-white to-slate-100 border-slate-100'
                    }`}
                    style={index === 2 ? { background: `linear-gradient(150deg, ${theme.deep}, ${theme.dark})` } : undefined}
                  >
                    <span className={`absolute top-2 end-2.5 text-[10px] font-extrabold ${index === 2 ? 'text-white/60' : 'text-[#94A3B8]'}`}>0{index + 1}</span>
                    <div className="w-11 h-11 short:w-9 short:h-9 -ms-0.5">
                      <Symbol3D kind={item.kind} className="w-full h-auto" />
                    </div>
                    <p className={`mt-1.5 text-[14px] font-extrabold leading-tight ${index === 2 ? '' : 'text-[#0F172A]'}`}>{item.title}</p>
                    <p className={`text-[11px] leading-snug ${index === 2 ? 'text-white/70' : 'text-[#64748B]'}`}>{item.text}</p>
                  </li>
                ))}
              </ol>
            </Sheet>
          </>
        )}

        {/* ───────── STEP 2: GOOGLE REVIEW ───────── */}
        {step === 2 && (
          <>
            <section key="hero-2" className="flex-1 flex flex-col justify-center items-center text-center px-4 pt-2 pb-7 short:pb-4 bv-hero-in">
              <div className="bv-float">
                <div className="w-16 h-16 short:w-12 short:h-12 rounded-[22px] short:rounded-[16px] bg-gradient-to-b from-white to-slate-200 flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.22),0_22px_36px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_#fff]">
                  <Image src="/google-maps-logo.png" alt="Google Maps logo" width={40} height={40} className="w-[62%] h-auto" />
                </div>
              </div>
              <h1 className="mt-4 short:mt-3 text-[clamp(28px,8.6vw,36px)] short:text-[26px] leading-[1.05] font-extrabold tracking-[-0.03em]">
                How was your<br />experience?
              </h1>

              {/* HERO: big tap-to-rate stars (visual guide; the rating itself is chosen on Google) */}
              <div
                className="mt-5 short:mt-3 w-full bv-glass rounded-[30px] px-2 py-3 short:py-2 flex justify-between shadow-[0_24px_40px_-20px_rgba(0,0,0,0.6)]"
                role="radiogroup"
                aria-label="Your rating"
              >
                {[1, 2, 3, 4, 5].map((value) => {
                  const filled = value <= rating;
                  const isTapped = rating === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={isTapped}
                      aria-label={`${value} star${value > 1 ? 's' : ''}`}
                      onClick={() => {
                        setRating(value);
                        setRatingTick((t) => t + 1);
                        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(12);
                      }}
                      className="relative flex-1 aspect-square max-w-[72px] flex items-center justify-center rounded-2xl active:scale-90 transition-transform"
                    >
                      {isTapped && (
                        <span key={`fx-${ratingTick}`} aria-hidden className="absolute inset-0">
                          <span className="absolute inset-1 rounded-full border-2 border-amber-300 bv-burst" />
                          {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
                            <span
                              key={a}
                              className="bv-particle"
                              style={{ '--a': `${a}deg`, '--d': '-46px', width: 7, height: 7, margin: '-3.5px 0 0 -3.5px', background: i % 2 ? '#FDE68A' : '#FFFFFF' } as React.CSSProperties}
                            />
                          ))}
                        </span>
                      )}
                      <span
                        key={filled ? `on-${ratingTick}` : 'off'}
                        className={`block w-[88%] ${filled ? 'bv-pop' : ''}`}
                        style={filled ? { animationDelay: `${(value - 1) * 50}ms` } : undefined}
                      >
                        <Star3D filled={filled} className={`block w-full h-auto ${filled ? 'drop-shadow-[0_8px_14px_rgba(245,158,11,0.55)]' : ''}`} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 min-h-[50px] short:min-h-[44px]" aria-live="polite">
                {rating > 0 ? (
                  <>
                    <p key={`w-${ratingTick}`} className="text-[22px] short:text-lg font-extrabold leading-tight bv-pop-in">{ratingWords[rating - 1]}</p>
                    <p className="text-sm text-white/80">Choose {rating} star{rating > 1 ? 's' : ''} again on Google to post it.</p>
                  </>
                ) : (
                  <p className="text-[15px] text-white/80 pt-2">Tap a star to rate {business.name}.</p>
                )}
              </div>
            </section>

            <Sheet
              footer={
                <>
                  <button
                    key={rating > 0 ? `cta-${ratingTick}` : 'cta'}
                    onClick={handleGoogleReviewClick}
                    className={`${primaryButton} ${rating > 0 ? 'bv-glow-pulse' : ''}`}
                    style={darkStyle}
                  >
                    <span className="w-8 h-8 rounded-[10px] bg-white flex items-center justify-center shrink-0">
                      <Image src="/google-maps-logo.png" alt="" width={20} height={20} />
                    </span>
                    <span>Leave a Google Review</span>
                  </button>
                  <button onClick={() => goTo(3)} className={`${ghostButton} mt-1`}>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </>
              }
            >
              {/* 3-step guide: vertical on normal phones, compact row on short screens */}
              <ol className="relative space-y-3.5 short:hidden" aria-label="How to post your review">
                <span aria-hidden className="absolute start-5 top-5 bottom-5 w-px bg-slate-200" />
                {[
                  { title: 'Rate', text: 'Pick your stars', icon: <Star3D filled className="w-5 h-5" /> },
                  { title: 'Write', text: 'Add a few words about your visit', icon: <PenLine className="w-[18px] h-[18px] text-[#2563EB]" /> },
                  { title: 'Post on Google', text: 'Tap “Post” on Google Maps', icon: <Image src="/google-maps-logo.png" alt="" width={18} height={18} /> },
                ].map((item, index) => (
                  <li key={item.title} className="relative flex items-center gap-3.5">
                    <span className="bv-tile3d relative z-10 w-10 h-10 rounded-full bg-gradient-to-b from-white to-slate-100 border border-slate-200 flex items-center justify-center shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold leading-tight text-[#0F172A]">{index + 1}. {item.title}</p>
                      <p className="text-[13px] text-[#64748B]">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <ol className="hidden short:grid grid-cols-3 gap-2" aria-label="How to post your review">
                {[
                  { title: 'Rate', icon: <Star3D filled className="w-4 h-4" /> },
                  { title: 'Write', icon: <PenLine className="w-4 h-4 text-[#2563EB]" /> },
                  { title: 'Post', icon: <Image src="/google-maps-logo.png" alt="" width={16} height={16} /> },
                ].map((item, index) => (
                  <li key={item.title} className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-2 py-2 text-[13px] font-bold text-[#0F172A]">
                    {item.icon}
                    <span>{index + 1}. {item.title}</span>
                  </li>
                ))}
              </ol>
            </Sheet>
          </>
        )}

        {/* ───────── STEP 3: SHARE WITH 3 FRIENDS ───────── */}
        {step === 3 && (
          <>
            <section key="hero-3" className="flex-1 flex flex-col justify-center items-center text-center px-5 pt-2 pb-7 short:pb-4 bv-hero-in">
              {/* 3D composition: gift from the store travelling to three friends */}
              <div aria-hidden className="relative w-[min(80vw,310px)] h-[clamp(170px,30svh,240px)] short:h-[clamp(140px,26svh,170px)]">
                <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.22),transparent)]" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[44%] short:w-[38%]">
                  <div className="bv-float">
                    <Symbol3D kind="gift" className="w-full h-auto drop-shadow-[0_26px_30px_rgba(0,0,0,0.5)]" />
                  </div>
                  <div className="absolute -bottom-2 -end-5 short:-end-3">{logoTile('w-12 h-12 short:w-10 short:h-10', 'text-xs', 'rounded-[14px]')}</div>
                </div>
                {[
                  { pos: 'start-[2%] top-[6%]', size: 'w-14 h-14 short:w-11 short:h-11', delay: '0s' },
                  { pos: 'end-[0%] top-[30%]', size: 'w-12 h-12 short:w-10 short:h-10', delay: '0.7s' },
                  { pos: 'start-[8%] bottom-[2%]', size: 'w-11 h-11 short:w-9 short:h-9', delay: '1.4s' },
                ].map((friend, i) => (
                  <div key={i} className={`absolute ${friend.pos}`}>
                    <div className="bv-float" style={{ animationDelay: friend.delay }}>
                      <div className={`${friend.size} rounded-full bg-[radial-gradient(circle_at_35%_30%,#FFFFFF,#E2E8F0_60%,#94A3B8)] shadow-[0_4px_0_rgba(0,0,0,0.18),0_16px_24px_-10px_rgba(0,0,0,0.6)] flex items-center justify-center`}>
                        <User className="w-[46%] h-[46%]" style={{ color: theme.deep }} strokeWidth={2.4} />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="absolute end-[14%] top-[2%] w-9 short:w-7 bv-float" style={{ animationDelay: '1.1s' }}>
                  <Symbol3D kind="heart" className="w-full h-auto" />
                </div>
                <div className="absolute end-[10%] bottom-[6%] w-7 short:w-6 bv-float" style={{ animationDelay: '0.3s' }}>
                  <Symbol3D kind="heart" className="w-full h-auto" />
                </div>
              </div>
              <h1 className="mt-5 short:mt-3 text-[clamp(28px,8.6vw,36px)] short:text-[26px] leading-[1.05] font-extrabold tracking-[-0.03em]">Share with 3 friends</h1>
              <p className="mt-2 text-base short:text-[15px] text-white/80 max-w-[300px] break-words">Share {business.name} with friends who might like it.</p>
            </section>

            <Sheet
              footer={
                <>
                  <button onClick={handleShareClick} style={primaryStyle} className={primaryButton}>
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Link copied ✓</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-5 h-5" />
                        <span>{canNativeShare ? 'Share' : 'Copy Link'}</span>
                      </>
                    )}
                  </button>
                  <button onClick={() => goTo(4)} className={`${ghostButton} mt-1`}>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </>
              }
            >
              <div className="bv-tile3d flex items-center gap-3 rounded-[20px] bg-gradient-to-b from-white to-slate-100 border border-slate-100 p-3">
                <span className="w-12 h-12 shrink-0">
                  <Symbol3D kind="ticket" className="w-full h-auto" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#64748B]">Next</p>
                  <p className="text-[15px] font-extrabold leading-tight text-[#0F172A]">Your {business.discount_percentage}% OFF reward</p>
                </div>
              </div>
            </Sheet>
          </>
        )}

        {/* ───────── STEP 4: DETAILS (or summary once the card exists) ───────── */}
        {step === 4 && (
          <>
            <section key="hero-4" className="flex-1 flex flex-col justify-center px-5 pt-2 pb-8 short:pb-5">
              <div className="bv-hero-in">
                <p className="text-xs font-bold tracking-[0.22em] uppercase text-white/75">{reward ? 'Your card' : 'Unlocked'}</p>
                <h1 className="mt-1.5 text-[clamp(26px,8vw,32px)] short:text-[24px] leading-[1.08] font-extrabold tracking-[-0.03em]">
                  {reward ? 'Your card is already created' : 'Your reward is ready 🎁'}
                </h1>
              </div>
              <div className="mt-6 short:mt-4 mx-auto w-full max-w-[380px] short:max-w-[260px] bv-card-reveal">
                <Card3D
                  radius="3.6% / 5.8%"
                  satellites={
                    <div aria-hidden className="absolute -bottom-6 -end-2 w-12 short:w-10" style={{ transform: 'translateZ(70px)' }}>
                      <div className="bv-float"><Symbol3D kind="gift" className="w-full h-auto drop-shadow-[0_12px_16px_rgba(0,0,0,0.45)]" /></div>
                    </div>
                  }
                >
                  {reward ? (
                    <RewardCard business={business} reward={reward} />
                  ) : (
                    <RewardPreviewCard
                      businessName={business.name}
                      logoUrl={business.logo_url}
                      color={business.primary_color}
                      discount={business.discount_percentage}
                      holderName={cardHolderPreview}
                    />
                  )}
                </Card3D>
              </div>
            </section>

            {reward ? (
              <Sheet
                footer={
                  <button onClick={() => goTo(5)} style={primaryStyle} className={primaryButton}>
                    <span>View my card</span>
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </button>
                }
              >
                <dl className="rounded-[20px] bg-slate-50 border border-slate-100 divide-y divide-slate-200 text-[15px]">
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <dt className="text-[#64748B] shrink-0">Name</dt>
                    <dd className="font-bold text-[#0F172A] truncate">{reward.customer_name}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <dt className="text-[#64748B] shrink-0">Phone Number</dt>
                    <dd className="font-bold text-[#0F172A] truncate">{reward.customer_phone}</dd>
                  </div>
                </dl>
              </Sheet>
            ) : (
              <Sheet
                footer={
                  <button type="submit" form="reward-form" disabled={submitting} style={primaryStyle} className={primaryButton}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating Your Card...</span>
                      </>
                    ) : (
                      <>
                        <span>Create My Card</span>
                        <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                      </>
                    )}
                  </button>
                }
              >
                <p className="text-[15px] text-[#475569] mb-4">
                  Enter your details to create your personal discount card for {business.name}.
                </p>
                <form id="reward-form" onSubmit={handleCreateCard} className="space-y-3.5 pb-4" noValidate>
                  <Field
                    id="customer-name"
                    label="Name"
                    icon={<User className="w-5 h-5" />}
                    error={formErrors.name}
                    input={{
                      type: 'text',
                      placeholder: 'e.g. Mohamed',
                      value: customerName,
                      onChange: (e) => setCustomerName(e.target.value),
                      autoComplete: 'name',
                      enterKeyHint: 'next',
                    }}
                  />
                  <Field
                    id="customer-phone"
                    label="Phone Number"
                    icon={<Phone className="w-5 h-5" />}
                    error={formErrors.phone}
                    input={{
                      type: 'tel',
                      placeholder: 'e.g. +212 672 692 764',
                      value: customerPhone,
                      onChange: (e) => setCustomerPhone(e.target.value),
                      autoComplete: 'tel',
                      inputMode: 'tel',
                      enterKeyHint: 'done',
                    }}
                  />
                  {submitError && (
                    <div role="alert" className="p-3 bg-red-50 text-[#DC2626] border border-red-200 rounded-2xl text-sm font-semibold text-center">
                      {submitError}
                    </div>
                  )}
                </form>
              </Sheet>
            )}
          </>
        )}

        {/* ───────── STEP 5: REWARD CARD ───────── */}
        {step === 5 && reward && (
          <>
            <section key="hero-5" className="flex-1 flex flex-col justify-center px-5 pt-2 pb-8 short:pb-5">
              <div className="bv-hero-in" style={revealCard ? { animationDelay: '900ms' } : undefined}>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] bv-glass px-3 py-1.5 rounded-full">
                  {reward.status === 'USED' ? (
                    <>Used{reward.redeemed_at ? ` · ${formatDate(reward.redeemed_at)}` : ''}</>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[#4ADE80]" /> {revealCard ? 'Card created' : 'Active · one use'}
                    </>
                  )}
                </span>
                <h1 className="mt-3 text-[clamp(28px,8.6vw,34px)] short:text-[26px] leading-[1.05] font-extrabold tracking-[-0.03em]">
                  {reward.status === 'USED' ? 'This card has been used.' : 'Your reward is ready.'}
                </h1>
              </div>

              <div className="relative mt-6 short:mt-4 mx-auto w-full max-w-[400px] short:max-w-[280px]">
                {revealCard && (
                  <div aria-hidden className="absolute inset-0 pointer-events-none z-10">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <span
                        key={i}
                        className="bv-particle"
                        style={{
                          '--a': `${i * 22.5}deg`,
                          '--d': `${-110 - (i % 3) * 30}px`,
                          animationDelay: '1050ms',
                          background: ['#FDE68A', '#FFFFFF', '#F472B6', '#93C5FD'][i % 4],
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                )}
                <Card3D radius="3.6% / 5.8%">
                  {revealCard ? (
                    <div className="relative bv-flip">
                      <div className="bv-face">
                        <RewardCard business={business} reward={reward} cardRef={cardRef} />
                      </div>
                      <div className="bv-face bv-face-back absolute inset-0">
                        <CardBack name={business.name} logo={logoTile('w-[22%] aspect-square h-auto', 'text-xl', 'rounded-[22%]')} deep={theme.deep} dark={theme.dark} />
                      </div>
                    </div>
                  ) : (
                    <div className="bv-card-reveal">
                      <RewardCard business={business} reward={reward} cardRef={cardRef} />
                    </div>
                  )}
                </Card3D>
              </div>
            </section>

            <Sheet
              footer={
                <SaveCardButton business={business} reward={reward} buttonClassName={primaryButton} buttonStyle={primaryStyle} />
              }
            >
              <p className="text-[15px] text-[#475569] mb-3">
                {reward.status === 'USED'
                  ? `This card was redeemed${reward.redeemed_at ? ` on ${formatDate(reward.redeemed_at)}` : ''}. Each card can be used once.`
                  : `Save this card and show it on your next visit to ${business.name}.`}
              </p>
              <ol className="grid grid-cols-2 gap-2.5">
                <li className="bv-tile3d rounded-[18px] bg-gradient-to-b from-white to-slate-100 border border-slate-100 p-3 short:p-2.5">
                  <Download className="w-4 h-4" style={{ color: theme.deep }} />
                  <p className="text-[13px] font-semibold mt-1.5 leading-snug text-[#0F172A]">Save the card to your photos</p>
                </li>
                <li className="bv-tile3d rounded-[18px] bg-gradient-to-b from-white to-slate-100 border border-slate-100 p-3 short:p-2.5">
                  <Store className="w-4 h-4" style={{ color: theme.deep }} />
                  <p className="text-[13px] font-semibold mt-1.5 leading-snug text-[#0F172A]">Show it at the counter next time</p>
                </li>
              </ol>
              <p className="mt-2.5 text-xs text-[#64748B] font-medium text-center">You can also take a screenshot.</p>
            </Sheet>
          </>
        )}
      </div>
    </main>
  );
}

/** Full-bleed brand backdrop behind the customer flow. */
function Stage({ style }: { style?: React.CSSProperties }) {
  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden" style={style}>
      <div className="absolute -top-32 -end-24 w-[420px] h-[420px] rounded-full bg-white/[0.07] blur-3xl" />
      <div className="absolute inset-0 bv-grain" />
    </div>
  );
}

/** White action sheet; the footer (primary actions) sticks to the bottom of the screen. */
function Sheet({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="relative z-10 bg-white text-[#0F172A] rounded-t-[32px] md:rounded-[32px] md:mb-6 shadow-[0_-24px_48px_-24px_rgba(0,0,0,0.45)] bv-sheet-up">
      {children ? <div className="px-5 pt-5 pb-3 short:pt-4">{children}</div> : <div className="pt-2" />}
      {footer && (
        <div className="sticky bottom-0 z-10 px-5 pt-4 short:pt-3 pb-[max(14px,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-sm rounded-b-[inherit]">
          {footer}
          <PoweredBy />
        </div>
      )}
    </div>
  );
}

/** Back face shown before the reveal flip. */
function CardBack({ name, logo, deep, dark }: { name: string; logo: React.ReactNode; deep: string; dark: string }) {
  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center gap-[4%] text-white"
      style={{ borderRadius: '3.6% / 5.8%', background: `linear-gradient(140deg, ${deep}, ${dark} 70%, #050507)` }}
    >
      <svg aria-hidden className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 120 76" preserveAspectRatio="xMidYMid slice" fill="none" stroke="white" strokeWidth="0.3">
        {[8, 14, 20, 26, 32, 38, 44].map((r) => <circle key={r} cx="60" cy="38" r={r} />)}
      </svg>
      {logo}
      <p className="relative text-[clamp(13px,4vw,18px)] font-extrabold tracking-tight px-6 text-center truncate max-w-full">{name}</p>
      <p className="relative text-[10px] font-bold tracking-[0.3em] text-white/60">REWARD CARD</p>
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  error,
  input,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  input: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold mb-1.5 text-[#0F172A]">
        {label} <span className="text-[#DC2626]">*</span>
      </label>
      <div className="relative">
        <span className="absolute start-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">{icon}</span>
        <input
          id={id}
          aria-invalid={!!error}
          {...input}
          onFocus={(e) => {
            // Keep the field visible above the on-screen keyboard.
            const target = e.currentTarget;
            window.setTimeout(() => target.scrollIntoView({ block: 'end', behavior: 'smooth' }), 280);
          }}
          className={`scroll-mb-[172px] scroll-mt-[76px] w-full min-h-[56px] ps-12 pe-4 rounded-[18px] border bg-[#F8FAFC] text-[#0F172A] text-base placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all ${
            error ? 'border-[#DC2626] bg-red-50/40' : 'border-[#E2E8F0]'
          }`}
        />
      </div>
      {error && <p className="text-xs text-[#DC2626] mt-1.5 font-semibold">{error}</p>}
    </div>
  );
}

// boostov.ma appears ONLY as a subtle label on customer pages
function PoweredBy() {
  return (
    <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-[#94A3B8] font-medium">
      Powered by
      <Image src="/boostov-logo.png" alt="" width={14} height={14} />
      <span className="font-bold text-[#334155]">
        boostov<span className="text-[#2563EB]">.ma</span>
      </span>
    </p>
  );
}
