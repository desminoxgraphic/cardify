import { useId } from 'react';

const STAR_PATH = 'M12 2.4l2.95 5.98 6.6.96-4.78 4.65 1.13 6.57L12 17.46l-5.9 3.1 1.13-6.57L2.45 9.34l6.6-.96z';

/** Glossy, extruded gold star. Outline-only when empty. */
export function Star3D({ filled, className = '' }: { filled: boolean; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-face`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FFF3B0" />
          <stop offset="0.45" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={STAR_PATH} />
        </clipPath>
      </defs>
      {filled ? (
        <>
          {/* extrusion */}
          <path d={STAR_PATH} transform="translate(0 1.3)" fill="#B45309" />
          <path d={STAR_PATH} fill={`url(#${id}-face)`} stroke="#D97706" strokeWidth="0.6" strokeLinejoin="round" />
          <g clipPath={`url(#${id}-clip)`}>
            <ellipse cx="10" cy="6.5" rx="7" ry="4.2" fill={`url(#${id}-gloss)`} />
          </g>
        </>
      ) : (
        <path d={STAR_PATH} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinejoin="round" />
      )}
    </svg>
  );
}
