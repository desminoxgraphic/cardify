'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, LayoutGrid, LogOut, Plus } from 'lucide-react';

interface AdminShellProps {
  title: string;
  subtitle?: string;
  /** Shows a back link in the page header (inner pages). */
  backHref?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const NAV = [
  { href: '/admin', label: 'Businesses', icon: LayoutGrid },
  { href: '/admin/business/new', label: 'Add Business', icon: Plus },
];

export function AdminShell({ title, subtitle, backHref, actions, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-dvh bg-[#F1F5F9] text-[#0F172A] lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 sticky top-0 h-dvh bg-[#0B1120] text-white px-4 py-6 relative overflow-hidden">
        <div aria-hidden className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#2563EB]/25 blur-3xl" />
        <Link href="/admin" className="relative flex items-center gap-2.5 px-2">
          <span className="w-10 h-10 rounded-[14px] bg-white flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.3)]">
            <Image src="/boostov-logo.png" alt="boostov.ma logo" width={30} height={30} priority />
          </span>
          <span>
            <span className="block text-[17px] font-extrabold tracking-tight">boostov<span className="text-[#60A5FA]">.ma</span></span>
            <span className="block text-[11px] font-semibold text-white/50 tracking-wide">Admin</span>
          </span>
        </Link>

        <nav className="relative mt-10 space-y-1" aria-label="Admin">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href === '/admin' && pathname.startsWith('/admin/business/') && pathname !== '/admin/business/new');
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
                  active ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="relative mt-auto flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" /> Sign Out
        </button>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#0B1120] text-white">
          <div className="flex items-center justify-between px-4 h-14">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-[10px] bg-white flex items-center justify-center">
                <Image src="/boostov-logo.png" alt="boostov.ma logo" width={24} height={24} priority />
              </span>
              <span className="text-[15px] font-extrabold tracking-tight">boostov<span className="text-[#60A5FA]">.ma</span> <span className="text-white/50 font-semibold">Admin</span></span>
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/admin/business/new" aria-label="Add Business" className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/10">
                <Plus className="w-5 h-5" />
              </Link>
              <button onClick={handleLogout} aria-label="Sign Out" title="Sign Out" className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/10">
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 lg:mb-8">
            <div className="flex items-start gap-3 min-w-0">
              {backHref && (
                <Link
                  href={backHref}
                  aria-label="Back"
                  className="bv-tile3d w-11 h-11 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                </Link>
              )}
              <div className="min-w-0">
                <h1 className="text-[26px] sm:text-[30px] leading-tight font-extrabold tracking-[-0.02em] truncate">{title}</h1>
                {subtitle && <p className="text-sm text-[#64748B] mt-1">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Shared admin button styles (3D edge, consistent sizes). */
export const adminPrimaryButton =
  'bv-btn3d inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl text-sm font-bold text-white bg-gradient-to-b from-[#3B82F6] to-[#2563EB] hover:brightness-110 disabled:opacity-70 [--bv-edge:#1E3A8A] [--bv-glow:rgba(37,99,235,0.6)]';
export const adminSecondaryButton =
  'bv-tile3d inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-slate-50 transition-colors';
export const adminInput =
  'w-full min-h-[46px] px-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all';
export const adminLabel = 'block text-[13px] font-bold text-[#0F172A] mb-1.5';
export const adminCard = 'bg-white rounded-[24px] border border-[#E2E8F0] shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-20px_rgba(15,23,42,0.25)]';

export function AdminLoading({ label }: { label: string }) {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${adminCard} overflow-hidden`}>
            <div className="h-20 bg-slate-200 animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-4 w-1/2 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-sm font-medium text-[#64748B]">{label}</p>
    </div>
  );
}
