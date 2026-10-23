import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="relative min-h-dvh flex items-center justify-center p-4 bg-[#F8FAFC] overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.12),transparent_65%)]" />
      <div className="relative w-full max-w-[400px] bg-white rounded-[28px] p-8 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)] border border-[#E2E8F0] text-center">
        <Image
          src="/boostov-logo.png"
          alt="boostov.ma logo"
          width={88}
          height={88}
          className="mx-auto mb-5"
          priority
        />

        <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight mb-2">
          boostov<span className="text-[#2563EB]">.ma</span>
        </h1>
        <p className="text-sm text-[#64748B] mb-8 leading-relaxed">
          Post-purchase NFC customer experience platform for local businesses.
        </p>

        <Link
          href="/admin"
          className="group flex w-full items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-2xl transition-all duration-200 text-base shadow-md"
        >
          Admin Panel
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </main>
  );
}
