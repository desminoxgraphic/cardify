import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

export function BrandLogo({ size = 32, showWordmark = true, className, wordmarkClassName }: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image src="/boostov-logo.png" alt="boostov.ma logo" width={size} height={size} priority className="shrink-0" />
      {showWordmark && (
        <span className={cn('font-extrabold tracking-tight text-[#0F172A]', wordmarkClassName)}>
          boostov<span className="text-[#2563EB]">.ma</span>
        </span>
      )}
    </span>
  );
}
