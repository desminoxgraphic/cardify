'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { RewardCard } from '@/components/RewardCard';
import { SaveCardButton } from '@/components/SaveCardButton';
import { PublicBusiness, Reward } from '@/lib/types';
import { getAccessibleBrandColor } from '@/lib/utils';
import { Star, Share2, ArrowRight, Gift, Check, Loader2 } from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5;

export default function CustomerExperiencePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>(1);

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
      <div className="min-h-dvh flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3 text-[#64748B]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
          <span className="text-sm font-medium">Loading store...</span>
        </div>
      </div>
    );
  }

  // Not Found / Disabled Screen
  if (error || !business) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="w-full max-w-[430px] bg-white rounded-3xl p-8 shadow-md border border-[#E2E8F0] text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#64748B]">
            <Star className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] mb-2">
            {error === 'Database not configured.' ? 'Configuration Required' : 'Business Not Available'}
          </h1>
          <p className="text-sm text-[#64748B]">
            {error === 'Database not configured.'
              ? 'Cardify needs its Supabase environment variables before this store can load.'
              : 'This store page is currently inactive or does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  const primaryColor = getAccessibleBrandColor(business.primary_color);

  return (
    <main className="min-h-dvh bg-[#F8FAFC] flex flex-col justify-between max-w-[430px] mx-auto px-4 py-6">
      {/* HEADER PROGRESS INDICATOR */}
      <div className="w-full mb-6 px-2">
        <div className="flex items-center gap-1.5 w-full">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{ backgroundColor: step >= i ? primaryColor : '#E2E8F0' }}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            {['Thank You', 'Review', 'Share', 'Details', 'Reward'][step - 1]}
          </span>
          <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
            Step {step} of 5
          </span>
        </div>
      </div>

      {/* STEP CONTENT WRAPPER */}
      <div key={step} className="flex-1 flex flex-col justify-center my-auto animate-step-in">
        {/* STEP 1: THANK YOU */}
        {step === 1 && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-[#E2E8F0] text-center">
            {business.cover_image_url ? (
              <div className="relative h-44 w-full">
                <Image src={business.cover_image_url} alt={`${business.name} storefront`} fill sizes="430px" priority className="object-cover" />
              </div>
            ) : (
              <div className="h-24 w-full" style={{ background: `linear-gradient(135deg, ${primaryColor}, #0F172A)` }} />
            )}
            <div className="p-6 sm:p-8 flex flex-col items-center">
            {/* BUSINESS LOGO (or Business Initial Fallback, NEVER Cardify logo) */}
            <div className="w-20 h-20 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-2 flex items-center justify-center mb-5 shadow-sm overflow-hidden">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div
                  style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                  className="w-full h-full rounded-xl flex items-center justify-center font-black text-2xl"
                >
                  {getInitials(business.name)}
                </div>
              )}
            </div>

            <span
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              className="text-[11px] font-bold tracking-widest uppercase mb-2 px-3 py-1 rounded-full"
            >
              THANK YOU
            </span>

            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight mb-2">
              Thanks for visiting {business.name} ❤️
            </h1>

            <p className="text-sm text-[#64748B] mb-8 max-w-[300px]">
              We appreciate your support.
            </p>

            <button
              onClick={() => updateStep(2)}
              style={{ backgroundColor: primaryColor }}
              className="w-full hover:opacity-90 active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md text-base"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            </div>
          </div>
        )}

        {/* STEP 2: GOOGLE REVIEW */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-[#E2E8F0] text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 text-amber-500 border border-amber-100">
              <Star className="w-8 h-8 fill-amber-400 stroke-amber-500" />
            </div>

            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight mb-2">
              How was your experience?
            </h1>

            <p className="text-sm text-[#64748B] mb-8 leading-relaxed">
              If you enjoyed your visit to {business.name}, we&apos;d appreciate your honest feedback.
            </p>

            <div className="w-full space-y-3">
              <button
                onClick={handleGoogleReviewClick}
                className="w-full bg-[#0F172A] hover:bg-slate-800 active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md text-base"
              >
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Leave a Google Review</span>
              </button>

              <button
                onClick={() => updateStep(3)}
                className="w-full bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-[#0F172A] font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 text-base"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SHARE WITH 3 FRIENDS */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-[#E2E8F0] text-center flex flex-col items-center">
            <div
              style={{ backgroundColor: `${primaryColor}10`, color: primaryColor, borderColor: `${primaryColor}20` }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border"
            >
              <Share2 className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight mb-2">
              Share with 3 friends
            </h1>

            <p className="text-sm text-[#64748B] mb-8 leading-relaxed">
              Share {business.name} with friends who might like it.
            </p>

            <div className="w-full space-y-3">
              <button
                onClick={handleShareClick}
                style={{ backgroundColor: primaryColor }}
                className="w-full hover:opacity-90 active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md text-base"
              >
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

              <button
                onClick={() => updateStep(4)}
                className="w-full bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-[#0F172A] font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 text-base"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CUSTOMER DETAILS */}
        {step === 4 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-[#E2E8F0] flex flex-col">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#16A34A] border border-emerald-100">
                <Gift className="w-8 h-8" />
              </div>

              <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight mb-1">
                Your reward is ready 🎁
              </h1>

              <p className="text-sm text-[#64748B]">
                Enter your details to create your personal discount card for {business.name}.
              </p>
            </div>

            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                  Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mohamed"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoComplete="name"
                  className={`w-full px-4 py-3 rounded-xl border bg-[#F8FAFC] text-[#0F172A] text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all ${
                    formErrors.name ? 'border-[#DC2626] bg-red-50/30' : 'border-[#E2E8F0]'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-xs text-[#DC2626] mt-1 font-medium">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +212 672 692 764"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  enterKeyHint="done"
                  className={`w-full px-4 py-3 rounded-xl border bg-[#F8FAFC] text-[#0F172A] text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all ${
                    formErrors.phone ? 'border-[#DC2626] bg-red-50/30' : 'border-[#E2E8F0]'
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-xs text-[#DC2626] mt-1 font-medium">{formErrors.phone}</p>
                )}
              </div>

              {submitError && (
                <div className="p-3 bg-red-50 text-[#DC2626] border border-red-200 rounded-xl text-xs font-medium text-center">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: primaryColor }}
                className="w-full hover:opacity-90 active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md text-base disabled:opacity-70 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Your Card...</span>
                  </>
                ) : (
                  <span>Create My Card</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 5: DISCOUNT CARD SCREEN */}
        {step === 5 && reward && (
          <div className="space-y-6">
            {/* The Personalized Reward Card SVG */}
            <RewardCard business={business} reward={reward} cardRef={cardRef} />

            {/* Below the Card Content */}
            <div className="bg-white rounded-3xl p-6 shadow-md border border-[#E2E8F0] text-center space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                  Your reward is ready.
                </h2>
                <p className="text-sm text-[#64748B] mt-1">
                  Save this card and show it on your next visit to {business.name}.
                </p>
              </div>

              <SaveCardButton business={business} reward={reward} />

              <p className="text-xs text-[#64748B] font-medium">
                You can also take a screenshot.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER - Cardify appears ONLY as subtle label */}
      <footer className="w-full text-center pt-6 pb-2">
        <p className="text-xs text-[#64748B] font-medium tracking-wide">
          Powered by <span className="font-bold text-[#0F172A]">Cardify</span>
        </p>
      </footer>
    </main>
  );
}
