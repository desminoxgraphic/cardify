'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Gift, RefreshCw } from 'lucide-react';
import { Business, Reward } from '@/lib/types';
import { formatSerialNumber, formatDate } from '@/lib/utils';

export default function BusinessRewardsAdminPage() {
  const params = useParams();
  const id = params?.id as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'USED'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const resB = await fetch(`/api/admin/businesses/${id}`);
      const dataB = await resB.json();

      if (!resB.ok || !dataB.business) {
        setError('Business not found.');
        return;
      }

      setBusiness(dataB.business);

      // Fetch rewards for business
      const resR = await fetch(`/api/merchant/data?token=${encodeURIComponent(dataB.business.merchant_token)}`);
      const dataR = await resR.json();
      if (resR.ok && dataR.rewards) {
        setRewards(dataR.rewards);
      }
    } catch (err) {
      setError('An error occurred fetching reward history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const filteredRewards = useMemo(() => {
    if (filter === 'ALL') return rewards;
    return rewards.filter((r) => r.status === filter);
  }, [rewards, filter]);

  const handleMarkUsed = async (reward: Reward) => {
    if (reward.status !== 'ACTIVE' || !confirm(`Mark card #${formatSerialNumber(reward.serial_number)} as used? This cannot be undone.`)) return;
    setUpdatingId(reward.id);

    try {
      const res = await fetch(`/api/admin/rewards/${reward.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'USED' }),
      });

      if (res.ok) {
        const data = await res.json();
        setRewards((prev) =>
          prev.map((r) => (r.id === reward.id ? data.reward : r))
        );
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3 text-[#64748B]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
          <span className="text-sm font-medium">Loading store rewards...</span>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-md border border-[#E2E8F0] text-center">
          <h1 className="text-xl font-bold text-[#0F172A] mb-2">Error</h1>
          <p className="text-sm text-[#64748B]">{error || 'Store not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F8FAFC]">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 hover:bg-slate-100 rounded-xl transition-all text-[#0F172A]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-[#0F172A] leading-tight">
                {business.name} — Rewards
              </h1>
              <p className="text-xs text-[#64748B]">Sequence Serial Log & Overrides</p>
            </div>
          </div>

          <button
            onClick={fetchData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-xl transition-all"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* FILTER BAR */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === 'ALL'
                  ? 'bg-[#0F172A] text-white'
                  : 'text-[#64748B] hover:bg-slate-100'
              }`}
            >
              All ({rewards.length})
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === 'ACTIVE'
                  ? 'bg-[#16A34A] text-white'
                  : 'text-[#64748B] hover:bg-slate-100'
              }`}
            >
              Active ({rewards.filter((r) => r.status === 'ACTIVE').length})
            </button>
            <button
              onClick={() => setFilter('USED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === 'USED'
                  ? 'bg-[#DC2626] text-white'
                  : 'text-[#64748B] hover:bg-slate-100'
              }`}
            >
              Used ({rewards.filter((r) => r.status === 'USED').length})
            </button>
          </div>
        </div>

        {/* REWARDS TABLE / CARDS */}
        <div className="space-y-3">
          {filteredRewards.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-[#E2E8F0] text-center text-[#64748B]">
              <Gift className="w-12 h-12 text-[#64748B] mx-auto opacity-40 mb-2" />
              <p className="text-base font-bold text-[#0F172A]">No rewards found</p>
              <p className="text-xs text-[#64748B]">No customer rewards generated matching this filter.</p>
            </div>
          ) : (
            filteredRewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-white rounded-2xl p-4 border border-[#E2E8F0] flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono font-extrabold text-sm border ${
                      reward.status === 'USED'
                        ? 'bg-red-50 text-[#DC2626] border-red-200'
                        : 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                    }`}
                  >
                    <span className="text-[9px] font-sans font-semibold tracking-tighter opacity-70">
                      NO.
                    </span>
                    <span>#{formatSerialNumber(reward.serial_number)}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-[#0F172A] text-base leading-tight">
                      {reward.customer_name}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                      {reward.customer_phone}
                    </p>
                    <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-3">
                      <span>Created: {formatDate(reward.created_at)}</span>
                      {reward.redeemed_at && (
                        <span className="text-[#DC2626] font-semibold">
                          Redeemed: {formatDate(reward.redeemed_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleMarkUsed(reward)}
                    disabled={updatingId === reward.id || reward.status === 'USED'}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      reward.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-[#16A34A] border-emerald-200 hover:bg-emerald-100'
                        : 'bg-red-50 text-[#DC2626] border-red-200 hover:bg-red-100'
                    }`}
                    title={reward.status === 'ACTIVE' ? 'Mark reward as used' : 'Used rewards cannot be reactivated'}
                  >
                    {updatingId === reward.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>{reward.status}</span>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
