import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="w-full max-w-[400px] bg-white rounded-3xl p-8 shadow-xl border border-[#E2E8F0] text-center">
        <div className="w-20 h-20 mx-auto mb-6 relative rounded-2xl overflow-hidden shadow-sm">
          <Image
            src="/cardify-logo.png"
            alt="Cardify Logo"
            fill
            className="object-cover"
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight mb-2">CARDIFY</h1>
        <p className="text-sm text-[#64748B] mb-8 leading-relaxed">
          Post-purchase NFC customer experience platform for local businesses.
        </p>

        <Link
          href="/admin"
          className="block w-full bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 text-base shadow-md"
        >
          Admin Panel
        </Link>
      </div>
    </main>
  );
}
