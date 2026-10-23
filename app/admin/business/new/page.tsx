'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { BusinessForm } from '@/components/admin/BusinessForm';

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
    <AdminShell title="Add New Business" subtitle="Create a store page, NFC link and reward card." backHref="/admin">
      <BusinessForm
        mode="new"
        businessId={uploadBusinessId}
        busy={loading}
        onNameChange={handleNameChange}
        error={error}
        saved={saved}
        onSubmit={handleSubmit}
        values={{ name, slug, logoUrl, coverUrl, primaryColor, googleReviewUrl, shareUrl, shareMessage, discountPercentage, phone, isActive }}
        setters={{ setSlug, setLogoUrl, setCoverUrl, setPrimaryColor, setGoogleReviewUrl, setShareUrl, setShareMessage, setDiscountPercentage, setPhone, setIsActive }}
      />
    </AdminShell>
  );
}
