'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Business, Reward } from '@/lib/types';
import { formatSerialNumber, formatDate } from '@/lib/utils';
import { Search, Loader2, CheckCircle2, AlertCircle, ShieldAlert, Store, Clock, Ticket, X, ChevronRight, BadgeCheck } from 'lucide-react';
import { getBrandTheme } from '@/lib/brand-theme';

export default function MerchantDashboardPage() {
  const params = useParams();
  const token = params?.token as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'USED'>('ALL');

  // Selected reward for modal
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [confirmingRedeem, setConfirmingRedeem] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  const fetchMerchantData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/merchant/data?token=${encodeURIComponent(token)}`);
      const data = await res.json();

      if (!res.ok || !data.business) {
        setError(data.error || 'Invalid or expired merchant access link.');
        return;
      }

      setBusiness(data.business);
      setRewards(data.rewards || []);
    } catch (err) {
      console.error('Failed to load merchant data:', err);
      setError('Unable to load merchant dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
  }, [token]);

  // Filter rewards by search query + status
  const filteredRewards = useMemo(() => {
    let list = rewards;
    if (statusFilter !== 'ALL') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();

    return list.filter((r) => {
      const serialStr = formatSerialNumber(r.serial_number);
      const rawSerial = r.serial_number.toString();
      const nameMatch = r.customer_name.toLowerCase().includes(q);
      const phoneMatch = r.customer_phone.toLowerCase().includes(q);
      const serialMatch = serialStr.includes(q) || rawSerial === q || `#${serialStr}`.includes(q);

      return nameMatch || phoneMatch || serialMatch;
    });
  }, [rewards, searchQuery, statusFilter]);

  // Handle Redemption
  const handleConfirmRedeem = async () => {
    if (!selectedReward || redeeming) return;
    setRedeeming(true);
    setRedeemError(null);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/merchant/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          reward_id: selectedReward.id,
        }),
        signal: controller.signal,
      });

      const responseText = await res.text();
      let data: { success?: boolean; reward?: Reward; error?: string } = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error('The redemption server returned an invalid response.');
      }
      if (!res.ok || !data.success) {
        setRedeemError(data.error || 'Failed to redeem card.');
        return;
      }

      if (!data.reward || data.reward.status !== 'USED') {
        throw new Error('The server did not confirm the redeemed card.');
      }

      const updatedReward = data.reward;
      setRewards((prev) =>
        prev.map((r) => (r.id === updatedReward.id ? updatedReward : r))
      );
      setSelectedReward(updatedReward);
      setConfirmingRedeem(false);
      setRedeemSuccess(`Card #${formatSerialNumber(updatedReward.serial_number)} redeemed successfully!`);
      setTimeout(() => setRedeemSuccess(null), 4000);
    } catch (err) {
      console.error('Redeem failed:', err);
      setRedeemError(
        err instanceof DOMException && err.name === 'AbortError'
          ? 'Redemption timed out. Please check your connection and try again.'
          : err instanceof Error
            ? err.message
            : 'Unable to redeem this card. Please try again.'
      );
    } finally {
      window.clearTimeout(timeout);
      setRedeeming(false);
    }
  };


  const counts = {
    ALL: rewards.length,
    ACTIVE: rewards.filter((r) => r.status === 'ACTIVE').length,
    USED: rewards.filter((r) => r.status === 'USED').length,
  };

  const closeModal = () => {
    setSelectedReward(null);
    setConfirmingRedeem(false);
    setRedeemError(null);
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-ivory-50" aria-busy="true">
        <div className="bg-white border-b border-ink-200">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3.5 w-36 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-2.5 w-24 rounded-full bg-slate-200 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-white border border-ink-200 animate-pulse" />)}
          </div>
          <div className="h-14 rounded-2xl bg-white border border-ink-200 animate-pulse" />
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-white border border-ink-200 animate-pulse" />)}
          <p className="flex items-center justify-center gap-2 pt-2 text-sm font-medium text-ink-500">
            <Loader2 className="w-4 h-4 animate-spin text-gold-700" /> Loading merchant portal...
          </p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-ivory-50">
        <div className="w-full max-w-md bg-white rounded-[28px] p-8 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] border border-ink-200 text-center animate-scaleUp">
          <div className="w-16 h-16 bg-red-50 text-danger-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-ink-950 mb-2 tracking-tight">Access Denied</h1>
          <p className="text-sm text-ink-500">{error || 'Invalid merchant link.'}</p>
        </div>
        <p className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
          Powered by
          <Image src="/boostov-logo.png" alt="" width={16} height={16} />
          <span className="font-bold text-ink-950">boostov<span className="text-gold-700">.ma</span></span>
        </p>
      </div>
    );
  }

  const filterOptions: { key: 'ALL' | 'ACTIVE' | 'USED'; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'USED', label: 'Used' },
  ];

  const theme = getBrandTheme(business.primary_color);
  const primary3d = {
    background: 'linear-gradient(180deg, #22C55E -30%, #15803D 100%)',
    '--bv-edge': '#14532D',
    '--bv-glow': 'rgba(22,163,74,0.7)',
  } as React.CSSProperties;

  return (
    <div className="relative min-h-dvh bg-ivory-100 overflow-x-hidden">
      {/* BRAND STAGE HEADER */}
      <header
        className="relative overflow-hidden text-white"
        style={{ background: `radial-gradient(120% 80% at 90% 0%, rgba(255,255,255,0.18), transparent 55%), linear-gradient(160deg, ${theme.deep} 0%, ${theme.dark} 100%)` }}
      >
        <svg aria-hidden className="absolute -right-24 -top-20 w-[380px] h-[380px] opacity-[0.14]" viewBox="0 0 200 200" fill="none" stroke="white" strokeWidth="1.1">
          {[30, 50, 70, 90].map((r) => <circle key={r} cx="100" cy="100" r={r} />)}
        </svg>
        <div aria-hidden className="absolute inset-0 bv-grain" />
        <div className="relative max-w-2xl mx-auto px-5 pt-[max(18px,env(safe-area-inset-top))] pb-16">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-[18px] bg-gradient-to-b from-white to-slate-200 p-1 shadow-[0_3px_0_rgba(0,0,0,0.25),0_16px_30px_-12px_rgba(0,0,0,0.6)] ring-4 ring-white/15 overflow-hidden shrink-0 flex items-center justify-center">
                {business.logo_url ? (
                  <Image src={business.logo_url} alt={`${business.name} logo`} width={56} height={56} className="w-full h-full object-contain rounded-[14px]" />
                ) : (
                  <Store className="w-6 h-6" style={{ color: theme.deep }} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/70 truncate">Merchant Redemption Portal</p>
                <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] truncate">{business.name}</h1>
              </div>
            </div>
            <span className="bv-glass inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#4ADE80] shadow-[0_0_0_3px_rgba(74,222,128,0.25)]" />
              Active
            </span>
          </div>

          {/* STATS */}
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            {[
              { label: 'Total', value: counts.ALL, icon: <Ticket className="w-4 h-4" /> },
              { label: 'Active', value: counts.ACTIVE, icon: <CheckCircle2 className="w-4 h-4" /> },
              { label: 'Used', value: counts.USED, icon: <Clock className="w-4 h-4" /> },
            ].map((stat) => (
              <div key={stat.label} className="bv-glass rounded-[20px] p-3.5">
                <div className="flex items-center justify-between text-white/75">
                  <span className="text-[11px] font-bold uppercase tracking-wider">{stat.label}</span>
                  {stat.icon}
                </div>
                <p className="text-[28px] leading-none mt-2 font-extrabold tabular-nums">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN SHEET */}
      <main className="relative -mt-8 max-w-2xl mx-auto bg-white rounded-t-[32px] sm:rounded-[32px] sm:mb-8 px-4 sm:px-6 pt-6 pb-8 space-y-5 shadow-[0_-24px_48px_-28px_rgba(15,23,42,0.5)] min-h-[60dvh] bv-sheet-up">
        {/* Success Alert */}
        {redeemSuccess && (
          <div role="status" className="p-4 bg-emerald-50 border border-emerald-200 text-success-700 rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{redeemSuccess}</span>
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="relative">
          <label htmlFor="merchant-search" className="sr-only">Search rewards</label>
          <Search className="w-5 h-5 text-ink-500 absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="merchant-search"
            type="text"
            placeholder="Card #, name or phone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            autoComplete="off"
            inputMode="search"
            enterKeyHint="search"
            className="w-full min-h-[56px] ps-12 pe-14 bg-ivory-50 border border-ink-200 rounded-[18px] text-ink-950 placeholder-ink-400 text-base focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute end-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center text-ink-500 hover:bg-slate-100 hover:text-ink-950 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* REWARDS LIST */}
        <section className="space-y-3" aria-label="Customer rewards">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-ink-950">
              Customer Rewards <span className="text-ink-500 font-semibold">({filteredRewards.length})</span>
            </h2>

            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-ink-200" role="tablist" aria-label="Filter by status">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  role="tab"
                  aria-selected={statusFilter === option.key}
                  onClick={() => setStatusFilter(option.key)}
                  className={`px-3 min-h-[36px] rounded-lg text-xs font-bold transition-all ${
                    statusFilter === option.key ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500 hover:text-ink-950'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {filteredRewards.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-dashed border-ink-300 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-ink-500 flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-ink-950">No rewards found</p>
              <p className="text-xs text-ink-500 mt-1">No rewards found matching your search.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {filteredRewards.map((reward) => {
                const isUsed = reward.status === 'USED';
                return (
                  <li key={reward.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReward(reward);
                        setConfirmingRedeem(false);
                        setRedeemError(null);
                      }}
                      className="bv-tile3d w-full text-left bg-gradient-to-b from-white to-slate-50 rounded-[20px] p-3.5 border border-ink-200 transition-all hover:border-gold-400 active:translate-y-px flex items-center gap-3"
                    >
                      <div
                        className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-mono font-extrabold text-sm border shrink-0 ${
                          isUsed ? 'bg-slate-50 text-ink-500 border-ink-200' : 'bg-gold-50 text-gold-800 border-gold-200'
                        }`}
                      >
                        <span className="text-[9px] font-sans font-bold tracking-wider opacity-70">NO.</span>
                        <span>#{formatSerialNumber(reward.serial_number)}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-[15px] leading-tight truncate ${isUsed ? 'text-ink-500' : 'text-ink-950'}`}>
                          {reward.customer_name}
                        </h3>
                        <p className="text-xs text-ink-500 mt-0.5 font-medium truncate">{reward.customer_phone}</p>
                        <p className="text-[11px] text-ink-400 mt-0.5">{formatDate(reward.created_at)}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isUsed ? (
                          <span className="px-2.5 py-1 bg-slate-100 text-ink-500 text-[11px] font-bold rounded-full border border-ink-200 uppercase tracking-wide whitespace-nowrap">
                            Used
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 text-success-700 text-[11px] font-bold rounded-full border border-emerald-200 uppercase tracking-wide whitespace-nowrap">
                            {reward.discount_percentage}% · Active
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-ink-300" />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="pt-2 pb-4 flex items-center justify-center gap-1.5 text-xs font-medium text-ink-500">
          Powered by
          <Image src="/boostov-logo.png" alt="" width={16} height={16} />
          <span className="font-bold text-ink-950">boostov<span className="text-gold-700">.ma</span></span>
        </p>
      </main>

      {/* REWARD DETAILS & REDEMPTION MODAL (bottom sheet on mobile) */}
      {selectedReward && (
        <div
          className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !redeeming) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-dialog-title"
            className="bg-white rounded-t-[32px] sm:rounded-[32px] max-w-md w-full p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl border border-ink-200 space-y-5 animate-step-in max-h-[92dvh] overflow-y-auto overscroll-contain"
          >
            <div className="mx-auto -mt-2 mb-1 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden />
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Card Details</span>
                <h2 id="reward-dialog-title" className="text-3xl font-black text-ink-950 font-mono mt-0.5">
                  #{formatSerialNumber(selectedReward.serial_number)}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {selectedReward.status === 'USED' ? (
                  <span className="px-3 py-1.5 bg-slate-100 text-ink-500 text-xs font-extrabold rounded-full border border-ink-200 uppercase tracking-wider">
                    USED
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-emerald-50 text-success-700 text-xs font-extrabold rounded-full border border-emerald-200 uppercase tracking-wider">
                    ACTIVE
                  </span>
                )}
                <button
                  onClick={closeModal}
                  disabled={redeeming}
                  aria-label="Close"
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-ink-950 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <dl className="divide-y divide-ink-200 bg-ivory-50 rounded-2xl border border-ink-200 text-sm">
              {[
                ['Customer Name', selectedReward.customer_name, 'text-ink-950'],
                ['Phone Number', selectedReward.customer_phone, 'text-ink-950'],
                ['Discount Offer', `${selectedReward.discount_percentage}% OFF`, 'text-gold-700'],
                ['Created Date', formatDate(selectedReward.created_at), 'text-ink-950'],
              ].map(([label, value, tone]) => (
                <div key={label} className="flex justify-between items-center gap-4 px-4 py-3">
                  <dt className="text-ink-500 font-medium">{label}</dt>
                  <dd className={`font-bold text-right ${tone}`}>{value}</dd>
                </div>
              ))}

              {selectedReward.status === 'USED' && selectedReward.redeemed_at && (
                <div className="flex justify-between items-center gap-4 px-4 py-3 text-danger-600">
                  <dt className="font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Redeemed At
                  </dt>
                  <dd className="font-bold">{formatDate(selectedReward.redeemed_at)}</dd>
                </div>
              )}
            </dl>

            {redeemError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 text-danger-600 rounded-xl text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{redeemError}</span>
              </div>
            )}

            {/* ACTION BUTTONS */}
            {selectedReward.status === 'ACTIVE' && (
              <div>
                {!confirmingRedeem ? (
                  <button
                    onClick={() => setConfirmingRedeem(true)}
                    style={primary3d}
                    className="bv-btn3d w-full min-h-[60px] text-white font-bold px-6 rounded-[20px] text-[17px] flex items-center justify-center gap-2 hover:brightness-110"
                  >
                    <BadgeCheck className="w-5 h-5" />
                    <span>REDEEM {selectedReward.discount_percentage}%</span>
                  </button>
                ) : (
                  <div className="space-y-3 bg-amber-50 border border-amber-200 p-4 rounded-2xl animate-fadeIn">
                    <p className="text-center font-bold text-amber-900 text-sm">
                      Redeem Card #{formatSerialNumber(selectedReward.serial_number)}?
                    </p>
                    <p className="text-center text-xs text-amber-800">
                      This action will change card status to USED. This cannot be undone.
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmingRedeem(false)}
                        disabled={redeeming}
                        className="flex-1 min-h-[48px] bg-white hover:bg-slate-50 text-ink-950 font-semibold px-4 rounded-xl border border-slate-300 text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmRedeem}
                        disabled={redeeming}
                        style={primary3d}
                        className="bv-btn3d flex-1 min-h-[48px] text-white font-bold px-4 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-75"
                      >
                        {redeeming ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>Yes, Redeem Now</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedReward.status === 'USED' && (
              <div className="p-3 bg-red-50 text-danger-600 border border-red-200 rounded-2xl text-center text-xs font-bold uppercase tracking-wider">
                This card has already been used and cannot be redeemed twice.
              </div>
            )}

            <button
              onClick={closeModal}
              disabled={redeeming}
              className="w-full min-h-[48px] bg-slate-100 hover:bg-slate-200 text-ink-950 font-semibold rounded-2xl text-sm transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
