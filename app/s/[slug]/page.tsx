'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { RewardCard } from '@/components/RewardCard';
import { SaveCardButton } from '@/components/SaveCardButton';
import { PublicBusiness, Reward } from '@/lib/types';
import { getBrandTheme, withAlpha } from '@/lib/brand-theme';
import { RewardPreviewCard } from '@/components/RewardPreviewCard';
import { Card3D } from '@/components/Card3D';
import { Star3D } from '@/components/Star3D';
import {
  Star,
  Share2,
  ArrowRight,
  ArrowLeft,
  Gift,
  Check,
  Loader2,
  PenLine,
  User,
  Phone,
  Store,
  Download,
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
    background: `radial-gradient(120% 60% at 90% 0%, rgba(255,255,255,0.20), transparent 55%), radial-gradient(90% 55% at 0% 100%, rgba(0,0,0,0.35), transparent 60%), linear-gradient(165deg, ${theme.deep} 0%, ${theme.dark} 100%)`,
  };
  const neutralStageStyle: React.CSSProperties = {
    background: 'radial-gradient(120% 60% at 90% 0%, rgba(255,255,255,0.12), transparent 55%), linear-gradient(165deg, #1E293B 0%, #0B1120 100%)',
  };

  // Loading Screen
  if (loading) {
    return (
      <main className="relative min-h-dvh flex flex-col text-white" aria-busy="true" aria-label="Loading store">
        <Stage style={neutralStageStyle} />
        <div className="relative mx-auto w-full max-w-[440px] flex-1 flex flex-col">
          <div className="px-5 pt-4"><div className="h-11 rounded-full bg-white/10 animate-pulse" /></div>
          <div className="flex-1 px-6 flex flex-col justify-center gap-4">
            <div className="w-24 h-24 rounded-[28px] bg-white/15 animate-pulse" />
            <div className="h-9 w-4/5 rounded-xl bg-white/15 animate-pulse" />
            <div className="h-4 w-1/2 rounded-full bg-white/10 animate-pulse" />
          </div>
          <Sheet>
            <div className="grid grid-cols-3 gap-2.5">
              {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-[20px] bg-slate-100 animate-pulse" />)}
            </div>
            <div className="mt-5 h-[60px] rounded-[20px] bg-slate-100 flex items-center justify-center gap-2 text-sm font-semibold text-[#64748B]">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading store...
            </div>
          </Sheet>
        </div>
      </main>
    );
  }

  // Not Found / Disabled Screen
  if (error || !business) {
    return (
      <main className="relative min-h-dvh flex flex-col text-white overflow-x-hidden">
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
          <Sheet>
            <PoweredBy />
          </Sheet>
        </div>
      </main>
    );
  }

  const canGoBack = step > 1 && step < 5;
  const initials = getInitials(business.name);

  const primaryButton =
    'bv-btn3d w-full min-h-[60px] text-white font-bold px-6 rounded-[20px] flex items-center justify-center gap-2.5 text-[17px] hover:brightness-110 disabled:opacity-70';
  const primaryStyle = {
    background: `linear-gradient(180deg, ${theme.light} -40%, ${theme.deep} 100%)`,
    '--bv-edge': theme.dark,
    '--bv-glow': withAlpha(theme.deep, 0.85),
  } as React.CSSProperties;
  const darkStyle = { background: 'linear-gradient(180deg, #1E293B -30%, #0B1020 100%)', '--bv-edge': '#000000' } as React.CSSProperties;
  const ghostButton =
    'bv-press w-full min-h-[52px] rounded-[18px] text-[15px] font-semibold text-[#475569] hover:bg-slate-50 hover:text-[#0F172A] flex items-center justify-center gap-1.5 transition-colors';

  const logoTile = (sizeClass: string, textClass: string, rounded = 'rounded-[28px]') => (
    <div className={`${sizeClass} ${rounded} relative bg-gradient-to-b from-white to-slate-200 p-1.5 shadow-[0_3px_0_rgba(0,0,0,0.25),0_22px_40px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_#fff] ring-4 ring-white/15 overflow-hidden shrink-0`}>
      {business.logo_url ? (
        <Image src={business.logo_url} alt={`${business.name} logo`} width={112} height={112} className="w-full h-full object-contain rounded-[inherit]" />
      ) : (
        <div className={`w-full h-full rounded-[inherit] flex items-center justify-center font-black text-white ${textClass}`} style={{ background: theme.deep }}>
          {initials}
        </div>
      )}
    </div>
  );

  const ratingHint = rating > 0
    ? `Choose ${rating} star${rating > 1 ? 's' : ''} again on Google to post it.`
    : `Tap the stars to rate ${business.name}.`;

  return (
    <main className="relative min-h-dvh flex flex-col text-white overflow-x-hidden">
      <Stage style={business.cover_image_url && step === 1 ? undefined : stageStyle} coverUrl={step === 1 ? business.cover_image_url : null} coverAlt={`${business.name} storefront`} overlayStyle={stageStyle} />

      <div className="relative mx-auto w-full max-w-[440px] flex-1 flex flex-col">
        {/* TOP BAR: back + segmented progress */}
        <header className="relative z-10 flex items-center gap-3 px-5 pt-[max(16px,env(safe-area-inset-top))]">
          {canGoBack && (
            <button
              type="button"
              onClick={() => updateStep((step - 1) as Step)}
              aria-label="Go back to the previous step"
              className="bv-glass bv-press w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 hover:bg-white/25"
            >
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
          )}
          <div
            className="bv-glass flex-1 h-11 rounded-full flex items-center gap-1.5 px-4"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={step}
            aria-label={`Step ${step} of 5`}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ flexGrow: i === step ? 2.2 : 1, flexBasis: 0, backgroundColor: i <= step ? '#FFFFFF' : 'rgba(255,255,255,0.28)' }}
              />
            ))}
            <span className="ms-2 text-xs font-bold text-white/90 tabular-nums">{step}/5</span>
          </div>
        </header>

        {/* STEP 1: THANK YOU */}
        {step === 1 && (
          <>
            <section key="hero-1" className="flex-1 flex flex-col justify-center px-6 pt-6 pb-10 [@media(max-height:780px)]:pt-3 [@media(max-height:780px)]:pb-7">
              <div className="bv-hero-in">
                <div className="flex items-center gap-3.5">
                  {logoTile('w-16 h-16 [@media(max-height:780px)]:w-12 [@media(max-height:780px)]:h-12', 'text-xl', 'rounded-[20px]')}
                  <p className="text-xs font-bold tracking-[0.22em] uppercase text-white/75">Thank you</p>
                </div>
                <h1 className="mt-5 [@media(max-height:780px)]:mt-3 text-[38px] max-[370px]:text-[32px] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance">
                  Thanks for visiting {business.name} ❤️
                </h1>
                <p className="mt-3 text-base text-white/75">We appreciate your support.</p>
              </div>

              {/* 3D reward teaser */}
              <div className="mt-9 px-3 mx-auto w-full max-w-[360px] [@media(max-height:780px)]:mt-7 [@media(max-height:780px)]:max-w-[270px] bv-card-reveal [@media(max-height:640px)]:hidden" style={{ animationDelay: '120ms' }}>
                <Card3D
                  satellites={
                    <>
                      <div aria-hidden className="absolute -top-4 right-[16%]" style={{ transform: 'translateZ(70px)' }}>
                        <div className="bv-float w-14 h-14 rounded-[18px] bg-white flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.18),0_18px_30px_-10px_rgba(0,0,0,0.55)]">
                          <Star3D filled className="w-9 h-9" />
                        </div>
                      </div>
                      <div aria-hidden className="absolute -right-4 bottom-[22%]" style={{ transform: 'translateZ(90px)' }}>
                        <div className="bv-float w-14 h-14 rounded-[18px] bg-white flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.18),0_18px_30px_-10px_rgba(0,0,0,0.55)]" style={{ animationDelay: '1.2s' }}>
                          <Image src="/google-maps-logo.png" alt="" width={34} height={34} />
                        </div>
                      </div>
                    </>
                  }
                >
                  <RewardPreviewCard
                    businessName={business.name}
                    logoUrl={business.logo_url}
                    initials={initials}
                    color={business.primary_color}
                    discount={business.discount_percentage}
                    holderName=""
                  />
                </Card3D>
              </div>
            </section>

            <Sheet>
              <ol className="grid grid-cols-[1fr_1fr_1.2fr] gap-2.5 [@media(max-height:780px)]:[&>li]:py-2.5" aria-label="What happens next">
                <li className="bv-tile3d rounded-[20px] bg-gradient-to-b from-amber-50 to-amber-100/60 border border-amber-100 p-3">
                  <div className="flex text-amber-400" aria-hidden>
                    {[0, 1, 2].map((i) => <Star3D key={i} filled className="w-[18px] h-[18px]" />)}
                  </div>
                  <p className="mt-3 text-[13px] font-bold">Review</p>
                  <p className="text-[11px] text-[#64748B] leading-snug">on Google Maps</p>
                </li>
                <li className="bv-tile3d rounded-[20px] bg-gradient-to-b from-white to-slate-100 border border-slate-100 p-3">
                  <div className="flex -space-x-1.5 rtl:space-x-reverse" aria-hidden>
                    {[0.25, 0.45, 0.7].map((a) => (
                      <span key={a} className="w-5 h-5 rounded-full ring-2 ring-white flex items-center justify-center" style={{ background: withAlpha(theme.deep, a) }}>
                        <User className="w-3 h-3 text-white" />
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-[13px] font-bold">Share</p>
                  <p className="text-[11px] text-[#64748B] leading-snug">with friends</p>
                </li>
                <li className="relative rounded-[20px] p-3 text-white overflow-hidden shadow-[0_3px_0_rgba(0,0,0,0.25),0_14px_24px_-14px_rgba(0,0,0,0.6)]" style={{ background: `linear-gradient(140deg, ${theme.deep}, ${theme.dark})` }}>
                  <div aria-hidden className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.2),transparent_50%)]" />
                  <p className="relative text-[10px] font-bold tracking-[0.18em] text-white/70">REWARD</p>
                  <p className="relative mt-1.5 text-[26px] leading-none font-extrabold tracking-tight">
                    {business.discount_percentage}%<span className="text-xs font-bold"> OFF</span>
                  </p>
                  <p className="relative mt-1 text-[11px] text-white/70">next visit</p>
                </li>
              </ol>

              <button onClick={() => updateStep(2)} style={primaryStyle} className={`${primaryButton} mt-5`}>
                <span>Continue</span>
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </button>
              <PoweredBy />
            </Sheet>
          </>
        )}

        {/* STEP 2: GOOGLE REVIEW */}
        {step === 2 && (
          <>
            <section key="hero-2" className="flex-1 flex flex-col justify-center items-center text-center px-6 py-7 [@media(max-height:780px)]:py-3 bv-hero-in">
              <div className="bv-float">
                <div className="w-[72px] h-[72px] [@media(max-height:780px)]:w-[58px] [@media(max-height:780px)]:h-[58px] rounded-[24px] bg-gradient-to-b from-white to-slate-200 flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.22),0_22px_36px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_#fff] [transform:perspective(500px)_rotateX(10deg)]">
                  <Image src="/google-maps-logo.png" alt="Google Maps logo" width={44} height={44} />
                </div>
              </div>
              <h1 className="mt-5 [@media(max-height:780px)]:mt-3 text-[34px] max-[370px]:text-[30px] leading-[1.05] font-extrabold tracking-[-0.03em]">
                How was your<br />experience?
              </h1>

              {/* Tap-to-rate stars (visual guide; the rating itself is chosen on Google) */}
              <div className="mt-7 [@media(max-height:780px)]:mt-4 bv-glass rounded-[26px] px-3 py-3 flex justify-center gap-0.5 shadow-[0_24px_40px_-20px_rgba(0,0,0,0.6)]" role="radiogroup" aria-label="Your rating">
                {[1, 2, 3, 4, 5].map((value) => {
                  const filled = value <= rating;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`${value} star${value > 1 ? 's' : ''}`}
                      onClick={() => {
                        setRating(value);
                        setRatingTick((t) => t + 1);
                      }}
                      className="relative w-[58px] h-[58px] max-[370px]:w-[52px] max-[370px]:h-[52px] flex items-center justify-center rounded-2xl"
                    >
                      {filled && rating === value && (
                        <span key={`burst-${ratingTick}`} aria-hidden className="absolute inset-1 rounded-full border-2 border-amber-300 bv-burst" />
                      )}
                      <span
                        key={filled ? `on-${ratingTick}` : 'off'}
                        className={filled ? 'bv-pop' : ''}
                        style={filled ? { animationDelay: `${(value - 1) * 45}ms` } : undefined}
                      >
                        <Star3D
                          filled={filled}
                          className={`block w-12 h-12 max-[370px]:w-11 max-[370px]:h-11 ${filled ? 'drop-shadow-[0_8px_14px_rgba(245,158,11,0.5)]' : ''}`}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-white/80 min-h-[20px]" aria-live="polite">{ratingHint}</p>
            </section>

            <Sheet>
              <ol className="relative space-y-4" aria-label="How to post your review">
                <span aria-hidden className="absolute start-5 top-5 bottom-5 w-px bg-slate-200" />
                {[
                  { title: 'Rate', text: 'Pick your stars', icon: <Star3D filled className="w-5 h-5" /> },
                  { title: 'Write', text: 'Add a few words about your visit', icon: <PenLine className="w-[18px] h-[18px] text-[#2563EB]" /> },
                  { title: 'Post on Google', text: 'Tap “Post” on Google Maps', icon: <Image src="/google-maps-logo.png" alt="" width={18} height={18} /> },
                ].map((item, index) => (
                  <li key={item.title} className="relative flex items-center gap-3.5">
                    <span className="bv-tile3d relative z-10 w-10 h-10 rounded-full bg-gradient-to-b from-white to-slate-100 border border-slate-200 flex items-center justify-center shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold leading-tight">{index + 1}. {item.title}</p>
                      <p className="text-[13px] text-[#64748B]">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <button
                onClick={handleGoogleReviewClick}
                className={`${primaryButton} mt-6`}
                style={darkStyle}
              >
                <span className="w-8 h-8 rounded-[10px] bg-white flex items-center justify-center shrink-0">
                  <Image src="/google-maps-logo.png" alt="" width={20} height={20} />
                </span>
                <span>Leave a Google Review</span>
              </button>
              <button onClick={() => updateStep(3)} className={`${ghostButton} mt-2`}>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
              <PoweredBy compact />
            </Sheet>
          </>
        )}

        {/* STEP 3: SHARE WITH 3 FRIENDS */}
        {step === 3 && (
          <>
            <section key="hero-3" className="flex-1 flex flex-col justify-center items-center text-center px-6 py-7 bv-hero-in">
              {/* Illustration: the store at the centre of three friends */}
              <div aria-hidden className="relative w-[230px] h-[190px]">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 230 190" fill="none">
                  <circle cx="115" cy="95" r="88" stroke="white" strokeOpacity="0.14" />
                  <circle cx="115" cy="95" r="60" stroke="white" strokeOpacity="0.2" strokeDasharray="3 5" />
                  {[[34, 40], [196, 52], [112, 176]].map(([x, y]) => (
                    <line key={`${x}-${y}`} x1="115" y1="95" x2={x} y2={y} stroke="white" strokeOpacity="0.35" strokeDasharray="2 5" strokeLinecap="round" />
                  ))}
                </svg>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">{logoTile('w-[84px] h-[84px]', 'text-2xl', 'rounded-[26px]')}</div>
                {[
                  { pos: 'left-[12px] top-[18px]', delay: '0ms' },
                  { pos: 'right-[12px] top-[30px]', delay: '700ms' },
                  { pos: 'left-[90px] bottom-[-8px]', delay: '1400ms' },
                ].map((friend, i) => (
                  <div key={i} className={`absolute ${friend.pos}`}>
                    <div className="bv-float" style={{ animationDelay: friend.delay }}>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-b from-white to-slate-200 shadow-[0_3px_0_rgba(0,0,0,0.2),0_14px_22px_-8px_rgba(0,0,0,0.55),inset_0_1px_0_#fff] flex items-center justify-center">
                        <User className="w-5 h-5" style={{ color: theme.deep }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <h1 className="mt-6 text-[34px] leading-[1.05] font-extrabold tracking-[-0.03em]">Share with 3 friends</h1>
              <p className="mt-3 text-base text-white/75 max-w-[300px]">Share {business.name} with friends who might like it.</p>
            </section>

            <Sheet>
              {/* Anticipation: what's unlocked next */}
              <div className="bv-tile3d flex items-center gap-3 rounded-[20px] bg-gradient-to-b from-white to-slate-100 border border-slate-100 p-3 mb-5">
                <span className="w-11 h-11 rounded-[14px] flex items-center justify-center text-white shrink-0" style={{ background: `linear-gradient(140deg, ${theme.deep}, ${theme.dark})` }}>
                  <Gift className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#64748B]">Next</p>
                  <p className="text-[15px] font-bold leading-tight">Your {business.discount_percentage}% OFF reward</p>
                </div>
              </div>

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
              <button onClick={() => updateStep(4)} className={`${ghostButton} mt-2`}>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
              <PoweredBy compact />
            </Sheet>
          </>
        )}

        {/* STEP 4: CUSTOMER DETAILS (reward reveal) */}
        {step === 4 && (
          <>
            <section key="hero-4" className="flex-1 flex flex-col justify-center px-6 pt-6 pb-8">
              <p className="text-xs font-bold tracking-[0.22em] uppercase text-white/70 bv-hero-in">Unlocked</p>
              <h1 className="mt-2 text-[30px] max-[370px]:text-[27px] leading-[1.08] font-extrabold tracking-[-0.03em] bv-hero-in whitespace-nowrap">Your reward is ready 🎁</h1>
              <div className="mt-7 px-2 bv-card-reveal">
                <Card3D>
                <RewardPreviewCard
                  businessName={business.name}
                  logoUrl={business.logo_url}
                  initials={initials}
                  color={business.primary_color}
                  discount={business.discount_percentage}
                  holderName={customerName}
                />
                </Card3D>
              </div>
            </section>

            <Sheet>
              <p className="text-[15px] text-[#475569] mb-4">
                Enter your details to create your personal discount card for {business.name}.
              </p>
              <form onSubmit={handleCreateCard} className="space-y-3.5" noValidate>
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

                <button type="submit" disabled={submitting} style={primaryStyle} className={`${primaryButton} !mt-5`}>
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
              </form>
              <PoweredBy compact />
            </Sheet>
          </>
        )}

        {/* STEP 5: DISCOUNT CARD SCREEN */}
        {step === 5 && reward && (
          <>
            <section key="hero-5" className="flex-1 flex flex-col justify-center px-5 pt-6 pb-8">
              <div className="px-1 bv-hero-in">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] bv-glass px-3 py-1.5 rounded-full">
                  <Check className="w-3.5 h-3.5" /> Card created
                </span>
                <h1 className="mt-3 text-[32px] leading-[1.05] font-extrabold tracking-[-0.03em]">Your reward is ready.</h1>
              </div>
              {/* The Personalized Reward Card SVG */}
              <div className="mt-7 px-1 bv-card-reveal">
                <Card3D radius="3.6% / 5.8%">
                  <RewardCard business={business} reward={reward} cardRef={cardRef} />
                </Card3D>
              </div>
            </section>

            <Sheet>
              <p className="text-[15px] text-[#475569] mb-4">
                Save this card and show it on your next visit to {business.name}.
              </p>
              <SaveCardButton
                business={business}
                reward={reward}
                buttonClassName={`${primaryButton}`}
                buttonStyle={primaryStyle}
              />
              <ol className="mt-4 grid grid-cols-2 gap-2.5">
                <li className="bv-tile3d rounded-[18px] bg-gradient-to-b from-white to-slate-100 border border-slate-100 p-3">
                  <Download className="w-4 h-4" style={{ color: theme.deep }} />
                  <p className="text-[13px] font-semibold mt-2 leading-snug">Save the card to your photos</p>
                </li>
                <li className="bv-tile3d rounded-[18px] bg-gradient-to-b from-white to-slate-100 border border-slate-100 p-3">
                  <Store className="w-4 h-4" style={{ color: theme.deep }} />
                  <p className="text-[13px] font-semibold mt-2 leading-snug">Show it at the counter next time</p>
                </li>
              </ol>
              <p className="mt-3 text-xs text-[#64748B] font-medium text-center">You can also take a screenshot.</p>
              <PoweredBy compact />
            </Sheet>
          </>
        )}
      </div>
    </main>
  );
}

/** Full-bleed brand backdrop (or store cover photo) behind the customer flow. */
function Stage({
  style,
  coverUrl,
  coverAlt,
  overlayStyle,
}: {
  style?: React.CSSProperties;
  coverUrl?: string | null;
  coverAlt?: string;
  overlayStyle?: React.CSSProperties;
}) {
  return (
    <div aria-hidden={!coverUrl} className="fixed inset-0 -z-0 overflow-hidden" style={coverUrl ? undefined : style}>
      {coverUrl && (
        <>
          <Image src={coverUrl} alt={coverAlt || ''} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 opacity-[0.88]" style={overlayStyle} />
        </>
      )}
      <div className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-white/[0.08] blur-3xl" />
      <svg className="absolute -right-28 -top-16 w-[460px] h-[460px] opacity-[0.14]" viewBox="0 0 200 200" fill="none" stroke="white" strokeWidth="1.1">
        {[30, 50, 70, 90].map((r) => <circle key={r} cx="100" cy="100" r={r} />)}
      </svg>
      {/* Ripple floor in perspective for depth */}
      <div className="absolute inset-x-[-40%] bottom-[18%] h-[60vh] bv-floor opacity-[0.18]">
        <svg className="w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="none" fill="none" stroke="white" strokeWidth="0.5">
          {[20, 40, 60, 80, 100].map((r) => <circle key={r} cx="100" cy="100" r={r} />)}
        </svg>
      </div>
      <div className="absolute inset-0 bv-grain" />
    </div>
  );
}

function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 bg-white text-[#0F172A] rounded-t-[32px] md:rounded-[32px] md:mb-6 px-5 pt-6 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-24px_48px_-24px_rgba(0,0,0,0.45)] bv-sheet-up">
      {children}
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
      <label htmlFor={id} className="block text-sm font-bold mb-1.5">
        {label} <span className="text-[#DC2626]">*</span>
      </label>
      <div className="relative">
        <span className="absolute start-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">{icon}</span>
        <input
          id={id}
          aria-invalid={!!error}
          {...input}
          className={`w-full min-h-[56px] ps-12 pe-4 rounded-[18px] border bg-[#F8FAFC] text-[#0F172A] text-base placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all ${
            error ? 'border-[#DC2626] bg-red-50/40' : 'border-[#E2E8F0]'
          }`}
        />
      </div>
      {error && <p className="text-xs text-[#DC2626] mt-1.5 font-semibold">{error}</p>}
    </div>
  );
}

// boostov.ma appears ONLY as a subtle label on customer pages
function PoweredBy({ compact = false }: { compact?: boolean }) {
  return (
    <p className={`${compact ? 'mt-3' : 'mt-5'} flex items-center justify-center gap-1.5 text-[11px] text-[#94A3B8] font-medium`}>
      Powered by
      <Image src="/boostov-logo.png" alt="" width={14} height={14} />
      <span className="font-bold text-[#334155]">
        boostov<span className="text-[#2563EB]">.ma</span>
      </span>
    </p>
  );
}
