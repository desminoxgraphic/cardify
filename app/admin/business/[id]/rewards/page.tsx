'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Gift, RefreshCw, AlertCircle } from 'lucide-react';
import { AdminShell, adminCard, adminSecondaryButton } from '@/components/admin/AdminShell';
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

  const refreshButton = (
    <button onClick={fetchData} className={adminSecondaryButton} title="Refresh List">
      <RefreshCw className="w-4 h-4" />
      <span>Refresh</span>
    </button>
  );

  if (loading) {
    return (
      <AdminShell title="Rewards" backHref="/admin">
        <div className={`${adminCard} p-4 space-y-3`} aria-busy="true">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-[#64748B]">
          <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" /> Loading store rewards...
        </p>
      </AdminShell>
    );
  }

  if (error || !business) {
    return (
      <AdminShell title="Error" backHref="/admin">
        <div className={`${adminCard} p-10 text-center`}>
          <div className="mx-auto w-16 h-16 rounded-[20px] bg-red-50 text-[#DC2626] flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <p className="mt-4 text-sm text-[#64748B]">{error || 'Store not found.'}</p>
          <Link href="/admin" className={`${adminSecondaryButton} mt-6`}>Back to businesses</Link>
        </div>
      </AdminShell>
    );
  }

  const filters: { key: 'ALL' | 'ACTIVE' | 'USED'; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: rewards.length },
    { key: 'ACTIVE', label: 'Active', count: rewards.filter((r) => r.status === 'ACTIVE').length },
    { key: 'USED', label: 'Used', count: rewards.filter((r) => r.status === 'USED').length },
  ];

  const statusButton = (reward: Reward) => (
    <button
      onClick={() => handleMarkUsed(reward)}
      disabled={updatingId === reward.id || reward.status === 'USED'}
      className={`min-h-[36px] px-3 rounded-full text-xs font-bold border transition-colors inline-flex items-center gap-1.5 shrink-0 ${
        reward.status === 'ACTIVE'
          ? 'bg-emerald-50 text-[#15803D] border-emerald-200 hover:bg-emerald-100'
          : 'bg-slate-100 text-[#64748B] border-[#E2E8F0] cursor-default'
      }`}
      title={reward.status === 'ACTIVE' ? 'Mark reward as used' : 'Used rewards cannot be reactivated'}
    >
      {updatingId === reward.id ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <>
          <span className={`w-1.5 h-1.5 rounded-full ${reward.status === 'ACTIVE' ? 'bg-[#16A34A]' : 'bg-[#94A3B8]'}`} />
          <span>{reward.status}</span>
        </>
      )}
    </button>
  );

  return (
    <AdminShell title={`${business.name} — Rewards`} subtitle="Every reward card issued for this store." backHref="/admin" actions={refreshButton}>
      {/* FILTER BAR */}
      <div className="inline-flex p-1 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm mb-5" role="tablist" aria-label="Filter rewards">
        {filters.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`min-h-[40px] px-4 rounded-xl text-sm font-bold transition-all ${
              filter === f.key ? 'bg-[#0B1120] text-white shadow-[0_2px_0_rgba(0,0,0,0.3)]' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {f.label} <span className="opacity-60 tabular-nums">({f.count})</span>
          </button>
        ))}
      </div>

      {filteredRewards.length === 0 ? (
        <div className={`${adminCard} p-12 text-center`}>
          <div className="mx-auto w-16 h-16 rounded-[20px] bg-gradient-to-b from-blue-50 to-blue-100 text-[#2563EB] flex items-center justify-center">
            <Gift className="w-7 h-7" />
          </div>
          <p className="mt-4 text-base font-extrabold">No rewards found</p>
          <p className="text-sm text-[#64748B] mt-1">No customer rewards generated matching this filter.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className={`${adminCard} hidden md:block overflow-hidden`}>
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="text-start font-bold px-5 py-3">Card</th>
                  <th className="text-start font-bold px-5 py-3">Customer</th>
                  <th className="text-start font-bold px-5 py-3">Phone</th>
                  <th className="text-start font-bold px-5 py-3">Created</th>
                  <th className="text-start font-bold px-5 py-3">Redeemed</th>
                  <th className="text-end font-bold px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredRewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5 font-mono font-extrabold">#{formatSerialNumber(reward.serial_number)}</td>
                    <td className="px-5 py-3.5 font-bold">{reward.customer_name}</td>
                    <td className="px-5 py-3.5 text-[#475569]">{reward.customer_phone}</td>
                    <td className="px-5 py-3.5 text-[#475569]">{formatDate(reward.created_at)}</td>
                    <td className="px-5 py-3.5 text-[#475569]">{reward.redeemed_at ? formatDate(reward.redeemed_at) : '—'}</td>
                    <td className="px-5 py-3.5 text-end">{statusButton(reward)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="md:hidden space-y-2.5">
            {filteredRewards.map((reward) => (
              <li key={reward.id} className="bv-tile3d bg-white rounded-[20px] border border-[#E2E8F0] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm shrink-0 ${reward.status === 'USED' ? 'bg-slate-100 text-[#64748B]' : 'bg-blue-50 text-[#1D4ED8]'}`}>
                      #{formatSerialNumber(reward.serial_number)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{reward.customer_name}</p>
                      <p className="text-xs text-[#64748B] truncate">{reward.customer_phone}</p>
                    </div>
                  </div>
                  {statusButton(reward)}
                </div>
                <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B]">
                  <span>Created: {formatDate(reward.created_at)}</span>
                  {reward.redeemed_at && <span>Redeemed: {formatDate(reward.redeemed_at)}</span>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminShell>
  );
}
