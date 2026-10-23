'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { RewardCard } from '@/components/RewardCard';
import { SaveCardButton } from '@/components/SaveCardButton';
import { PublicBusiness, Reward } from '@/lib/types';
import { getAccessibleBrandColor } from '@/lib/utils';
import {
  Star,
  Share2,
  ArrowRight,
  ArrowLeft,
  Gift,
  Check,
  Loader2,
  ExternalLink,
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


  // Loading Screen
  if (loading) {
    return (
      <main className="min-h-dvh bg-[#F8FAFC] max-w-[440px] mx-auto px-5 pt-5" aria-busy="true" aria-label="Loading store">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3.5 w-32 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-2.5 w-20 rounded-full bg-slate-200 animate-pulse" />
          </div>
        </div>
        <div className="mt-8 h-[420px] rounded-[28px] bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="h-32 bg-slate-100 animate-pulse" />
          <div className="p-6 space-y-3">
            <div className="h-5 w-3/4 rounded-full bg-slate-100 animate-pulse" />
            <div className="h-3.5 w-1/2 rounded-full bg-slate-100 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-6 text-[#64748B]">
          <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
          <span className="text-sm font-medium">Loading store...</span>
        </div>
      </main>
    );
  }

  // Not Found / Disabled Screen
  if (error || !business) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-5 bg-[#F8FAFC]">
        <div className="w-full max-w-[400px] bg-white rounded-[28px] p-8 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] border border-[#E2E8F0] text-center animate-scaleUp">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-[#64748B]">
            <Store className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h1 className="text-xl font-extrabold text-[#0F172A] mb-2 tracking-tight">
            {error === 'Database not configured.' ? 'Configuration Required' : 'Business Not Available'}
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed">
            {error === 'Database not configured.'
              ? 'boostov.ma needs its Supabase environment variables before this store can load.'
              : 'This store page is currently inactive or does not exist.'}
          </p>
        </div>
        <PoweredBy />
      </main>
    );
  }

  const primaryColor = getAccessibleBrandColor(business.primary_color);
  const stepLabels = ['Thank You', 'Review', 'Share', 'Details', 'Reward'];
  const canGoBack = step > 1 && step < 5;

  const primaryButton =
    'w-full min-h-[56px] text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2.5 text-base shadow-[0_10px_24px_-10px_rgba(15,23,42,0.55)] hover:brightness-110 active:scale-[0.98] disabled:opacity-70';
  const secondaryButton =
    'w-full min-h-[52px] bg-white hover:bg-slate-50 border border-[#E2E8F0] active:scale-[0.98] text-[#0F172A] font-semibold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 text-base';

  const businessMark = (sizeClass: string, textClass: string) => (
    <div className={`${sizeClass} rounded-2xl bg-white border border-[#E2E8F0] p-1 flex items-center justify-center shadow-sm overflow-hidden shrink-0`}>
      {business.logo_url ? (
        <Image
          src={business.logo_url}
          alt={`${business.name} logo`}
          width={96}
          height={96}
          className="w-full h-full object-contain rounded-xl"
        />
      ) : (
        <div
          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          className={`w-full h-full rounded-xl flex items-center justify-center font-black ${textClass}`}
        >
          {getInitials(business.name)}
        </div>
      )}
    </div>
  );

  return (
    <main className="relative min-h-dvh bg-[#F8FAFC] flex flex-col max-w-[440px] mx-auto px-5 pt-4 pb-6">
      {/* Brand wash behind the header */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 -z-0 opacity-70"
        style={{ background: `radial-gradient(120% 100% at 50% 0%, ${primaryColor}1F, transparent 70%)` }}
      />

      {/* HEADER: back + business identity + progress */}
      <header className="relative z-10">
        <div className="flex items-center gap-3 min-h-[48px]">
          {canGoBack ? (
            <button
              type="button"
              onClick={() => updateStep((step - 1) as Step)}
              aria-label="Go back to the previous step"
              className="w-11 h-11 -ml-1 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#0F172A] hover:bg-slate-50 active:scale-95 transition-all shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}
          {businessMark('w-11 h-11', 'text-sm')}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[15px] leading-tight text-[#0F172A] truncate">{business.name}</p>
            <p className="text-xs text-[#64748B] font-medium">
              Step {step} of 5 · {stepLabels[step - 1]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full mt-4" role="progressbar" aria-valuemin={1} aria-valuemax={5} aria-valuenow={step} aria-label="Progress">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full bg-[#E2E8F0] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: step >= i ? '100%' : '0%', backgroundColor: primaryColor }}
              />
            </div>
          ))}
        </div>
      </header>

      {/* STEP CONTENT WRAPPER */}
      <div key={step} className="relative z-10 flex-1 flex flex-col pt-6 animate-step-in">
        {/* STEP 1: THANK YOU */}
        {step === 1 && (
          <section className="bg-white rounded-[28px] overflow-hidden shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] border border-[#E2E8F0] text-center">
            <div className="relative h-40 w-full">
              {business.cover_image_url ? (
                <Image src={business.cover_image_url} alt={`${business.name} storefront`} fill sizes="440px" priority className="object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primaryColor}, #0F172A)` }}>
                  <svg aria-hidden className="absolute -right-6 -bottom-10 w-52 h-52 text-white/10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
                    <path d="M30 20a50 50 0 0 1 50 50" />
                    <path d="M30 40a30 30 0 0 1 30 30" />
                    <circle cx="32" cy="68" r="8" fill="currentColor" stroke="none" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
            </div>
            <div className="px-6 pb-7 flex flex-col items-center">
              <div className="-mt-12 mb-4 relative">{businessMark('w-24 h-24', 'text-2xl')}</div>

              <span
                style={{ backgroundColor: `${primaryColor}14`, color: primaryColor }}
                className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3 px-3 py-1 rounded-full"
              >
                Thank you
              </span>

              <h1 className="text-[26px] leading-[1.15] font-extrabold text-[#0F172A] tracking-tight mb-2 text-balance">
                Thanks for visiting {business.name} ❤️
              </h1>

              <p className="text-[15px] text-[#64748B] mb-6 max-w-[300px]">
                We appreciate your support.
              </p>

              {/* What happens next */}
              <ol className="w-full grid grid-cols-3 gap-2 mb-7 text-left" aria-label="What happens next">
                {[
                  { icon: <Star className="w-4 h-4 fill-amber-400 stroke-amber-500" />, label: 'Review' },
                  { icon: <Share2 className="w-4 h-4" style={{ color: primaryColor }} />, label: 'Share' },
                  { icon: <Gift className="w-4 h-4 text-[#16A34A]" />, label: 'Reward' },
                ].map((item, index) => (
                  <li key={item.label} className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center">{item.icon}</span>
                      <span className="text-[10px] font-bold text-[#94A3B8]">0{index + 1}</span>
                    </div>
                    <p className="text-xs font-bold text-[#0F172A] mt-2">{item.label}</p>
                  </li>
                ))}
              </ol>

              <button onClick={() => updateStep(2)} style={{ backgroundColor: primaryColor }} className={primaryButton}>
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </section>
        )}

        {/* STEP 2: GOOGLE REVIEW */}
        {step === 2 && (
          <section className="bg-white rounded-[28px] p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] border border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                <Image src="/google-maps-logo.png" alt="Google Maps logo" width={36} height={36} />
              </div>
              <div>
                <h1 className="text-[22px] leading-tight font-extrabold text-[#0F172A] tracking-tight">
                  How was your experience?
                </h1>
                <p className="text-xs font-semibold text-[#64748B] mt-0.5">Reviews are posted on Google Maps</p>
              </div>
            </div>

            {/* Tap-to-rate stars (visual guide; the rating itself is chosen on Google) */}
            <div className="rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-5 text-center">
              <div className="flex items-center justify-center gap-1.5" role="radiogroup" aria-label="Your rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} star${value > 1 ? 's' : ''}`}
                    onClick={() => setRating(value)}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform active:scale-90 hover:scale-110"
                  >
                    <Star
                      className={`w-9 h-9 transition-all duration-200 ${
                        value <= rating ? 'fill-amber-400 stroke-amber-500 scale-110' : 'fill-white stroke-[#CBD5E1]'
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-[#64748B] mt-3 min-h-[20px]" aria-live="polite">
                {rating > 0
                  ? `Choose ${rating} star${rating > 1 ? 's' : ''} again on Google to post it.`
                  : `Tap the stars to rate ${business.name}.`}
              </p>
            </div>

            {/* 3 visual steps */}
            <ol className="mt-5 space-y-2.5" aria-label="How to post your review">
              {[
                { title: 'Rate', text: 'Pick your stars', icon: <Star className="w-4 h-4 fill-amber-400 stroke-amber-500" /> },
                { title: 'Write', text: 'Add a few words about your visit', icon: <PenLine className="w-4 h-4 text-[#2563EB]" /> },
                { title: 'Post on Google', text: 'Tap “Post” on Google Maps', icon: <Image src="/google-maps-logo.png" alt="" width={16} height={16} /> },
              ].map((item, index) => (
                <li key={item.title} className="flex items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0F172A] leading-tight">{item.title}</p>
                    <p className="text-xs text-[#64748B]">{item.text}</p>
                  </div>
                  <span className="w-8 h-8 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">{item.icon}</span>
                </li>
              ))}
            </ol>

            <div className="w-full space-y-3 mt-6">
              <button onClick={handleGoogleReviewClick} className={`${primaryButton} bg-[#0F172A]`}>
                <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                  <Image src="/google-maps-logo.png" alt="" width={20} height={20} />
                </span>
                <span>Leave a Google Review</span>
                <ExternalLink className="w-4 h-4 opacity-70" />
              </button>

              <button onClick={() => updateStep(3)} className={secondaryButton}>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: SHARE WITH 3 FRIENDS */}
        {step === 3 && (
          <section className="bg-white rounded-[28px] p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] border border-[#E2E8F0] text-center flex flex-col items-center">
            {/* Visual: business mark sending to three friends */}
            <div className="relative w-full h-36 mb-5 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden" aria-hidden>
              <div className="absolute left-6 top-1/2 -translate-y-1/2">{businessMark('w-16 h-16', 'text-lg')}</div>
              <svg className="absolute left-[86px] right-[78px] top-1/2 -translate-y-1/2 h-24 w-[calc(100%-164px)]" viewBox="0 0 100 60" preserveAspectRatio="none" fill="none">
                {[8, 30, 52].map((y) => (
                  <path key={y} d={`M0 30 C 40 30, 60 ${y}, 100 ${y}`} stroke={primaryColor} strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                ))}
              </svg>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-white shadow-sm flex items-center justify-center animate-scaleUp"
                    style={{ backgroundColor: `${primaryColor}${['26', '40', '59'][i]}`, animationDelay: `${120 + i * 90}ms` }}
                  >
                    <User className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>
                ))}
              </div>
            </div>

            <h1 className="text-[24px] leading-tight font-extrabold text-[#0F172A] tracking-tight mb-2">
              Share with 3 friends
            </h1>

            <p className="text-[15px] text-[#64748B] mb-7 leading-relaxed">
              Share {business.name} with friends who might like it.
            </p>

            <div className="w-full space-y-3">
              <button onClick={handleShareClick} style={{ backgroundColor: primaryColor }} className={primaryButton}>
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-white" />
                    <span>Link copied ✓</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5" />
                    <span>{canNativeShare ? 'Share' : 'Copy Link'}</span>
                  </>
                )}
              </button>

              <button onClick={() => updateStep(4)} className={secondaryButton}>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* STEP 4: CUSTOMER DETAILS */}
        {step === 4 && (
          <section className="bg-white rounded-[28px] p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] border border-[#E2E8F0] flex flex-col">
            {/* Reward teaser */}
            <div
              className="relative rounded-3xl p-5 mb-6 overflow-hidden text-white"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, #0F172A)` }}
            >
              <svg aria-hidden className="absolute -right-4 -top-4 w-28 h-28 text-white/10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round">
                <path d="M30 20a50 50 0 0 1 50 50" />
                <path d="M30 40a30 30 0 0 1 30 30" />
              </svg>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/75">
                <Gift className="w-4 h-4" /> Your reward
              </div>
              <p className="text-4xl font-black tracking-tight mt-2">{business.discount_percentage}% OFF</p>
              <p className="text-sm text-white/80 mt-1">on your next visit to {business.name}</p>
            </div>

            <h1 className="text-[22px] leading-tight font-extrabold text-[#0F172A] tracking-tight mb-1">
              Your reward is ready 🎁
            </h1>
            <p className="text-sm text-[#64748B] mb-5">
              Enter your details to create your personal discount card for {business.name}.
            </p>

            <form onSubmit={handleCreateCard} className="space-y-4" noValidate>
              <div>
                <label htmlFor="customer-name" className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Name <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="customer-name"
                    type="text"
                    placeholder="e.g. Mohamed"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    autoComplete="name"
                    aria-invalid={!!formErrors.name}
                    className={`w-full min-h-[54px] pl-12 pr-4 rounded-2xl border bg-[#F8FAFC] text-[#0F172A] text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all ${
                      formErrors.name ? 'border-[#DC2626] bg-red-50/40' : 'border-[#E2E8F0]'
                    }`}
                  />
                </div>
                {formErrors.name && (
                  <p className="text-xs text-[#DC2626] mt-1.5 font-semibold">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="customer-phone" className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Phone Number <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="customer-phone"
                    type="tel"
                    placeholder="e.g. +212 672 692 764"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                    enterKeyHint="done"
                    aria-invalid={!!formErrors.phone}
                    className={`w-full min-h-[54px] pl-12 pr-4 rounded-2xl border bg-[#F8FAFC] text-[#0F172A] text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all ${
                      formErrors.phone ? 'border-[#DC2626] bg-red-50/40' : 'border-[#E2E8F0]'
                    }`}
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-xs text-[#DC2626] mt-1.5 font-semibold">{formErrors.phone}</p>
                )}
              </div>

              {submitError && (
                <div role="alert" className="p-3 bg-red-50 text-[#DC2626] border border-red-200 rounded-2xl text-sm font-semibold text-center">
                  {submitError}
                </div>
              )}

              <button type="submit" disabled={submitting} style={{ backgroundColor: primaryColor }} className={`${primaryButton} mt-2`}>
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Your Card...</span>
                  </>
                ) : (
                  <>
                    <span>Create My Card</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

            </form>
          </section>
        )}

        {/* STEP 5: DISCOUNT CARD SCREEN */}
        {step === 5 && reward && (
          <section className="space-y-5">
            <div className="text-center px-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#16A34A] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <Check className="w-3.5 h-3.5" /> Card created
              </span>
              <h1 className="text-[24px] leading-tight font-extrabold text-[#0F172A] tracking-tight mt-3">
                Your reward is ready.
              </h1>
              <p className="text-[15px] text-[#64748B] mt-1">
                Save this card and show it on your next visit to {business.name}.
              </p>
            </div>

            {/* The Personalized Reward Card SVG */}
            <div className="animate-scaleUp">
              <RewardCard business={business} reward={reward} cardRef={cardRef} />
            </div>

            <div className="bg-white rounded-[28px] p-5 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] border border-[#E2E8F0] space-y-4">
              <SaveCardButton business={business} reward={reward} />
              <ol className="grid grid-cols-2 gap-2 text-left">
                <li className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                  <Download className="w-4 h-4 text-[#2563EB]" />
                  <p className="text-xs font-semibold text-[#0F172A] mt-1.5 leading-snug">Save the card to your photos</p>
                </li>
                <li className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                  <Store className="w-4 h-4 text-[#2563EB]" />
                  <p className="text-xs font-semibold text-[#0F172A] mt-1.5 leading-snug">Show it at the counter next time</p>
                </li>
              </ol>
              <p className="text-xs text-[#64748B] font-medium text-center">
                You can also take a screenshot.
              </p>
            </div>
          </section>
        )}
      </div>

      <PoweredBy />
    </main>
  );
}

// boostov.ma appears ONLY as a subtle label on customer pages
function PoweredBy() {
  return (
    <footer className="relative z-10 w-full text-center pt-8 pb-1">
      <p className="inline-flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
        Powered by
        <Image src="/boostov-logo.png" alt="" width={16} height={16} />
        <span className="font-bold text-[#0F172A]">
          boostov<span className="text-[#2563EB]">.ma</span>
        </span>
      </p>
    </footer>
  );
}
