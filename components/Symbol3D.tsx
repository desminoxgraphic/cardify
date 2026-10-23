import { useId } from 'react';

export type SymbolKind = 'heart' | 'star' | 'gift' | 'ticket' | 'sparkle';

const STAR = 'M50 6 L62.4 34.6 L93.5 37.4 L70 58 L76.9 88.6 L50 72.6 L23.1 88.6 L30 58 L6.5 37.4 L37.6 34.6 Z';
const HEART = 'M50 88 C22 68 6 50 12 31 C17 15 38 10 50 27 C62 10 83 15 88 31 C94 50 78 68 50 88 Z';
const SPARKLE = 'M50 4 C54 34 66 46 96 50 C66 54 54 66 50 96 C46 66 34 54 4 50 C34 46 46 34 50 4 Z';
// Ticket with side notches
const TICKET = 'M14 22 H86 a8 8 0 0 1 8 8 V42 a8 8 0 0 0 0 16 V70 a8 8 0 0 1 -8 8 H14 a8 8 0 0 1 -8 -8 V58 a8 8 0 0 0 0 -16 V30 a8 8 0 0 1 8 -8 Z';
const GIFT_BODY = 'M18 44 H82 V82 a6 6 0 0 1 -6 6 H24 a6 6 0 0 1 -6 -6 Z';
const GIFT_LID = 'M12 32 a5 5 0 0 1 5 -5 H83 a5 5 0 0 1 5 5 V46 H12 Z';
const GIFT_BOW = 'M50 27 C40 8 22 12 26 22 C29 29 42 28 50 27 C58 28 71 29 74 22 C78 12 60 8 50 27 Z';

const PALETTES: Record<SymbolKind, { light: string; base: string; dark: string; side: string; edge: string }> = {
  heart: { light: '#FFC2D1', base: '#FB4F7A', dark: '#E11D48', side: '#9F1239', edge: '#BE123C' },
  star: { light: '#FFF3B0', base: '#FBBF24', dark: '#F59E0B', side: '#B45309', edge: '#D97706' },
  gift: { light: '#FFFFFF', base: '#F1F5F9', dark: '#CBD5E1', side: '#94A3B8', edge: '#CBD5E1' },
  ticket: { light: '#FFF6D6', base: '#FCD34D', dark: '#F59E0B', side: '#B45309', edge: '#D97706' },
  sparkle: { light: '#FFFFFF', base: '#FEF3C7', dark: '#FCD34D', side: '#D97706', edge: '#F59E0B' },
};

/**
 * Glossy extruded symbol. Static SVG (no filters) so it stays cheap on low-end phones.
 */
export function Symbol3D({ kind, className = '', label }: { kind: SymbolKind; className?: string; label?: string }) {
  const id = useId().replace(/:/g, '');
  const c = PALETTES[kind];
  const depth = [6, 5, 4, 3, 2, 1];

  const silhouette = (fill: string, dy = 0) => {
    const t = `translate(0 ${dy})`;
    switch (kind) {
      case 'heart':
        return <path d={HEART} fill={fill} transform={t} />;
      case 'star':
        return <path d={STAR} fill={fill} transform={t} strokeLinejoin="round" />;
      case 'sparkle':
        return <path d={SPARKLE} fill={fill} transform={t} />;
      case 'ticket':
        return <path d={TICKET} fill={fill} transform={t} />;
      case 'gift':
        return (
          <g transform={t} fill={fill}>
            <path d={GIFT_BODY} />
            <path d={GIFT_LID} />
            <path d={GIFT_BOW} />
          </g>
        );
    }
  };

  return (
    <svg viewBox="0 -4 100 112" className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <linearGradient id={`${id}-face`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={c.light} />
          <stop offset="0.45" stopColor={c.base} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-ribbon`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000000" stopOpacity="0.35" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>{silhouette('#000')}</clipPath>
      </defs>

      {/* contact shadow */}
      <ellipse cx="50" cy="101" rx="32" ry="5" fill={`url(#${id}-shadow)`} />
      {/* extrusion */}
      {depth.map((d) => <g key={d}>{silhouette(c.side, d * 1.1)}</g>)}
      {/* face */}
      {silhouette(`url(#${id}-face)`)}

      {kind === 'gift' && (
        <g>
          <rect x="44" y="27" width="12" height="61" fill={`url(#${id}-ribbon)`} />
          <rect x="12" y="35" width="76" height="7" fill={`url(#${id}-ribbon)`} opacity="0.9" />
          <path d={GIFT_BOW} fill={`url(#${id}-ribbon)`} />
          <circle cx="50" cy="27" r="5" fill="#F59E0B" stroke="#B45309" strokeWidth="0.8" />
        </g>
      )}
      {kind === 'ticket' && (
        <g>
          <path d="M66 26 V74" stroke={c.side} strokeOpacity="0.45" strokeWidth="1.6" strokeDasharray="2 4" strokeLinecap="round" />
          <text x="37" y="61" textAnchor="middle" fontFamily="-apple-system, 'Segoe UI', Arial, sans-serif" fontSize="30" fontWeight="900" fill="#7C2D12" fillOpacity="0.85">%</text>
          <circle cx="80" cy="50" r="4.5" fill="#7C2D12" fillOpacity="0.55" />
        </g>
      )}

      {/* gloss */}
      <g clipPath={`url(#${id}-clip)`}>
        <ellipse cx="38" cy="22" rx="40" ry="20" fill={`url(#${id}-gloss)`} opacity={kind === 'gift' ? 0.5 : 0.75} />
      </g>
      {/* face edge */}
      <g fill="none" stroke={c.edge} strokeWidth="0.8" opacity="0.6">{kind !== 'gift' && silhouette('none')}</g>
    </svg>
  );
}
