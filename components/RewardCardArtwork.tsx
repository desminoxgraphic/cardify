'use client';

import React, { useMemo } from 'react';
import { Business, PublicBusiness, Reward } from '@/lib/types';
import { formatDate, formatSerialNumber, getContrastTextColor, normalizeHexColor } from '@/lib/utils';

interface RewardCardArtworkProps {
  business: Business | PublicBusiness;
  reward: Reward;
  logoDataUrl?: string | null;
  id?: string;
  className?: string;
  /** Placeholder rendering before the real card exists (no number, status or date). */
  preview?: boolean;
}

interface TextFit {
  fontSize: number;
  textLength?: number;
}

const VIEW_W = 1200;
const VIEW_H = 757;
const PAD = 64;
const STUB_X = 868;
const STUB_CX = STUB_X + (VIEW_W - STUB_X) / 2;
const NOTCH_R = 30;

// System fonts only: the SVG is also rasterised to PNG, where web fonts are unavailable.
const SANS_FAMILY = `-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
const MONO_FAMILY = `'SF Mono', 'Cascadia Code', 'Consolas', 'Courier New', monospace`;

function shadeColor(hex: string, factor: number): string {
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  const clamp = (channel: number) => Math.max(0, Math.min(255, Math.round(channel * factor)));
  return `#${[red, green, blue].map((channel) => clamp(channel).toString(16).padStart(2, '0')).join('')}`;
}

function fitText(text: string, maxWidth: number, fontSize: number, minFontSize: number, charWidthFactor: number): TextFit {
  const length = Math.max((text || '').trim().length, 1);
  let size = fontSize;
  if (charWidthFactor * size * length > maxWidth) {
    size = Math.max(minFontSize, maxWidth / (charWidthFactor * length));
  }
  const stillOverflow = charWidthFactor * size * length > maxWidth;
  return { fontSize: Math.round(size * 10) / 10, textLength: stillOverflow ? maxWidth : undefined };
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const value = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
  return value.toUpperCase() || 'CB';
}

/** Security-print style wave lines (deterministic). */
function guillochePaths(x0: number, x1: number, yBase: number, count: number, gap: number, amp: number) {
  const paths: string[] = [];
  for (let k = 0; k < count; k++) {
    let d = '';
    for (let x = x0; x <= x1; x += 12) {
      const y = yBase + k * gap + amp * Math.sin(x / 58 + k * 0.55) + amp * 0.45 * Math.sin(x / 21 + k * 1.3);
      d += `${x === x0 ? 'M' : 'L'}${x.toFixed(0)} ${y.toFixed(1)} `;
    }
    paths.push(d);
  }
  return paths;
}

function Label({ x, y, anchor = 'start', fg, children, opacity = 0.62 }: { x: number; y: number; anchor?: 'start' | 'middle' | 'end'; fg: string; children: React.ReactNode; opacity?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={SANS_FAMILY} fontSize="27" fontWeight="800" fill={fg} fillOpacity={opacity} letterSpacing="3.5">
      {children}
    </text>
  );
}

export const RewardCardArtwork: React.FC<RewardCardArtworkProps> = ({
  business,
  reward,
  logoDataUrl,
  id = 'cardify-reward-svg',
  className = 'w-full h-auto drop-shadow-xl',
  preview = false,
}) => {
  const primaryColor = normalizeHexColor(business.primary_color);
  const fg = getContrastTextColor(primaryColor);
  const lightText = fg === '#FFFFFF';
  const midColor = shadeColor(primaryColor, lightText ? 0.62 : 0.9);
  const endColor = shadeColor(primaryColor, lightText ? 0.28 : 0.78);
  const logoToRender = logoDataUrl !== undefined ? logoDataUrl : business.logo_url;
  const initials = useMemo(() => initialsFor(business.name), [business.name]);
  const waves = useMemo(() => guillochePaths(0, STUB_X, 300, 9, 15, 20), []);
  const sealRings = [74, 64];

  const isUsed = !preview && reward.status === 'USED';
  const customerName = (reward.customer_name || '').trim().toUpperCase() || (preview ? 'YOUR NAME' : 'CUSTOMER');
  const percent = `${reward.discount_percentage}%`;

  const nameFit = fitText(business.name, STUB_X - PAD - 136 - 30, 50, 28, 0.56);
  const percentFit = fitText(percent, 440, 210, 130, 0.6);
  const percentWidth = percent.length * 0.6 * percentFit.fontSize;
  const customerFit = fitText(customerName, STUB_X - PAD - 50, 56, 32, 0.64);
  const metaText = preview
    ? 'Phone · issue date added when created'
    : `${reward.customer_phone}  ·  Issued ${formatDate(reward.created_at)}`;
  const metaFit = fitText(metaText, STUB_X - PAD - 50, 32, 22, 0.56);
  const serial = preview ? '———' : formatSerialNumber(reward.serial_number);

  return (
    <svg
      id={id}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={
        preview
          ? `${business.name} reward card preview, ${percent} off`
          : `${business.name} reward card, ${percent} off, card number ${serial}, ${isUsed ? 'used' : 'active'}`
      }
    >
      <defs>
        <linearGradient id="rcBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="55%" stopColor={midColor} />
          <stop offset="100%" stopColor={endColor} />
        </linearGradient>
        <linearGradient id="rcSheen" x1="0" y1="0" x2="1" y2="0.7">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.24" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rcHolo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0ABFC" />
          <stop offset="25%" stopColor="#93C5FD" />
          <stop offset="50%" stopColor="#6EE7B7" />
          <stop offset="75%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#FCA5A5" />
        </linearGradient>
        <linearGradient id="rcChip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F7E2A6" />
          <stop offset="50%" stopColor="#C9A250" />
          <stop offset="100%" stopColor="#F1D48A" />
        </linearGradient>
        <linearGradient id="rcRim" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.04" />
        </linearGradient>
        <mask id="rcShape">
          <rect width={VIEW_W} height={VIEW_H} rx="44" fill="#FFFFFF" />
          <circle cx={STUB_X} cy="0" r={NOTCH_R} fill="#000000" />
          <circle cx={STUB_X} cy={VIEW_H} r={NOTCH_R} fill="#000000" />
        </mask>
        <clipPath id="rcLogoClip">
          <rect x={PAD} y="52" width="112" height="112" rx="28" />
        </clipPath>
      </defs>

      <g mask="url(#rcShape)">
        <rect width={VIEW_W} height={VIEW_H} fill="url(#rcBg)" />

        {/* Ghost numeral */}
        <text x={STUB_X - 30} y="640" textAnchor="end" fontFamily={SANS_FAMILY} fontSize="560" fontWeight="900" fill={fg} fillOpacity="0.045" letterSpacing="-20">%</text>

        {/* Guilloche security lines */}
        <g fill="none" stroke={fg} strokeOpacity="0.075" strokeWidth="1.6">
          {waves.map((d, i) => <path key={i} d={d} />)}
        </g>

        {/* Stub panel */}
        <rect x={STUB_X} y="0" width={VIEW_W - STUB_X} height={VIEW_H} fill="#000000" fillOpacity={lightText ? 0.16 : 0.06} />
        <path d={`M0 0 H${VIEW_W * 0.7} L${VIEW_W * 0.36} ${VIEW_H} H0 Z`} fill="url(#rcSheen)" />

        {/* Rim */}
        <rect x="2" y="2" width={VIEW_W - 4} height={VIEW_H - 4} rx="42" fill="none" stroke="url(#rcRim)" strokeWidth="3" />
      </g>

      {/* Perforation */}
      <line x1={STUB_X} y1={NOTCH_R + 18} x2={STUB_X} y2={VIEW_H - NOTCH_R - 18} stroke={fg} strokeOpacity="0.4" strokeWidth="5" strokeDasharray="0.1 17" strokeLinecap="round" />

      {/* Logo (business initials underlay, real logo overlay when available) */}
      <rect x={PAD} y="52" width="112" height="112" rx="28" fill={fg} fillOpacity="0.12" stroke={fg} strokeOpacity="0.28" strokeWidth="2" />
      <text x={PAD + 56} y="122" textAnchor="middle" fontFamily={SANS_FAMILY} fontSize="44" fontWeight="800" fill={fg} fillOpacity="0.9">
        {initials}
      </text>
      {logoToRender && (
        <image href={logoToRender} x={PAD} y="52" width="112" height="112" preserveAspectRatio="xMidYMid meet" clipPath="url(#rcLogoClip)" />
      )}

      <text
        x={PAD + 136}
        y="106"
        fontFamily={SANS_FAMILY}
        fontSize={nameFit.fontSize}
        fontWeight="800"
        fill={fg}
        letterSpacing="-0.3"
        textLength={nameFit.textLength}
        lengthAdjust={nameFit.textLength ? 'spacingAndGlyphs' : undefined}
      >
        {business.name}
      </text>
      <Label x={PAD + 138} y={150} fg={fg}>REWARD CARD</Label>

      {/* Chip + contactless */}
      <g transform={`translate(${PAD} 210)`}>
        <rect width="108" height="80" rx="15" fill="url(#rcChip)" />
        <g fill="none" stroke="#8A6A2A" strokeOpacity="0.55" strokeWidth="2.4">
          <rect x="35" y="17" width="38" height="46" rx="8" />
          <path d="M0 28 H35 M0 52 H35 M73 28 H108 M73 52 H108 M54 0 V17 M54 63 V80" />
        </g>
      </g>
      <g transform={`translate(${PAD + 134} 220)`} fill="none" stroke={fg} strokeOpacity="0.8" strokeWidth="5" strokeLinecap="round">
        <path d="M6 14 a26 26 0 0 1 0 34" />
        <path d="M20 6 a40 40 0 0 1 0 50" />
        <path d="M34 -2 a54 54 0 0 1 0 66" />
      </g>

      {/* Hero: discount */}
      <text
        x={PAD - 6}
        y="500"
        fontFamily={SANS_FAMILY}
        fontSize={percentFit.fontSize}
        fontWeight="900"
        fill={fg}
        letterSpacing="-6"
        textLength={percentFit.textLength}
        lengthAdjust={percentFit.textLength ? 'spacingAndGlyphs' : undefined}
      >
        {percent}
      </text>
      <text x={PAD + Math.min(percentWidth, 440) + 4} y="420" fontFamily={SANS_FAMILY} fontSize="84" fontWeight="900" fill={fg} letterSpacing="-1">
        OFF
      </text>
      <Label x={PAD + Math.min(percentWidth, 440) + 8} y={492} fg={fg} opacity={0.8}>NEXT VISIT</Label>

      {/* Cardholder */}
      <Label x={PAD} y={572} fg={fg}>CARDHOLDER</Label>
      <text
        x={PAD}
        y="634"
        fontFamily={SANS_FAMILY}
        fontSize={customerFit.fontSize}
        fontWeight="800"
        fill={fg}
        fillOpacity={preview && !reward.customer_name.trim() ? 0.45 : 1}
        letterSpacing="2"
        textLength={customerFit.textLength}
        lengthAdjust={customerFit.textLength ? 'spacingAndGlyphs' : undefined}
      >
        {customerName}
      </text>
      <text
        x={PAD}
        y="690"
        fontFamily={SANS_FAMILY}
        fontSize={metaFit.fontSize}
        fontWeight="700"
        fill={fg}
        fillOpacity="0.72"
        letterSpacing="0.6"
        textLength={metaFit.textLength}
        lengthAdjust={metaFit.textLength ? 'spacingAndGlyphs' : undefined}
      >
        {metaText}
      </text>

      {/* Stub: holographic one-use seal */}
      <g>
        <circle cx={STUB_CX} cy="158" r="86" fill="url(#rcHolo)" fillOpacity="0.88" />
        <circle cx={STUB_CX} cy="158" r="86" fill="none" stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="2.5" />
        <g fill="none" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.2">
          {sealRings.map((r) => <circle key={r} cx={STUB_CX} cy="158" r={r} strokeDasharray="3 5" />)}
        </g>
        <text x={STUB_CX} y="166" textAnchor="middle" fontFamily={SANS_FAMILY} fontSize="66" fontWeight="900" fill="#1E1B4B" fillOpacity="0.82">1×</text>
        <text x={STUB_CX} y="204" textAnchor="middle" fontFamily={SANS_FAMILY} fontSize="24" fontWeight="900" fill="#1E1B4B" fillOpacity="0.8" letterSpacing="3">ONE USE</text>
      </g>

      <Label x={STUB_CX} y={316} anchor="middle" fg={fg}>CARD NO.</Label>
      <text x={STUB_CX} y="384" textAnchor="middle" fontFamily={MONO_FAMILY} fontSize="62" fontWeight="800" fill={fg} letterSpacing="3">
        #{serial}
      </text>

      {/* Status (real data only) */}
      {!preview && (
        <g>
          <rect x={STUB_CX - 112} y="424" width="224" height="64" rx="32" fill={fg} fillOpacity={isUsed ? 0.08 : 0.14} stroke={fg} strokeOpacity="0.3" strokeWidth="1.5" />
          <circle cx={STUB_CX - 70} cy="456" r="9" fill={isUsed ? fg : '#4ADE80'} fillOpacity={isUsed ? 0.45 : 1} />
          <text x={STUB_CX + 14} y="466" textAnchor="middle" fontFamily={SANS_FAMILY} fontSize="28" fontWeight="900" fill={fg} letterSpacing="3">
            {isUsed ? 'USED' : 'ACTIVE'}
          </text>
          {isUsed && reward.redeemed_at && (
            <text x={STUB_CX} y="534" textAnchor="middle" fontFamily={SANS_FAMILY} fontSize="26" fontWeight="700" fill={fg} fillOpacity="0.65" letterSpacing="1">
              {formatDate(reward.redeemed_at)}
            </text>
          )}
        </g>
      )}

      <text x={STUB_CX} y="696" textAnchor="middle" fontFamily={SANS_FAMILY} fontSize="27" fontWeight="800" fill={fg} fillOpacity="0.55" letterSpacing="1">
        boostov.ma
      </text>

      {/* Redeemed stamp */}
      {isUsed && (
        <g transform={`rotate(-14 ${STUB_X / 2} 330)`} opacity="0.85">
          <rect x={STUB_X / 2 - 230} y="280" width="460" height="104" rx="18" fill={lightText ? '#7F1D1D' : '#FEF2F2'} fillOpacity="0.35" stroke={lightText ? '#FCA5A5' : '#B91C1C'} strokeWidth="7" />
          <text x={STUB_X / 2} y="355" textAnchor="middle" fontFamily={SANS_FAMILY} fontSize="62" fontWeight="900" fill={lightText ? '#FCA5A5' : '#B91C1C'} letterSpacing="10">REDEEMED</text>
        </g>
      )}
    </svg>
  );
};
