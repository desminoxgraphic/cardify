'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Business, Reward } from '@/lib/types';
import { formatSerialNumber, formatDate } from '@/lib/utils';
import { Search, Loader2, CheckCircle2, AlertCircle, ShieldAlert, Store, Clock } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3 text-[#64748B]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
          <span className="text-sm font-medium">Loading merchant portal...</span>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-md border border-[#E2E8F0] text-center">
          <div className="w-16 h-16 bg-red-50 text-[#DC2626] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] mb-2">Access Denied</h1>
          <p className="text-sm text-[#64748B]">{error || 'Invalid merchant link.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F8FAFC]">
      {/* HEADER */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <Store className="w-5 h-5 text-[#2563EB]" />
              )}
            </div>
            <div>
              <h1 className="text-base font-bold text-[#0F172A] leading-tight">
                {business.name}
              </h1>
              <p className="text-xs text-[#64748B]">Merchant Redemption Portal</p>
            </div>
          </div>

          <div className="bg-emerald-50 text-[#16A34A] border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
            Merchant Active
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Success Alert */}
        {redeemSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-[#16A34A] rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{redeemSuccess}</span>
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="w-5 h-5 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Card #, Customer Name, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            autoComplete="off"
            inputMode="search"
            enterKeyHint="search"
            className="w-full pl-12 pr-16 py-3.5 bg-white border border-[#E2E8F0] rounded-2xl text-[#0F172A] placeholder-[#64748B] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
            >
              Clear
            </button>
          )}
        </div>

        {/* REWARDS LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Customer Rewards ({filteredRewards.length})
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-[#16A34A] text-white border-[#16A34A]'
                    : 'bg-white text-[#16A34A] border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('USED')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  statusFilter === 'USED'
                    ? 'bg-[#DC2626] text-white border-[#DC2626]'
                    : 'bg-white text-[#DC2626] border-red-200 hover:bg-red-50'
                }`}
              >
                Used
              </button>
            </div>
          </div>

          {filteredRewards.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] text-center text-[#64748B]">
              <p className="text-sm font-medium">No rewards found matching your search.</p>
            </div>
          ) : (
            filteredRewards.map((reward) => {
              const isUsed = reward.status === 'USED';
              return (
                <div
                  key={reward.id}
                  onClick={() => {
                    setSelectedReward(reward);
                    setConfirmingRedeem(false);
                    setRedeemError(null);
                  }}
                  className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer hover:border-[#2563EB]/40 active:scale-[0.99] flex items-center justify-between shadow-sm ${
                    isUsed ? 'border-red-100 bg-red-50/10' : 'border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono font-extrabold text-sm border ${
                        isUsed
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
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    {isUsed ? (
                      <span className="px-3 py-1 bg-red-100 text-[#DC2626] text-xs font-bold rounded-full border border-red-200 uppercase tracking-wide">
                        USED
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-100 text-[#16A34A] text-xs font-bold rounded-full border border-emerald-200 uppercase tracking-wide">
                        ACTIVE ({reward.discount_percentage}% OFF)
                      </span>
                    )}
                    <span className="text-[11px] text-[#64748B]">
                      {formatDate(reward.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* REWARD DETAILS & REDEMPTION MODAL */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-5 animate-scaleUp max-h-[90dvh] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Card Details
                </span>
                <h2 className="text-2xl font-black text-[#0F172A] font-mono">
                  #{formatSerialNumber(selectedReward.serial_number)}
                </h2>
              </div>

              {selectedReward.status === 'USED' ? (
                <span className="px-3.5 py-1.5 bg-red-100 text-[#DC2626] text-xs font-extrabold rounded-full border border-red-200 uppercase tracking-wider">
                  USED
                </span>
              ) : (
                <span className="px-3.5 py-1.5 bg-emerald-100 text-[#16A34A] text-xs font-extrabold rounded-full border border-emerald-200 uppercase tracking-wider">
                  ACTIVE
                </span>
              )}
            </div>

            <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#64748B] font-medium">Customer Name:</span>
                <span className="font-bold text-[#0F172A]">{selectedReward.customer_name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#64748B] font-medium">Phone Number:</span>
                <span className="font-bold text-[#0F172A]">{selectedReward.customer_phone}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#64748B] font-medium">Discount Offer:</span>
                <span className="font-bold text-[#2563EB]">{selectedReward.discount_percentage}% OFF</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#64748B] font-medium">Created Date:</span>
                <span className="font-semibold text-[#0F172A]">{formatDate(selectedReward.created_at)}</span>
              </div>

              {selectedReward.status === 'USED' && selectedReward.redeemed_at && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-red-200 text-[#DC2626]">
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Redeemed At:
                  </span>
                  <span className="font-bold">{formatDate(selectedReward.redeemed_at)}</span>
                </div>
              )}
            </div>

            {redeemError && (
              <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-xl text-xs font-semibold flex items-center gap-2">
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
                    className="w-full bg-[#16A34A] hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all text-base flex items-center justify-center gap-2"
                  >
                    <span>REDEEM {selectedReward.discount_percentage}%</span>
                  </button>
                ) : (
                  <div className="space-y-3 bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                    <p className="text-center font-bold text-amber-900 text-sm">
                      Redeem Card #{formatSerialNumber(selectedReward.serial_number)}?
                    </p>
                    <p className="text-center text-xs text-amber-700">
                      This action will change card status to USED. This cannot be undone.
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmingRedeem(false)}
                        disabled={redeeming}
                        className="flex-1 bg-white hover:bg-slate-100 text-[#0F172A] font-semibold py-3 px-4 rounded-xl border border-slate-300 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmRedeem}
                        disabled={redeeming}
                        className="flex-1 bg-[#16A34A] hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow flex items-center justify-center gap-2 disabled:opacity-75"
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
              <div className="p-3 bg-red-50 text-[#DC2626] border border-red-200 rounded-2xl text-center text-xs font-bold uppercase tracking-wider">
                This card has already been used and cannot be redeemed twice.
              </div>
            )}

            <button
              onClick={() => {
                setSelectedReward(null);
                setConfirmingRedeem(false);
                setRedeemError(null);
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-semibold py-3 rounded-2xl text-sm transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
