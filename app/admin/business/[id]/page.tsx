'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Business } from '@/lib/types';
import { AdminShell } from '@/components/admin/AdminShell';
import { BusinessForm } from '@/components/admin/BusinessForm';

export default function EditBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    if (!id) return;

    async function fetchBusiness() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/businesses/${id}`);
        const data = await res.json();

        if (!res.ok || !data.business) {
          setError(data.error || 'Business not found.');
          return;
        }

        const b: Business = data.business;
        setName(b.name);
        setSlug(b.slug);
        setLogoUrl(b.logo_url || '');
        setCoverUrl(b.cover_image_url || '');
        setPrimaryColor(b.primary_color || '#2563EB');
        setGoogleReviewUrl(b.google_review_url || '');
        setShareUrl(b.share_url || '');
        setShareMessage(b.share_message || '');
        setDiscountPercentage(b.discount_percentage.toString());
        setPhone(b.phone || '');
        setIsActive(b.is_active);
      } catch (err) {
        setError('Failed to fetch business details.');
      } finally {
        setLoading(false);
      }
    }

    fetchBusiness();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          logo_url: logoUrl.trim(),
          cover_image_url: coverUrl.trim(),
          primary_color: primaryColor,
          google_review_url: googleReviewUrl.trim(),
          share_url: shareUrl.trim(),
          share_message: shareMessage.trim(),
          discount_percentage: parseInt(discountPercentage, 10) || 10,
          phone: phone.trim(),
          is_active: isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update business.');
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setSaved(true);
      window.setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 1000);
    } catch (err) {
      setError('An error occurred updating business.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminShell title="Edit Business" backHref="/admin">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6" aria-busy="true">
          <div className="space-y-5">
            {[0, 1, 2].map((i) => <div key={i} className="h-48 rounded-[24px] bg-white border border-ink-200 animate-pulse" />)}
          </div>
          <div className="h-64 rounded-[24px] bg-slate-300 animate-pulse" />
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-ink-500">
          <Loader2 className="w-4 h-4 animate-spin text-gold-700" /> Loading business details...
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={`Edit ${name}`} subtitle="Update branding, links and the customer reward." backHref="/admin">
      <BusinessForm
        mode="edit"
        businessId={id}
        busy={submitting}
        onNameChange={(e) => setName(e.target.value)}
        error={error}
        saved={saved}
        onSubmit={handleSubmit}
        values={{ name, slug, logoUrl, coverUrl, primaryColor, googleReviewUrl, shareUrl, shareMessage, discountPercentage, phone, isActive }}
        setters={{ setSlug, setLogoUrl, setCoverUrl, setPrimaryColor, setGoogleReviewUrl, setShareUrl, setShareMessage, setDiscountPercentage, setPhone, setIsActive }}
      />
    </AdminShell>
  );
}
