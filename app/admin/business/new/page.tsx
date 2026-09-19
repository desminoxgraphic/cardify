'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';

export default function NewBusinessPage() {
  const router = useRouter();
  const [uploadBusinessId] = useState(() => crypto.randomUUID());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('10');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Auto slugify name if slug not manually edited
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uploadBusinessId,
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          logo_url: logoUrl.trim(),
          cover_image_url: coverUrl.trim(),
          primary_color: primaryColor,
          google_review_url: googleReviewUrl.trim(),
          share_url: shareUrl.trim() || (typeof window !== 'undefined' ? `${window.location.origin}/s/${slug.trim().toLowerCase()}` : ''),
          share_message: shareMessage.trim() || `Check out ${name}! 👋 Get 10% off your next visit!`,
          discount_percentage: parseInt(discountPercentage, 10) || 10,
          phone: phone.trim(),
          is_active: isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.business) {
        setError(data.error || 'Failed to create business.');
        setLoading(false);
        return;
      }

      setLoading(false);
      setSaved(true);
      window.setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 1000);
    } catch (err) {
      setError('An error occurred while creating business.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#F8FAFC]">
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-[#0F172A]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-[#0F172A]">Add New Business</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-[#E2E8F0] space-y-7">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-[#DC2626] rounded-2xl text-sm font-semibold">
              {error}
            </div>
          )}

          {/* BUSINESS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center text-xs font-black">1</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">Business</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">
                  Business Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hola Beauty"
                  value={name}
                  onChange={handleNameChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">
                  Public Slug <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. hola-beauty"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                />
                <p className="text-[11px] text-[#64748B] mt-1">URL: /s/{slug || 'slug'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <div>
                <span className="text-sm font-bold text-[#0F172A]">Business Status</span>
                <p className="text-xs text-[#64748B]">When active, customer NFC links will work.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                    : 'bg-red-50 text-[#DC2626] border-red-200'
                }`}
              >
                {isActive ? 'ACTIVE' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* BRANDING */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center text-xs font-black">2</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">Branding</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1.5">
                Primary Color
              </label>
              <div className="flex items-center gap-3 max-w-xs">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-11 h-11 rounded-xl border border-[#E2E8F0] cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-mono text-[#0F172A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUploader
                label="Business Logo"
                value={logoUrl}
                onChange={(url) => setLogoUrl(url)}
                onRemove={() => setLogoUrl('')}
                placeholder="PNG, JPG or WEBP logo"
                aspect="square"
                kind="logo"
                businessId={uploadBusinessId}
              />

              <ImageUploader
                label="Store / Cover Image (Optional)"
                value={coverUrl}
                onChange={(url) => setCoverUrl(url)}
                onRemove={() => setCoverUrl('')}
                placeholder="Optional store banner"
                aspect="wide"
                kind="cover"
                businessId={uploadBusinessId}
              />
            </div>
          </div>

          {/* CUSTOMER JOURNEY */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center text-xs font-black">3</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">Customer Journey</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">
                  Store Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. +212 672 692 764"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">
                  Share Message
                </label>
                <input
                  type="text"
                  placeholder="Check out Hola Beauty 👋"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                />
              </div>
            </div>
          </div>

          {/* LINKS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center text-xs font-black">4</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">Links</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">
                  Google Review URL
                </label>
                <input
                  type="url"
                  placeholder="https://g.page/r/your-store-id/review"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">
                  Custom Share URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Defaults to store URL"
                  value={shareUrl}
                  onChange={(e) => setShareUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/admin"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-semibold py-3 px-4 rounded-xl text-center text-sm transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || saved}
              className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Business</span>}
            </button>
          </div>
        </form>
      </main>

      {/* SAVED SUCCESS OVERLAY */}
      {saved && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl px-10 py-9 shadow-2xl text-center animate-scaleUp max-w-[320px] w-full">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-extrabold text-[#0F172A]">Saved successfully ✓</h2>
            <p className="text-xs text-[#64748B] mt-1.5">{name.trim() || 'New business'}</p>
          </div>
        </div>
      )}
    </div>
  );
}