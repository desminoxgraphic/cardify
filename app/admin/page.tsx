'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Business } from '@/lib/types';
import {
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  Copy,
  Check,
  Power,
  Store,
  LogOut,
  Gift,
  Loader2,
} from 'lucide-react';

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

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3 text-[#64748B]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
          <span className="text-sm font-medium">Loading admin panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F8FAFC]">
      {/* ADMIN HEADER */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-black text-lg">
              C
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0F172A] leading-tight">CARDIFY Admin</h1>
              <p className="text-xs text-[#64748B]">Businesses & NFC Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/business/new"
              className="bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl shadow transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Business</span>
            </Link>

            <button
              onClick={handleLogout}
              className="bg-slate-100 hover:bg-slate-200 text-[#0F172A] p-2 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">
              Local Businesses ({businesses.length})
            </h2>
            <p className="text-sm text-[#64748B]">
              Manage registered local stores, custom URLs, and rewards.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-[#DC2626] rounded-2xl text-sm font-semibold">
            {error}
          </div>
        )}

        {!error && businesses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-[#E2E8F0] text-center space-y-4">
            <Store className="w-12 h-12 text-[#64748B] mx-auto opacity-50" />
            <h3 className="text-lg font-bold text-[#0F172A]">No businesses added yet</h3>
            <p className="text-sm text-[#64748B]">Add your first local store to start creating NFC links.</p>
            <Link
              href="/admin/business/new"
              className="inline-flex items-center gap-2 bg-[#2563EB] text-white font-semibold py-2.5 px-5 rounded-xl shadow"
            >
              <Plus className="w-4 h-4" /> Add New Business
            </Link>
          </div>
        ) : !error ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {businesses.map((b) => {
              const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/s/${b.slug}` : `/s/${b.slug}`;
              const merchantUrl = typeof window !== 'undefined' ? `${window.location.origin}/m/${b.merchant_token}` : `/m/${b.merchant_token}`;

              return (
                <div
                  key={b.id}
                  className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-between space-y-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                    !b.is_active ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-[#E2E8F0]'
                  }`}
                >
                  {/* TOP HEADER ROW */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-12 h-12 rounded-2xl p-1 flex items-center justify-center overflow-hidden border shadow-sm"
                        style={{ borderColor: b.primary_color || '#2563EB' }}
                      >
                        {b.logo_url ? (
                          <Image
                            src={b.logo_url}
                            alt={b.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-contain rounded-xl"
                          />
                        ) : (
                          <span className="font-bold text-lg text-[#2563EB]">
                            {b.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-extrabold text-[#0F172A] leading-tight">
                          {b.name}
                        </h3>
                        <p className="text-xs text-[#64748B] font-mono mt-0.5">/s/{b.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleActive(b)}
                        className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                          b.is_active
                            ? 'bg-emerald-50 text-[#16A34A] border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-[#DC2626] border-red-200 hover:bg-red-100'
                        }`}
                        title={b.is_active ? 'Click to Disable' : 'Click to Enable'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{b.is_active ? 'Active' : 'Disabled'}</span>
                      </button>
                    </div>
                  </div>

                  {/* STATS BADGES */}
                  <div className="grid grid-cols-3 gap-2 bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0] text-center">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#64748B]">Total</div>
                      <div className="text-base font-extrabold text-[#0F172A]">
                        {b.stats?.total || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#16A34A]">Active</div>
                      <div className="text-base font-extrabold text-[#16A34A]">
                        {b.stats?.active || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#DC2626]">Used</div>
                      <div className="text-base font-extrabold text-[#DC2626]">
                        {b.stats?.used || 0}
                      </div>
                    </div>
                  </div>

                  {/* LINKS & URL COPIERS */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="truncate mr-2">
                        <span className="font-bold text-[#0F172A]">NFC URL: </span>
                        <span className="text-[#64748B] font-mono">{publicUrl}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopy(publicUrl, `pub_${b.id}`)}
                          className="p-1.5 hover:bg-white rounded-lg border border-slate-300 transition-all text-[#0F172A]"
                          title="Copy Public NFC URL"
                        >
                          {copiedLink === `pub_${b.id}` ? (
                            <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`/s/${b.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 hover:bg-white rounded-lg border border-slate-300 transition-all text-[#2563EB]"
                          title="Open Public Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="truncate mr-2">
                        <span className="font-bold text-[#0F172A]">Merchant Link: </span>
                        <span className="text-[#64748B] font-mono">/m/{b.merchant_token.substring(0, 10)}...</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopy(merchantUrl, `mer_${b.id}`)}
                          className="p-1.5 hover:bg-white rounded-lg border border-slate-300 transition-all text-[#0F172A]"
                          title="Copy Merchant Link"
                        >
                          {copiedLink === `mer_${b.id}` ? (
                            <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`/m/${b.merchant_token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 hover:bg-white rounded-lg border border-slate-300 transition-all text-[#0F172A]"
                          title="Open Merchant Portal"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTION BUTTONS */}
                  <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                    <Link
                      href={`/admin/business/${b.id}/rewards`}
                      className="bg-slate-100 hover:bg-slate-200 text-[#0F172A] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Gift className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>View Rewards</span>
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/business/${b.id}`}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-xl transition-all"
                        title="Edit Business"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDelete(b)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-[#DC2626] rounded-xl transition-all border border-red-200"
                        title="Delete Business"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </main>
    </div>
  );
}
