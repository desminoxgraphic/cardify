'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ArrowRight, Check, Loader2, Phone, Share2, Store, User, WifiOff, PenLine, Download } from 'lucide-react';
import { RewardCard } from '@/components/RewardCard';
import { RewardPreviewCard } from '@/components/RewardPreviewCard';
import { SaveCardButton } from '@/components/SaveCardButton';
import { Card3D } from '@/components/Card3D';
import { Star3D } from '@/components/Star3D';
import { Symbol3D } from '@/components/Symbol3D';
import { Button, Field, LogoTile } from '@/components/ui';
import { ActionSheet, BannerFrame, Stage, StepNav, TicketSleeve, UnwrapReveal } from '@/components/experience/shell';
import { GiftBox, Heart, Sparkle } from '@/components/experience/objects';
import { StarRating } from '@/components/experience/StarRating';
import { PublicBusiness, Reward } from '@/lib/types';
import { getBrandTheme, withAlpha } from '@/lib/brand-theme';
import { formatDate } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4 | 5;
const CARD_RADIUS = '3.4% / 5.4%';

export default function CustomerExperiencePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>(1);
  // Presentation only: direction of the last step change (for slide transitions).
  const [direction, setDirection] = useState<'fwd' | 'back'>('fwd');
  // Visual-only star picker on the review step; nothing is stored or sent.
  const [rating, setRating] = useState(0);

  // Presentation only: play the unwrap reveal the first time the card appears after creation.
  const [revealCard, setRevealCard] = useState(false);
  const prevStepRef = useRef<Step>(1);
  const revealDoneRef = useRef(false);
  useEffect(() => {
    if (prevStepRef.current === 4 && step === 5 && !revealDoneRef.current) {
      revealDoneRef.current = true;
      setRevealCard(true);
      const timer = window.setTimeout(() => setRevealCard(false), 3200);
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
      setDirection('fwd');
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

  /* ═══════════════════════ Presentation ═══════════════════════ */

  const theme = getBrandTheme(business?.primary_color);

  if (loading) {
    return (
      <main className="relative min-h-svh flex flex-col text-white" aria-busy="true" aria-label="Loading store">
        <Stage />
        <div className="relative mx-auto w-full max-w-[440px] flex-1 flex flex-col">
          <div className="px-4 pt-[max(12px,env(safe-area-inset-top))] flex gap-2">
            <div className="w-11 h-11 rounded-full bg-white/10 animate-pulse" />
            <div className="flex-1 h-11 rounded-full bg-white/10 animate-pulse" />
            <div className="w-11 h-11 rounded-full bg-white/10 animate-pulse" />
          </div>
          <div className="flex-1 px-5 flex flex-col justify-center gap-4">
            <div className="h-44 rounded-[24px] bg-white/[0.07] animate-pulse" />
            <div className="h-10 w-4/5 rounded-xl bg-white/10 animate-pulse" />
            <div className="h-4 w-1/2 rounded-full bg-white/[0.07] animate-pulse" />
          </div>
          <ActionSheet
            footer={
              <Button variant="dark" size="lg" full disabled icon={<Loader2 className="w-5 h-5 animate-spin" />}>
                Loading store...
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  if (error || !business) {
    const config = error === 'Database not configured.';
    const network = error === 'Unable to load this business right now.';
    return (
      <main className="relative min-h-svh flex flex-col text-white">
        <Stage />
        <div className="relative mx-auto w-full max-w-[440px] flex-1 flex flex-col">
          <div className="flex-1 px-6 flex flex-col justify-center bv-rise">
            <div className="w-20 h-20 rounded-[24px] bv-glass flex items-center justify-center">
              {network ? <WifiOff className="w-9 h-9 text-white/85" strokeWidth={1.6} /> : <Store className="w-9 h-9 text-white/85" strokeWidth={1.6} />}
            </div>
            <h1 className="mt-7 font-display text-display-md">
              {config ? 'Configuration required' : network ? 'Connection problem' : 'Business not available'}
            </h1>
            <p className="mt-3 text-base text-white/70 max-w-[320px]">
              {config
                ? 'boostov.ma needs its Supabase environment variables before this store can load.'
                : network
                  ? 'We could not reach the store right now. Check your connection and try again.'
                  : 'This store page is currently inactive or does not exist.'}
            </p>
          </div>
          <ActionSheet
            footer={
              network ? (
                <Button variant="dark" size="lg" full onClick={() => window.location.reload()}>
                  Try again
                </Button>
              ) : (
                <span />
              )
            }
          />
        </div>
      </main>
    );
  }

  const initials = getInitials(business.name);
  // Back/forward are always shown. Step 5 is reachable only once a card exists.
  const canReach = (n: number) => n >= 1 && n <= 5 && (n < 5 || !!reward);
  const goTo = (n: number) => {
    if (!canReach(n)) return;
    setDirection(n > step ? 'fwd' : 'back');
    updateStep(n as Step);
  };
  const enter = direction === 'fwd' ? 'bv-enter-fwd' : 'bv-enter-back';
  const brandStyle = {
    background: `linear-gradient(180deg, ${theme.light} -60%, ${theme.deep} 100%)`,
    '--bv-edge': theme.neutral ? '#000' : theme.dark,
    '--bv-glow': withAlpha(theme.neutral ? '#000000' : theme.deep, 0.7),
  } as React.CSSProperties;
  const used = reward?.status === 'USED';

  return (
    <main className="relative min-h-svh flex flex-col text-white overflow-x-clip">
      <Stage theme={theme} />

      <div className="relative mx-auto w-full max-w-[440px] flex-1 flex flex-col">
        <StepNav
          step={step}
          canBack={canReach(step - 1)}
          canForward={canReach(step + 1)}
          onBack={() => goTo(step - 1)}
          onForward={() => goTo(step + 1)}
          forwardHint={step === 4 && !reward ? 'Create your card first' : undefined}
        />

        {/* ───────── 1 · THANK YOU ───────── */}
        {step === 1 && (
          <>
            <section key="s1" className={`flex-1 flex flex-col justify-center px-5 pt-2 pb-7 short:pb-4 ${enter}`}>
              <div className="relative">
                {business.cover_image_url ? (
                  <BannerFrame src={business.cover_image_url} alt={`${business.name} banner`} />
                ) : (
                  <div className="relative h-[clamp(140px,26svh,220px)] short:h-[clamp(110px,20svh,150px)] flex items-center justify-center">
                    <div aria-hidden className="absolute w-[64%] aspect-square rounded-full" style={{ background: `radial-gradient(closest-side, ${withAlpha(theme.glow, 0.35)}, transparent)` }} />
                    <Heart className="relative w-[clamp(104px,20svh,150px)] short:w-[clamp(84px,16svh,110px)]" />
                    <Sparkle className="absolute top-[10%] end-[18%] w-9" delay="0.6s" />
                    <Sparkle className="absolute bottom-[12%] start-[20%] w-6" delay="1.5s" />
                  </div>
                )}
                <div className="absolute -bottom-8 start-4">
                  <LogoTile src={business.logo_url} name={business.name} initials={initials} size="lg" className="short:w-16 short:h-16" />
                </div>
                {business.cover_image_url && <Heart className="absolute -bottom-[60px] end-2 w-12 short:w-10" />}
              </div>

              <div className="mt-12 short:mt-10 bv-rise" style={{ animationDelay: '90ms' }}>
                <p className="text-eyebrow uppercase text-gold-300">Thank you</p>
                <h1 className="mt-2.5 font-display text-display-lg short:text-display-md text-balance break-words" dir="auto">
                  Thanks for visiting <bdi className="text-gold">{business.name}</bdi>
                </h1>
                <p className="mt-2.5 text-base text-white/75">We appreciate your support.</p>
              </div>
            </section>

            <ActionSheet
              footer={
                <Button variant="brand" size="lg" full style={brandStyle} onClick={() => goTo(2)} trailingIcon={<ArrowRight className="w-5 h-5 rtl:rotate-180" />}>
                  Continue
                </Button>
              }
            >
              <p className="text-eyebrow uppercase text-ink-400 mb-3 short:hidden">What happens next</p>
              <ol className="grid grid-cols-3 gap-2.5">
                {[
                  { kind: 'star' as const, title: 'Review', text: 'on Google Maps' },
                  { kind: 'heart' as const, title: 'Share', text: 'with friends' },
                  { kind: 'ticket' as const, title: `${business.discount_percentage}% OFF`, text: 'next visit' },
                ].map((item, index) => (
                  <li
                    key={item.kind}
                    className={`relative rounded-[20px] p-3 short:p-2 short:flex short:items-center short:gap-1.5 ${index === 2 ? 'bg-ink-950 text-white shadow-float' : 'bg-white shadow-lift'}`}
                  >
                    <span className={`absolute top-2.5 end-3 short:hidden text-[10px] font-extrabold ${index === 2 ? 'text-gold-300' : 'text-ink-300'}`}>0{index + 1}</span>
                    <div className="w-11 h-11 short:w-7 short:h-7 -ms-0.5 shrink-0">
                      <Symbol3D kind={item.kind} className="w-full h-auto" />
                    </div>
                    <p className={`mt-1.5 short:mt-0 text-[15px] short:text-[13px] font-extrabold leading-tight ${index === 2 ? 'text-gold' : ''}`}>{item.title}</p>
                    <p className={`text-[11px] leading-snug short:hidden ${index === 2 ? 'text-white/65' : 'text-ink-500'}`}>{item.text}</p>
                  </li>
                ))}
              </ol>
            </ActionSheet>
          </>
        )}

        {/* ───────── 2 · REVIEW ───────── */}
        {step === 2 && (
          <>
            <section key="s2" className={`flex-1 flex flex-col justify-center items-center text-center px-4 pt-1 pb-6 short:pb-3 ${enter}`}>
              <div className="flex items-center gap-2.5">
                <LogoTile src={business.logo_url} name={business.name} initials={initials} size="sm" />
                <span className="text-[12px] font-bold tracking-[0.18em] uppercase text-white/70 max-w-[220px] truncate" dir="auto">{business.name}</span>
              </div>
              <h1 className="mt-5 short:mt-3 font-display text-display-lg short:text-display-md">
                How was <br />
                <span className="text-gold italic font-black">your visit?</span>
              </h1>
              <div className="mt-6 short:mt-4 w-full">
                <StarRating value={rating} onChange={setRating} businessName={business.name} />
              </div>
            </section>

            <ActionSheet
              footer={
                <>
                  <Button
                    key={rating}
                    variant="dark"
                    size="lg"
                    full
                    onClick={handleGoogleReviewClick}
                    className={rating >= 4 ? 'bv-glow-pulse' : ''}
                    icon={
                      <span className="w-8 h-8 rounded-[10px] bg-white flex items-center justify-center shrink-0">
                        <Image src="/google-maps-logo.png" alt="" width={20} height={20} />
                      </span>
                    }
                  >
                    Leave a Google review
                  </Button>
                  <Button variant="ghost" size="md" full className="mt-1" onClick={() => goTo(3)} trailingIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}>
                    Continue
                  </Button>
                </>
              }
            >
              <ol className="grid grid-cols-3 gap-2" aria-label="How to post your review">
                {[
                  { title: 'Rate', icon: <Star3D filled className="w-5 h-5" /> },
                  { title: 'Write', icon: <PenLine className="w-[18px] h-[18px] text-brand-blue" /> },
                  { title: 'Post', icon: <Image src="/google-maps-logo.png" alt="" width={18} height={18} /> },
                ].map((item, index) => (
                  <li key={item.title} className="flex items-center justify-center gap-1.5 rounded-2xl bg-white shadow-lift px-2 py-2.5 text-[13px] font-bold">
                    {item.icon}
                    <span>{index + 1}. {item.title}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-2.5 text-center text-xs text-ink-500">Google Maps opens in a new tab. Come back here to continue.</p>
            </ActionSheet>
          </>
        )}

        {/* ───────── 3 · SHARE ───────── */}
        {step === 3 && (
          <>
            <section key="s3" className={`flex-1 flex flex-col justify-center items-center text-center px-5 pt-1 pb-6 short:pb-3 ${enter}`}>
              {/* Gift opens, hearts fly out toward friends */}
              <div aria-hidden className="relative w-[min(82vw,320px)] h-[clamp(170px,30svh,250px)] short:h-[clamp(130px,25svh,160px)]">
                <div className="absolute inset-[6%] rounded-full" style={{ background: `radial-gradient(closest-side, ${withAlpha(theme.glow, 0.3)}, transparent)` }} />
                <div className="absolute left-1/2 bottom-[4%] -translate-x-1/2 w-[42%] short:w-[36%]">
                  <GiftBox className="w-full h-auto" opening shaking />
                  <div className="absolute -bottom-1 -end-4">
                    <LogoTile src={business.logo_url} name={business.name} initials={initials} size="sm" />
                  </div>
                </div>
                {[
                  { pos: 'start-[6%] top-[12%]', w: 'w-9', delay: '900ms' },
                  { pos: 'start-[44%] top-[0%]', w: 'w-11', delay: '1000ms' },
                  { pos: 'end-[6%] top-[14%]', w: 'w-8', delay: '1100ms' },
                ].map((h, i) => (
                  <div key={i} className={`absolute ${h.pos} ${h.w} bv-pop-in`} style={{ animationDelay: h.delay }}>
                    <div className="bv-float" style={{ animationDelay: `${i * 0.6}s` }}>
                      <Symbol3D kind="heart" className="w-full h-auto" />
                    </div>
                  </div>
                ))}
                {[
                  { pos: 'start-[0%] bottom-[16%]', delay: '0s' },
                  { pos: 'end-[0%] bottom-[28%]', delay: '0.8s' },
                ].map((f, i) => (
                  <div key={i} className={`absolute ${f.pos}`}>
                    <div className="bv-float" style={{ animationDelay: f.delay }}>
                      <div className="w-12 h-12 short:w-10 short:h-10 rounded-full bg-[radial-gradient(circle_at_35%_30%,#FFFFFF,#E7E0CF_60%,#A39676)] shadow-[0_4px_0_rgba(0,0,0,0.25),0_16px_24px_-10px_rgba(0,0,0,0.7)] flex items-center justify-center">
                        <User className="w-[46%] h-[46%] text-ink-900" strokeWidth={2.4} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <h1 className="mt-5 short:mt-3 font-display text-display-lg short:text-display-md">
                Share with <span className="text-gold italic font-black">3 friends</span>
              </h1>
              <p className="mt-2.5 text-base short:text-[15px] text-white/75 max-w-[310px] break-words" dir="auto">
                Share <bdi>{business.name}</bdi> with friends who might like it.
              </p>
            </section>

            <ActionSheet
              footer={
                <>
                  <Button
                    variant="brand"
                    size="lg"
                    full
                    style={brandStyle}
                    onClick={handleShareClick}
                    icon={copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                  >
                    {copied ? 'Link copied ✓' : canNativeShare ? 'Share' : 'Copy link'}
                  </Button>
                  <Button variant="ghost" size="md" full className="mt-1" onClick={() => goTo(4)} trailingIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}>
                    Continue
                  </Button>
                </>
              }
            >
              <div className="flex items-center gap-3 rounded-[20px] bg-ink-950 text-white p-3 shadow-float">
                <span className="w-12 h-12 shrink-0">
                  <Symbol3D kind="ticket" className="w-full h-auto" />
                </span>
                <div className="min-w-0">
                  <p className="text-eyebrow uppercase text-white/55">Up next</p>
                  <p className="mt-1 text-[16px] font-extrabold leading-tight">
                    Your <span className="text-gold">{business.discount_percentage}% OFF</span> reward card
                  </p>
                </div>
              </div>
            </ActionSheet>
          </>
        )}

        {/* ───────── 4 · DETAILS (or read-only summary once the card exists) ───────── */}
        {step === 4 && (
          <>
            <section key="s4" className={`flex-1 flex flex-col justify-center px-4 pt-1 pb-6 short:pb-3 ${enter}`}>
              <div className="px-1">
                <p className="text-eyebrow uppercase text-gold-300">{reward ? 'Your card' : 'Unlocked'}</p>
                <h1 className="mt-2 font-display text-display-md short:text-[26px]">
                  {reward ? (
                    <>Your card is <span className="text-gold italic font-black">already created</span></>
                  ) : (
                    <>Your reward <span className="text-gold italic font-black">is ready</span></>
                  )}
                </h1>
              </div>
              <div className="mt-5 short:mt-3 mx-auto w-full max-w-[400px] short:max-w-[290px]">
                {reward ? (
                  <Card3D radius={CARD_RADIUS}>
                    <RewardCard business={business} reward={reward} />
                  </Card3D>
                ) : (
                  <TicketSleeve label={business.name}>
                    <Card3D radius={CARD_RADIUS} idle={false}>
                      <RewardPreviewCard
                        businessName={business.name}
                        logoUrl={business.logo_url}
                        color={business.primary_color}
                        discount={business.discount_percentage}
                        holderName={customerName}
                      />
                    </Card3D>
                  </TicketSleeve>
                )}
              </div>
            </section>

            {reward ? (
              <ActionSheet
                footer={
                  <Button variant="gold" size="lg" full onClick={() => goTo(5)} trailingIcon={<ArrowRight className="w-5 h-5 rtl:rotate-180" />}>
                    View my card
                  </Button>
                }
              >
                <dl className="rounded-[20px] bg-white shadow-lift divide-y divide-ink-100 text-[15px]">
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <dt className="text-ink-500 shrink-0">Name</dt>
                    <dd className="font-bold truncate" dir="auto">{reward.customer_name}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <dt className="text-ink-500 shrink-0">Phone number</dt>
                    <dd className="font-bold truncate" dir="ltr">{reward.customer_phone}</dd>
                  </div>
                </dl>
              </ActionSheet>
            ) : (
              <ActionSheet
                footer={
                  <Button
                    type="submit"
                    form="reward-form"
                    variant="gold"
                    size="lg"
                    full
                    loading={submitting}
                    trailingIcon={<ArrowRight className="w-5 h-5 rtl:rotate-180" />}
                  >
                    {submitting ? 'Creating your card...' : 'Create my card'}
                  </Button>
                }
              >
                <p className="text-[15px] text-ink-500 mb-4">
                  Enter your details to create your personal discount card for <bdi>{business.name}</bdi>.
                </p>
                <form id="reward-form" onSubmit={handleCreateCard} className="space-y-3.5 pb-4" noValidate>
                  <Field
                    id="customer-name"
                    label="Name"
                    required
                    icon={<User className="w-5 h-5" />}
                    error={formErrors.name}
                    type="text"
                    placeholder="e.g. Mohamed"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    autoComplete="name"
                    enterKeyHint="next"
                    onFocus={keepVisible}
                    inputClassName="scroll-mb-[180px] scroll-mt-[80px]"
                  />
                  <Field
                    id="customer-phone"
                    label="Phone number"
                    required
                    icon={<Phone className="w-5 h-5" />}
                    error={formErrors.phone}
                    type="tel"
                    placeholder="e.g. +212 672 692 764"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                    enterKeyHint="done"
                    onFocus={keepVisible}
                    inputClassName="scroll-mb-[180px] scroll-mt-[80px]"
                  />
                  {submitError && (
                    <div role="alert" className="p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-2xl text-sm font-semibold text-center">
                      {submitError}
                    </div>
                  )}
                </form>
              </ActionSheet>
            )}
          </>
        )}

        {/* ───────── 5 · REWARD CARD ───────── */}
        {step === 5 && reward && (
          <>
            <section key="s5" className={`flex-1 flex flex-col justify-center px-3 pt-1 pb-6 short:pb-3 ${revealCard ? '' : enter}`}>
              <div className="px-2 bv-rise" style={revealCard ? { animationDelay: '1900ms' } : undefined}>
                <span className="inline-flex items-center gap-2 text-eyebrow uppercase bv-glass px-3 py-2 rounded-full">
                  {used ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-ink-400" />
                      Used{reward.redeemed_at ? ` · ${formatDate(reward.redeemed_at)}` : ''}
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-success-500" />
                      {revealCard ? 'Card created' : 'Active · one use'}
                    </>
                  )}
                </span>
                <h1 className="mt-3 font-display text-display-md short:text-[26px]">
                  {used ? (
                    <>This card has <span className="italic font-black text-white/70">been used.</span></>
                  ) : (
                    <>Your reward <span className="text-gold italic font-black">is ready.</span></>
                  )}
                </h1>
              </div>

              <div className="relative mt-6 short:mt-4 mx-auto w-full max-w-[420px] short:max-w-[300px]">
                {revealCard ? (
                  <UnwrapReveal>
                    <Card3D radius={CARD_RADIUS}>
                      <RewardCard business={business} reward={reward} cardRef={cardRef} />
                    </Card3D>
                  </UnwrapReveal>
                ) : (
                  <div className="bv-rise">
                    <Card3D radius={CARD_RADIUS}>
                      <RewardCard business={business} reward={reward} cardRef={cardRef} />
                    </Card3D>
                  </div>
                )}
              </div>
            </section>

            <ActionSheet footer={<SaveCardButton business={business} reward={reward} variant={used ? 'dark' : 'gold'} />}>
              <p className="text-[15px] text-ink-500 mb-3">
                {used
                  ? `This card was redeemed${reward.redeemed_at ? ` on ${formatDate(reward.redeemed_at)}` : ''}. Each card can be used once.`
                  : <>Save this card and show it on your next visit to <bdi>{business.name}</bdi>.</>}
              </p>
              {!used && (
                <ol className="grid grid-cols-2 gap-2.5">
                  <li className="rounded-[18px] bg-white shadow-lift p-3">
                    <Download className="w-4 h-4 text-gold-600" />
                    <p className="text-[13px] font-semibold mt-1.5 leading-snug">Save the card to your photos</p>
                  </li>
                  <li className="rounded-[18px] bg-white shadow-lift p-3">
                    <Store className="w-4 h-4 text-gold-600" />
                    <p className="text-[13px] font-semibold mt-1.5 leading-snug">Show it at the counter next time</p>
                  </li>
                </ol>
              )}
            </ActionSheet>
          </>
        )}
      </div>
    </main>
  );
}

/** Keep a focused field visible above the on-screen keyboard and the sticky action bar. */
function keepVisible(e: React.FocusEvent<HTMLInputElement>) {
  const target = e.currentTarget;
  window.setTimeout(() => target.scrollIntoView({ block: 'end', behavior: 'smooth' }), 280);
}
