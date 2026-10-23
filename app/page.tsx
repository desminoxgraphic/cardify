import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="relative min-h-dvh flex items-center justify-center p-5 bg-[#0B1120] text-white overflow-hidden">
      <div aria-hidden className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-[#2563EB]/30 blur-3xl" />
      <div aria-hidden className="absolute -bottom-40 -right-32 w-[480px] h-[480px] rounded-full bg-[#0EA5E9]/20 blur-3xl" />
      <svg aria-hidden className="absolute -right-24 top-10 w-[460px] h-[460px] opacity-[0.08]" viewBox="0 0 200 200" fill="none" stroke="white" strokeWidth="1">
        {[30, 50, 70, 90].map((r) => <circle key={r} cx="100" cy="100" r={r} />)}
      </svg>
      <div aria-hidden className="absolute inset-0 bv-grain" />

      <div className="relative w-full max-w-[400px] text-center bv-sheet-up">
        <span className="mx-auto w-24 h-24 rounded-[28px] bg-gradient-to-b from-white to-slate-200 flex items-center justify-center shadow-[0_5px_0_rgba(0,0,0,0.35),0_30px_50px_-16px_rgba(37,99,235,0.65)] bv-float">
          <Image src="/boostov-logo.png" alt="boostov.ma logo" width={72} height={72} priority />
        </span>

        <h1 className="mt-8 text-[44px] leading-none font-extrabold tracking-[-0.035em]">
          boostov<span className="text-[#60A5FA]">.ma</span>
        </h1>
        <p className="mt-4 text-base text-white/65 leading-relaxed max-w-[320px] mx-auto">
          Post-purchase NFC customer experience platform for local businesses.
        </p>

        <Link
          href="/admin"
          className="bv-btn3d group mt-10 flex w-full items-center justify-center gap-2 bg-white text-[#0B1120] font-bold min-h-[58px] px-6 rounded-[20px] text-base [--bv-edge:#94A3B8] [--bv-glow:rgba(37,99,235,0.45)]"
        >
          Admin Panel
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        </Link>
      </div>
    </main>
  );
}
