import Image from 'next/image';
import { getBrandTheme, shade } from '@/lib/brand-theme';

interface RewardPreviewCardProps {
  businessName: string;
  logoUrl: string | null;
  initials: string;
  color: string;
  discount: number;
  holderName: string;
  className?: string;
}

/** Live, CSS-only preview of the reward card shown before the real card is created. */
export function RewardPreviewCard({ businessName, logoUrl, initials, color, discount, holderName, className = '' }: RewardPreviewCardProps) {
  const theme = getBrandTheme(color);
  const holder = holderName.trim().toUpperCase();

  return (
    <div
      className={`relative w-full aspect-[1.585] [container-type:inline-size] rounded-[22px] overflow-hidden text-white shadow-[0_2px_0_rgba(255,255,255,0.12)_inset,0_40px_70px_-24px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.18)] ${className}`}
      style={{ background: `linear-gradient(140deg, ${theme.deep} 0%, ${shade(theme.dark, 0.55)} 70%, #050507 100%)` }}
      role="img"
      aria-label={`${businessName} reward card preview, ${discount}% off`}
    >
      {/* Signal rings + sheen */}
      <svg aria-hidden className="absolute -right-16 -bottom-20 w-72 h-72 opacity-[0.12]" viewBox="0 0 200 200" fill="none" stroke="white" strokeWidth="1.5">
        {[40, 60, 80, 100].map((r) => <circle key={r} cx="100" cy="100" r={r} />)}
      </svg>
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.05)_34%,transparent_55%)]" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <div aria-hidden className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent bv-shine" />

      <div className="relative h-full flex flex-col p-[6%]">
        <div className="flex items-center gap-[3cqw]">
          <div className="w-[11cqw] h-[11cqw] rounded-[3.4cqw] bg-white/15 ring-1 ring-white/25 overflow-hidden flex items-center justify-center text-[3.6cqw] font-extrabold shrink-0">
            {logoUrl ? <Image src={logoUrl} alt="" width={36} height={36} className="w-full h-full object-contain" /> : initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[4.2cqw] font-extrabold leading-tight truncate">{businessName}</p>
            <p className="text-[2.8cqw] font-bold tracking-[0.2em] text-white/60">REWARD CARD</p>
          </div>
          <svg aria-hidden viewBox="0 0 24 24" className="w-[7cqw] h-[7cqw] text-white/85 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M8.5 7.5a6 6 0 0 1 0 9" /><path d="M12 5a9.5 9.5 0 0 1 0 14" /><path d="M15.5 2.5a13 13 0 0 1 0 19" />
          </svg>
        </div>

        <div className="flex items-center gap-[3cqw] mt-[4%]">
          <div aria-hidden className="w-[12cqw] h-[8.6cqw] rounded-[1.8cqw] bg-gradient-to-br from-[#F7E2A6] via-[#C9A250] to-[#F1D48A] ring-1 ring-black/10" />
          <span className="text-[2.8cqw] font-extrabold tracking-[0.18em] px-[3cqw] py-[1.2cqw] rounded-full bg-white/12 ring-1 ring-white/25">NEXT VISIT · ONE USE</span>
        </div>

        <p className="mt-auto text-[17cqw] leading-[0.95] font-black tracking-[-0.04em]">
          {discount}% <span className="text-[0.42em] tracking-normal">OFF</span>
        </p>
        <div className="mt-[3%] flex items-end justify-between gap-[3cqw]">
          <div className="min-w-0">
            <p className="text-[2.8cqw] font-bold tracking-[0.2em] text-white/55">CARDHOLDER</p>
            <p className={`text-[4.6cqw] font-extrabold tracking-[0.06em] truncate ${holder ? '' : 'text-white/45'}`}>{holder || 'YOUR NAME'}</p>
          </div>
          <p className="text-[3cqw] font-bold text-white/55 shrink-0">boostov.ma</p>
        </div>
      </div>
    </div>
  );
}
