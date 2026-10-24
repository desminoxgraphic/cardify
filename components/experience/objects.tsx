import { useId } from 'react';
import { Symbol3D } from '@/components/Symbol3D';

/** Gift box with a separate lid so it can open. `opening` plays the lid-pop once. */
export function GiftBox({ className = '', opening = false, shaking = false }: { className?: string; opening?: boolean; shaking?: boolean }) {
  const id = useId().replace(/:/g, '');
  const body = 'M16 46 H84 V86 a7 7 0 0 1 -7 7 H23 a7 7 0 0 1 -7 -7 Z';
  const lid = 'M10 33 a6 6 0 0 1 6 -6 H84 a6 6 0 0 1 6 6 V47 H10 Z';
  const bow = 'M50 27 C40 6 20 10 25 21 C28 29 42 28 50 27 C58 28 72 29 75 21 C80 10 60 6 50 27 Z';
  return (
    <svg viewBox="0 -8 100 112" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-box`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#F3EEE2" />
          <stop offset="1" stopColor="#D8CFBA" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE7A0" />
          <stop offset="0.5" stopColor="#F5C542" />
          <stop offset="1" stopColor="#C8901A" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.4" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-light`} cx="0.5" cy="1" r="0.8">
          <stop offset="0" stopColor="#FFE7A0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFE7A0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="99" rx="36" ry="5" fill={`url(#${id}-shadow)`} />
      <g className={shaking ? 'bv-shake' : ''} style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
        {/* light escaping when open */}
        {opening && <ellipse cx="50" cy="44" rx="34" ry="10" fill={`url(#${id}-light)`} className="animate-fadeIn" />}
        {[5, 4, 3, 2, 1].map((d) => <path key={d} d={body} transform={`translate(0 ${d})`} fill="#A39676" />)}
        <path d={body} fill={`url(#${id}-box)`} />
        <rect x="44" y="46" width="12" height="47" fill={`url(#${id}-gold)`} />
        <g className={opening ? 'bv-lid-pop' : ''} style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', animationDelay: shaking ? '520ms' : undefined }}>
          {[3, 2, 1].map((d) => <path key={d} d={lid} transform={`translate(0 ${d})`} fill="#A39676" />)}
          <path d={lid} fill={`url(#${id}-box)`} />
          <rect x="44" y="27" width="12" height="20" fill={`url(#${id}-gold)`} />
          <path d={bow} fill={`url(#${id}-gold)`} stroke="#B07A12" strokeWidth="0.8" />
          <circle cx="50" cy="27" r="5" fill="#F5C542" stroke="#9A6A0E" strokeWidth="0.8" />
          <ellipse cx="36" cy="32" rx="20" ry="4" fill="#FFFFFF" opacity="0.7" />
        </g>
      </g>
    </svg>
  );
}

/** Pointing finger used by the review demo. */
export function Finger({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 80" className={className} aria-hidden>
      <defs>
        <linearGradient id="fingerSkin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF4EA" />
          <stop offset="1" stopColor="#F2D2B6" />
        </linearGradient>
      </defs>
      <path
        d="M22 6 a7 7 0 0 1 14 0 V34 l4 -1 a6 6 0 0 1 7 5 l4 -1 a6 6 0 0 1 7 6 V58 C58 70 48 78 36 78 H32 C22 78 14 72 10 62 L4 46 a6 6 0 0 1 10 -6 L22 50 Z"
        fill="url(#fingerSkin)"
        stroke="#B98A68"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M36 34 V46 M47 37 V48" stroke="#C89C7C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Heart({ className = '', beating = true }: { className?: string; beating?: boolean }) {
  return (
    <div className={`${beating ? 'bv-beat' : ''} ${className}`}>
      <Symbol3D kind="heart" className="w-full h-auto drop-shadow-[0_24px_28px_rgba(0,0,0,0.5)]" />
    </div>
  );
}

export function Sparkle({ className = '', delay }: { className?: string; delay?: string }) {
  return (
    <div className={`bv-float ${className}`} style={{ animationDelay: delay }} aria-hidden>
      <Symbol3D kind="sparkle" className="w-full h-auto" />
    </div>
  );
}

/** Radial burst of small confetti pieces (pure CSS). */
export function Confetti({ count = 18, distance = 120, delay = '0ms', className = '' }: { count?: number; distance?: number; delay?: string; className?: string }) {
  const colors = ['#FFE7A0', '#F5C542', '#FFFFFF', '#F472B6', '#93C5FD', '#6EE7B7'];
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="bv-particle"
          style={
            {
              '--a': `${(360 / count) * i + (i % 2) * 8}deg`,
              '--d': `${-(distance * (0.7 + ((i * 37) % 30) / 100))}px`,
              animationDelay: delay,
              background: colors[i % colors.length],
              borderRadius: i % 3 === 0 ? '50%' : '2px',
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
