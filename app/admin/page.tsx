'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Business } from '@/lib/types';
import {
  Plus,
  ExternalLink,
  Pencil,
  Trash2,
  Copy,
  Check,
  Power,
  Store,
  Gift,
} from 'lucide-react';
import { AdminShell, AdminLoading, adminCard, adminPrimaryButton, adminSecondaryButton } from '@/components/admin/AdminShell';
import { getBrandTheme } from '@/lib/brand-theme';

interface BusinessWithStats extends Business {
  stats?: {
    total: number;
    active: number;
    used: number;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/businesses');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to fetch businesses');
        return;
      }
      setBusinesses(data.businesses || []);
    } catch (err) {
      setError('An error occurred loading admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleToggleActive = async (b: BusinessWithStats) => {
    try {
      const res = await fetch(`/api/admin/businesses/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !b.is_active }),
      });
      if (res.ok) {
        fetchBusinesses();
      }
    } catch (err) {
      console.error('Toggle active failed:', err);
    }
  };

  const handleDelete = async (b: BusinessWithStats) => {
    if (!confirm(`Are you sure you want to delete "${b.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/businesses/${b.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchBusinesses();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const addButton = (
    <Link href="/admin/business/new" className={adminPrimaryButton}>
      <Plus className="w-4 h-4" />
      <span>Add Business</span>
    </Link>
  );

  if (loading) {
    return (
      <AdminShell title="Businesses" subtitle="Manage registered local stores, custom URLs, and rewards." actions={addButton}>
        <AdminLoading label="Loading admin panel..." />
      </AdminShell>
    );
  }

  const totals = businesses.reduce(
    (acc, b) => ({
      active: acc.active + (b.is_active ? 1 : 0),
      rewards: acc.rewards + (b.stats?.total || 0),
      redeemed: acc.redeemed + (b.stats?.used || 0),
    }),
    { active: 0, rewards: 0, redeemed: 0 }
  );

  return (
    <AdminShell
      title={`Local Businesses (${businesses.length})`}
      subtitle="Manage registered local stores, custom URLs, and rewards."
      actions={addButton}
    >
      {error && (
        <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 text-[#DC2626] rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {!error && businesses.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Businesses', value: businesses.length, icon: Store, tone: 'text-[#2563EB] bg-blue-50' },
            { label: 'Active', value: totals.active, icon: Power, tone: 'text-[#16A34A] bg-emerald-50' },
            { label: 'Rewards created', value: totals.rewards, icon: Gift, tone: 'text-[#7C3AED] bg-violet-50' },
            { label: 'Redeemed', value: totals.redeemed, icon: Check, tone: 'text-[#EA580C] bg-orange-50' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className={`${adminCard} p-4`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">{label}</span>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <p className="text-[28px] font-extrabold tracking-tight mt-1 tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      )}

      {!error && businesses.length === 0 ? (
        <div className={`${adminCard} p-10 sm:p-14 text-center`}>
          <div className="mx-auto w-20 h-20 rounded-[24px] bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center shadow-[0_3px_0_rgba(37,99,235,0.15)]">
            <Store className="w-9 h-9 text-[#2563EB]" strokeWidth={1.6} />
          </div>
          <h3 className="mt-5 text-xl font-extrabold">No businesses added yet</h3>
          <p className="mt-1.5 text-sm text-[#64748B]">Add your first local store to start creating NFC links.</p>
          <Link href="/admin/business/new" className={`${adminPrimaryButton} mt-6`}>
            <Plus className="w-4 h-4" /> Add New Business
          </Link>
        </div>
      ) : !error ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {businesses.map((b) => {
            const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/s/${b.slug}` : `/s/${b.slug}`;
            const merchantUrl = typeof window !== 'undefined' ? `${window.location.origin}/m/${b.merchant_token}` : `/m/${b.merchant_token}`;
            const theme = getBrandTheme(b.primary_color);

            return (
              <article
                key={b.id}
                className={`${adminCard} overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-24px_rgba(15,23,42,0.35)] ${!b.is_active ? 'opacity-75' : ''}`}
              >
                {/* Brand band */}
                <div
                  className="relative h-20 overflow-hidden"
                  style={{ background: b.is_active ? `linear-gradient(140deg, ${theme.deep}, ${theme.dark})` : 'linear-gradient(140deg, #94A3B8, #475569)' }}
                >
                  <svg aria-hidden className="absolute -right-10 -top-14 w-48 h-48 opacity-20" viewBox="0 0 200 200" fill="none" stroke="white" strokeWidth="2">
                    {[40, 65, 90].map((r) => <circle key={r} cx="100" cy="100" r={r} />)}
                  </svg>
                  <button
                    onClick={() => handleToggleActive(b)}
                    className="absolute top-3 end-3 bv-glass min-h-[32px] px-3 rounded-full text-xs font-bold text-white flex items-center gap-1.5 hover:bg-white/25 transition-colors"
                    title={b.is_active ? 'Click to Disable' : 'Click to Enable'}
                  >
                    <span className={`w-2 h-2 rounded-full ${b.is_active ? 'bg-[#4ADE80]' : 'bg-white/60'}`} />
                    {b.is_active ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <div className="relative px-5 pb-5 -mt-8 flex-1 flex flex-col">
                  <div className="flex items-end gap-3">
                    <div className="w-16 h-16 rounded-[20px] bg-gradient-to-b from-white to-slate-100 p-1 shadow-[0_3px_0_rgba(15,23,42,0.08),0_12px_24px_-12px_rgba(15,23,42,0.45)] ring-4 ring-white overflow-hidden shrink-0 flex items-center justify-center">
                      {b.logo_url ? (
                        <Image src={b.logo_url} alt={b.name} width={64} height={64} className="w-full h-full object-contain rounded-[16px]" />
                      ) : (
                        <span className="w-full h-full rounded-[16px] flex items-center justify-center font-extrabold text-xl text-white" style={{ background: theme.deep }}>
                          {b.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 pb-0.5">
                      <h3 className="text-lg font-extrabold leading-tight truncate">{b.name}</h3>
                      <p className="text-xs text-[#64748B] font-mono truncate">/s/{b.slug}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <dl className="mt-4 grid grid-cols-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] divide-x divide-[#E2E8F0] text-center rtl:divide-x-reverse">
                    {[
                      ['Total', b.stats?.total || 0, 'text-[#0F172A]'],
                      ['Active', b.stats?.active || 0, 'text-[#16A34A]'],
                      ['Used', b.stats?.used || 0, 'text-[#64748B]'],
                    ].map(([label, value, tone]) => (
                      <div key={label as string} className="py-2.5">
                        <dt className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">{label}</dt>
                        <dd className={`text-lg font-extrabold tabular-nums ${tone}`}>{value}</dd>
                      </div>
                    ))}
                  </dl>

                  {/* Links */}
                  <div className="mt-4 space-y-2">
                    {[
                      { key: `pub_${b.id}`, label: 'NFC URL', display: publicUrl, copy: publicUrl, href: `/s/${b.slug}`, copyTitle: 'Copy Public NFC URL', openTitle: 'Open Public Page' },
                      { key: `mer_${b.id}`, label: 'Merchant Link', display: `/m/${b.merchant_token.substring(0, 10)}...`, copy: merchantUrl, href: `/m/${b.merchant_token}`, copyTitle: 'Copy Merchant Link', openTitle: 'Open Merchant Portal' },
                    ].map((link) => (
                      <div key={link.key} className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] ps-3 pe-1.5 py-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{link.label}</p>
                          <p className="text-xs font-mono text-[#0F172A] truncate">{link.display}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(link.copy, link.key)}
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-[#0F172A] hover:bg-slate-100 transition-colors"
                          title={link.copyTitle}
                          aria-label={link.copyTitle}
                        >
                          {copiedLink === link.key ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-[#2563EB] hover:bg-blue-50 transition-colors"
                          title={link.openTitle}
                          aria-label={link.openTitle}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-4 flex items-center gap-2">
                    <Link href={`/admin/business/${b.id}/rewards`} className={`${adminSecondaryButton} flex-1`}>
                      <Gift className="w-4 h-4 text-[#2563EB]" />
                      <span>View Rewards</span>
                    </Link>
                    <Link href={`/admin/business/${b.id}`} className={`${adminSecondaryButton} w-11 px-0`} title="Edit Business" aria-label="Edit Business">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(b)}
                      className="w-11 min-h-[44px] rounded-xl flex items-center justify-center text-[#DC2626] bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                      title="Delete Business"
                      aria-label="Delete Business"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </AdminShell>
  );
}
