'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Loader2, Palette, Link2, Store, Sparkles } from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { RewardPreviewCard } from '@/components/RewardPreviewCard';
import { Card3D } from '@/components/Card3D';
import { adminCard, adminInput, adminLabel, adminPrimaryButton, adminSecondaryButton } from './AdminShell';

type Setter = (value: string) => void;

export interface BusinessFormProps {
  mode: 'new' | 'edit';
  businessId: string;
  error: string | null;
  busy: boolean;
  saved: boolean;
  onSubmit: (e: React.FormEvent) => void;
  values: {
    name: string;
    slug: string;
    logoUrl: string;
    coverUrl: string;
    primaryColor: string;
    googleReviewUrl: string;
    shareUrl: string;
    shareMessage: string;
    discountPercentage: string;
    phone: string;
    isActive: boolean;
  };
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setters: {
    setSlug: Setter;
    setLogoUrl: Setter;
    setCoverUrl: Setter;
    setPrimaryColor: Setter;
    setGoogleReviewUrl: Setter;
    setShareUrl: Setter;
    setShareMessage: Setter;
    setDiscountPercentage: Setter;
    setPhone: Setter;
    setIsActive: (value: boolean) => void;
  };
}

function Section({ index, title, icon, children }: { index: number; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={`${adminCard} p-5 sm:p-6`}>
      <div className="flex items-center gap-3 mb-5">
        <span className="w-9 h-9 rounded-xl bg-gradient-to-b from-gold-50 to-gold-100 text-gold-700 flex items-center justify-center shadow-[0_2px_0_rgba(229,168,35,0.18)]">{icon}</span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">Step {index}</p>
          <h2 className="text-base font-extrabold leading-tight">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

export function BusinessForm({ mode, businessId, error, busy, saved, onSubmit, values, onNameChange, setters }: BusinessFormProps) {
  const isNew = mode === 'new';
  const initials = (() => {
    const parts = values.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return values.name.substring(0, 2).toUpperCase() || 'AB';
  })();

  return (
    <>
      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-5">
          {error && (
            <div role="alert" className="p-4 bg-red-50 border border-red-200 text-danger-600 rounded-2xl text-sm font-semibold">
              {error}
            </div>
          )}

          <Section index={1} title="Business" icon={<Store className="w-[18px] h-[18px]" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bf-name" className={adminLabel}>
                  Business Name <span className="text-danger-600">*</span>
                </label>
                <input id="bf-name" type="text" placeholder={isNew ? 'e.g. Hola Beauty' : undefined} value={values.name} onChange={onNameChange} required className={adminInput} />
              </div>
              <div>
                <label htmlFor="bf-slug" className={adminLabel}>
                  Public Slug <span className="text-danger-600">*</span>
                </label>
                <input id="bf-slug" type="text" placeholder={isNew ? 'e.g. hola-beauty' : undefined} value={values.slug} onChange={(e) => setters.setSlug(e.target.value)} required className={`${adminInput} font-mono`} />
                <p className="text-xs text-ink-500 mt-1.5">URL: /s/{values.slug || (isNew ? 'slug' : '')}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-5 pt-5 border-t border-ink-200">
              <div>
                <span className="text-sm font-bold">Business Status</span>
                <p className="text-xs text-ink-500">{isNew ? 'When active, customer NFC links will work.' : 'Toggle store active/disabled status.'}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={values.isActive}
                onClick={() => setters.setIsActive(!values.isActive)}
                className={`relative inline-flex items-center gap-2 min-h-[40px] ps-1 pe-3.5 rounded-full text-xs font-bold transition-colors border ${
                  values.isActive ? 'bg-emerald-50 text-success-700 border-emerald-200' : 'bg-slate-100 text-ink-500 border-ink-200'
                }`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${values.isActive ? 'bg-[#16A34A] text-white' : 'bg-white text-ink-400'}`}>
                  <Check className="w-4 h-4" />
                </span>
                {values.isActive ? 'ACTIVE' : 'DISABLED'}
              </button>
            </div>
          </Section>

          <Section index={2} title="Branding" icon={<Palette className="w-[18px] h-[18px]" />}>
            <label htmlFor="bf-color" className={adminLabel}>Primary Color</label>
            <div className="flex items-center gap-3 max-w-xs">
              <input id="bf-color" type="color" value={values.primaryColor} onChange={(e) => setters.setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-xl border border-ink-200 cursor-pointer p-1 bg-white" />
              <input type="text" aria-label="Primary color hex" value={values.primaryColor} onChange={(e) => setters.setPrimaryColor(e.target.value)} className={`${adminInput} font-mono`} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <ImageUploader
                label="Business Logo"
                value={values.logoUrl}
                onChange={(url) => setters.setLogoUrl(url)}
                onRemove={() => setters.setLogoUrl('')}
                placeholder="PNG, JPG or WEBP logo"
                aspect="square"
                kind="logo"
                businessId={businessId}
              />
              <ImageUploader
                label="Store / Cover Image (Optional)"
                value={values.coverUrl}
                onChange={(url) => setters.setCoverUrl(url)}
                onRemove={() => setters.setCoverUrl('')}
                placeholder="Optional store banner"
                aspect="wide"
                kind="cover"
                businessId={businessId}
              />
            </div>
          </Section>

          <Section index={3} title="Customer Journey" icon={<Sparkles className="w-[18px] h-[18px]" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="bf-discount" className={adminLabel}>Discount (%)</label>
                <input id="bf-discount" type="number" min="1" max="100" value={values.discountPercentage} onChange={(e) => setters.setDiscountPercentage(e.target.value)} required className={adminInput} />
              </div>
              <div>
                <label htmlFor="bf-phone" className={adminLabel}>Store Phone</label>
                <input id="bf-phone" type="text" placeholder={isNew ? 'e.g. +212 672 692 764' : undefined} value={values.phone} onChange={(e) => setters.setPhone(e.target.value)} className={adminInput} />
              </div>
              <div>
                <label htmlFor="bf-share-msg" className={adminLabel}>Share Message</label>
                <input id="bf-share-msg" type="text" placeholder={isNew ? 'Check out Hola Beauty 👋' : undefined} value={values.shareMessage} onChange={(e) => setters.setShareMessage(e.target.value)} className={adminInput} />
              </div>
            </div>
          </Section>

          <Section index={4} title="Links" icon={<Link2 className="w-[18px] h-[18px]" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bf-google" className={adminLabel}>Google Review URL</label>
                <input id="bf-google" type="url" placeholder={isNew ? 'https://g.page/r/your-store-id/review' : undefined} value={values.googleReviewUrl} onChange={(e) => setters.setGoogleReviewUrl(e.target.value)} className={adminInput} />
              </div>
              <div>
                <label htmlFor="bf-share-url" className={adminLabel}>{isNew ? 'Custom Share URL (Optional)' : 'Custom Share URL'}</label>
                <input id="bf-share-url" type="text" placeholder={isNew ? 'Defaults to store URL' : undefined} value={values.shareUrl} onChange={(e) => setters.setShareUrl(e.target.value)} className={adminInput} />
              </div>
            </div>
          </Section>

          <div className="flex gap-3 sticky bottom-0 lg:static -mx-4 sm:mx-0 px-4 sm:px-0 py-3 lg:py-0 bg-ivory-100/90 backdrop-blur lg:bg-transparent">
            <Link href="/admin" className={`${adminSecondaryButton} flex-1 min-h-[52px]`}>Cancel</Link>
            <button type="submit" disabled={busy || saved} className={`${adminPrimaryButton} flex-1 min-h-[52px]`}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{isNew ? 'Save Business' : 'Update Business'}</span>}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <aside className="lg:sticky lg:top-10 order-first lg:order-none">
          <div className="rounded-[24px] p-5 bg-ink-950 text-white overflow-hidden relative">
            <div aria-hidden className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gold-400/25 blur-3xl" />
            <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Live preview</p>
            <p className="relative text-sm font-semibold text-white/85 mt-0.5">Customer reward card</p>
            <div className="relative mt-5 mb-3">
              <Card3D>
                <RewardPreviewCard
                  businessName={values.name || 'Business name'}
                  logoUrl={values.logoUrl || null}
                  initials={initials}
                  color={values.primaryColor}
                  discount={parseInt(values.discountPercentage, 10) || 0}
                  holderName=""
                />
              </Card3D>
            </div>
          </div>
        </aside>
      </form>

      {/* SAVED SUCCESS OVERLAY */}
      {saved && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[28px] px-10 py-9 shadow-2xl text-center animate-scaleUp max-w-[320px] w-full">
            <div className="w-16 h-16 bg-gradient-to-b from-emerald-50 to-emerald-100 border border-emerald-200 text-success-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_3px_0_rgba(22,163,74,0.2)]">
              <Check className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-extrabold text-ink-950">Saved successfully ✓</h2>
            <p className="text-xs text-ink-500 mt-1.5">{values.name.trim() || (isNew ? 'New business' : 'Business')}</p>
          </div>
        </div>
      )}
    </>
  );
}
