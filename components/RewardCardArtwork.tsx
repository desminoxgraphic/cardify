'use client';

import React, { useMemo } from 'react';
import { Business, PublicBusiness, Reward } from '@/lib/types';
import { formatDate, formatSerialNumber } from '@/lib/utils';
import { getBrandTheme } from '@/lib/brand-theme';

interface RewardCardArtworkProps {
  business: Business | PublicBusiness;
  reward: Reward;
  logoDataUrl?: string | null;
  id?: string;
  className?: string;
  /** Placeholder rendering before the real card exists (no number, status or date). */
  preview?: boolean;
}

const W = 1200;
const H = 740;
const STUB_X = 800;
const CX = STUB_X + (W - STUB_X) / 2;
const NOTCH = 26;

// Inline the page fonts; the PNG export swaps these for embedded copies.
const DISPLAY = "var(--font-display), var(--font-arabic), 'Arial Black', 'Segoe UI', sans-serif";
const SANS = "var(--font-sans), var(--font-arabic), 'Segoe UI', Roboto, Arial, sans-serif";

const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/;

function fit(text: string, maxWidth: number, max: number, min: number, factor: number) {
  const len = Math.max(text.trim().length, 1);
  let size = max;
  if (factor * size * len > maxWidth) size = Math.max(min, maxWidth / (factor * len));
  const overflow = factor * size * len > maxWidth;
  return { size: Math.round(size), textLength: overflow ? maxWidth : undefined };
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const value = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
  return value.toUpperCase() || 'B';
}

function splitTwoLines(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return [name, ''];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

function Badge({ x, icon, lines, accent }: { x: number; icon: React.ReactNode; lines: [string, string]; accent: string }) {
  return (
    <g>
      <g transform={`translate(${x - 26} 478)`} fill="none" stroke={accent} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </g>
      <text x={x} y="572" textAnchor="middle" style={{ fontFamily: SANS }} fontSize="25" fontWeight="800" fill="#FFFFFF" letterSpacing="1.5">{lines[0]}</text>
      <text x={x} y="602" textAnchor="middle" style={{ fontFamily: SANS }} fontSize="25" fontWeight="800" fill="#FFFFFF" letterSpacing="1.5">{lines[1]}</text>
    </g>
  );
}

export const RewardCardArtwork: React.FC<RewardCardArtworkProps> = ({
  business,
  reward,
  logoDataUrl,
  id = 'cardify-reward-svg',
  className = 'w-full h-auto',
  preview = false,
}) => {
  const theme = getBrandTheme(business.primary_color);
  const used = !preview && reward.status === 'USED';
  // Metal: gold while active, silver once used.
  const metal = used ? ['#F4F4F6', '#B9BCC4', '#7E828C'] : ['#FFE7A0', '#F5C542', '#C8901A'];
  const accent = used ? '#C9CCD3' : '#F5C542';
  const logoToRender = logoDataUrl !== undefined ? logoDataUrl : business.logo_url;
  const initials = useMemo(() => initialsFor(business.name), [business.name]);

  // Business name: last word in gold (Latin names), one or two lines.
  const isRtlName = RTL.test(business.name);
  const nameMaxW = STUB_X - 236 - 44;
  const single = fit(business.name, nameMaxW, 62, 30, 0.66);
  const twoLines = single.size < 42 && business.name.trim().includes(' ');
  const [line1, line2] = twoLines ? splitTwoLines(business.name) : [business.name, ''];
  const lineFit = twoLines ? fit(line1.length > line2.length ? line1 : line2, nameMaxW, 48, 26, 0.66) : single;
  const words = line1.trim().split(/\s+/);
  const goldTail = !isRtlName && !twoLines && words.length > 1;

  const percentDigits = `${reward.discount_percentage}`;
  const digitsFit = fit(percentDigits, 360, 236, 150, 0.6);
  const digitsW = Math.min(percentDigits.length * 0.54 * digitsFit.size, 360);
  const holder = reward.customer_name.trim();
  const holderText = holder || (preview ? 'Your name' : 'Customer');
  const holderRtl = RTL.test(holderText);
  const holderFit = fit(holderText, 640, 32, 20, 0.6);
  const meta = preview
    ? 'Issue date added when your card is created'
    : `Issued ${formatDate(reward.created_at)}  ·  ${reward.customer_phone}`;
  const metaFit = fit(meta, 640, 24, 16, 0.55);
  const serial = preview ? '———' : formatSerialNumber(reward.serial_number);

  const arcs = useMemo(() => [140, 190, 240, 290, 340, 390].map((r) => r), []);

  return (
    <svg
      id={id}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={
        preview
          ? `${business.name} reward card preview, ${reward.discount_percentage}% off`
          : `${business.name} reward card for ${holderText}, ${reward.discount_percentage}% off, card number ${serial}, ${used ? 'used' : 'active'}`
      }
    >
      <defs>
        <linearGradient id="rcMetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={metal[0]} />
          <stop offset="0.5" stopColor={metal[1]} />
          <stop offset="1" stopColor={metal[2]} />
        </linearGradient>
        <linearGradient id="rcMetalH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={metal[1]} stopOpacity="0" />
          <stop offset="0.5" stopColor={metal[1]} />
          <stop offset="1" stopColor={metal[1]} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rcIvory" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F5F1E7" />
        </linearGradient>
        <linearGradient id="rcPanel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={theme.neutral ? '#1C1C20' : theme.deep} />
          <stop offset="1" stopColor={theme.dark} />
        </linearGradient>
        <linearGradient id="rcStub" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={theme.neutral ? '#18181B' : theme.deep} />
          <stop offset="1" stopColor={theme.dark} />
        </linearGradient>
        <linearGradient id="rcHolo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F0ABFC" />
          <stop offset="0.3" stopColor="#93C5FD" />
          <stop offset="0.55" stopColor="#6EE7B7" />
          <stop offset="0.8" stopColor="#FDE68A" />
          <stop offset="1" stopColor="#FCA5A5" />
        </linearGradient>
        <linearGradient id="rcSheen" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0.03" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rcChip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F7E2A6" />
          <stop offset="0.5" stopColor="#C9A250" />
          <stop offset="1" stopColor="#F1D48A" />
        </linearGradient>
        <mask id="rcShape">
          <rect width={W} height={H} rx="40" fill="#FFFFFF" />
          <circle cx={STUB_X} cy="0" r={NOTCH} fill="#000000" />
          <circle cx={STUB_X} cy={H} r={NOTCH} fill="#000000" />
        </mask>
        <clipPath id="rcHero">
          <rect x="-40" y="346" width="772" height="266" rx="38" />
        </clipPath>
        <clipPath id="rcLogo">
          <rect x="76" y="72" width="108" height="108" rx="22" />
        </clipPath>
      </defs>

      {/* Body */}
      <g mask="url(#rcShape)">
        <rect width={W} height={H} fill="url(#rcIvory)" />
        <rect x={STUB_X} y="0" width={W - STUB_X} height={H} fill="url(#rcStub)" />
        <rect x={STUB_X} y="0" width={W - STUB_X} height={H} fill="url(#rcSheen)" />

        {/* Used: corner ribbon (never over text) */}
        {used && (
          <g>
            <path d={`M${W - 150} 0 H${W - 96} L${W} 96 V150 Z`} fill="#C9CCD3" />
            <text
              x={W - 64}
              y="64"
              transform={`rotate(45 ${W - 64} 64)`}
              textAnchor="middle"
              style={{ fontFamily: SANS }}
              fontSize="17"
              fontWeight="900"
              fill="#2A2C31"
              letterSpacing="3"
            >
              REDEEMED
            </text>
          </g>
        )}
        <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="39" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="3" />
      </g>

      {/* Perforation */}
      <line x1={STUB_X} y1={NOTCH + 14} x2={STUB_X} y2={H - NOTCH - 14} stroke="#111113" strokeOpacity="0.55" strokeWidth="6" strokeDasharray="0.1 15" strokeLinecap="round" />

      {/* Logo tile */}
      <rect x="58" y="54" width="144" height="144" rx="34" fill="#FFFFFF" />
      <rect x="62" y="58" width="136" height="136" rx="30" fill="none" stroke="url(#rcMetal)" strokeWidth="8" />
      <text x="130" y="148" textAnchor="middle" style={{ fontFamily: DISPLAY }} fontSize="56" fontWeight="800" fill="#111113">{initials}</text>
      {logoToRender && (
        <>
          <rect x="76" y="72" width="108" height="108" rx="22" fill="#FFFFFF" />
          <image href={logoToRender} x="76" y="72" width="108" height="108" preserveAspectRatio="xMidYMid meet" clipPath="url(#rcLogo)" />
        </>
      )}

      {/* Business name */}
      {twoLines ? (
        <>
          <text x="236" y="112" style={{ fontFamily: DISPLAY }} fontSize={lineFit.size} fontWeight="800" fill="#111113" textLength={lineFit.textLength} lengthAdjust={lineFit.textLength ? 'spacingAndGlyphs' : undefined}>{line1}</text>
          <text x="236" y={112 + lineFit.size + 2} style={{ fontFamily: DISPLAY }} fontSize={lineFit.size} fontWeight="800" fill="url(#rcMetal)" stroke={metal[2]} strokeWidth="0.6" textLength={lineFit.textLength} lengthAdjust={lineFit.textLength ? 'spacingAndGlyphs' : undefined}>{line2}</text>
        </>
      ) : (
        <text
          x={isRtlName ? 236 + nameMaxW : 236}
          y="136"
          direction={isRtlName ? 'rtl' : undefined}
          textAnchor={isRtlName ? 'start' : undefined}
          style={{ fontFamily: DISPLAY }}
          fontSize={single.size}
          fontWeight="800"
          fill="#111113"
          letterSpacing="-0.5"
          textLength={single.textLength}
          lengthAdjust={single.textLength ? 'spacingAndGlyphs' : undefined}
        >
          {goldTail ? (
            <>
              {words.slice(0, -1).join(' ')}{' '}
              <tspan fill="url(#rcMetal)" stroke={metal[2]} strokeWidth="0.6">{words[words.length - 1]}</tspan>
            </>
          ) : (
            business.name
          )}
        </text>
      )}
      <line x1="236" y1={twoLines ? 196 : 182} x2="272" y2={twoLines ? 196 : 182} stroke="url(#rcMetal)" strokeWidth="3" />
      <text x="286" y={twoLines ? 205 : 191} style={{ fontFamily: SANS }} fontSize="24" fontWeight="700" fill="#111113" fillOpacity="0.82" letterSpacing="10">REWARD CARD</text>
      <line x1="572" y1={twoLines ? 196 : 182} x2="608" y2={twoLines ? 196 : 182} stroke="url(#rcMetal)" strokeWidth="3" />

      {/* Chip + contactless */}
      <g transform="translate(60 236)">
        <rect width="118" height="88" rx="16" fill="url(#rcChip)" />
        <g fill="none" stroke="#8A6A2A" strokeOpacity="0.55" strokeWidth="2.6">
          <rect x="38" y="19" width="42" height="50" rx="9" />
          <path d="M0 31 H38 M0 57 H38 M80 31 H118 M80 57 H118 M59 0 V19 M59 69 V88" />
        </g>
      </g>
      <g transform="translate(206 250)" fill="none" stroke="#111113" strokeWidth="6" strokeLinecap="round">
        <path d="M6 16 a26 26 0 0 1 0 30" />
        <path d="M20 8 a40 40 0 0 1 0 46" />
        <path d="M34 0 a54 54 0 0 1 0 62" />
      </g>

      {/* Hero panel */}
      <g clipPath="url(#rcHero)">
        <rect x="-40" y="346" width="772" height="266" fill="url(#rcPanel)" />
        <g fill="none" stroke="#FFFFFF" strokeOpacity="0.06" strokeWidth="2">
          {arcs.map((r) => <circle key={r} cx="740" cy="640" r={r} />)}
        </g>
        <path d="M-40 346 H520 L380 612 H-40 Z" fill="url(#rcSheen)" />
      </g>
      <text x="52" y="540" style={{ fontFamily: DISPLAY }} fontStyle="italic" fontSize={digitsFit.size} fontWeight="900" fill="#FFFFFF" letterSpacing="-6">
        {percentDigits}
      </text>
      <text x={64 + digitsW} y="452" style={{ fontFamily: DISPLAY }} fontStyle="italic" fontSize="112" fontWeight="900" fill="url(#rcMetal)">%</text>
      <text x={60 + digitsW} y="544" style={{ fontFamily: DISPLAY }} fontStyle="italic" fontSize="104" fontWeight="900" fill="#FFFFFF" letterSpacing="-2">OFF</text>
      <text x="58" y="590" style={{ fontFamily: DISPLAY }} fontStyle="italic" fontSize="29" fontWeight="800" fill="#FFFFFF" letterSpacing="4">
        ON YOUR <tspan fill={accent}>NEXT VISIT</tspan>
      </text>

      {/* Holder strip */}
      <g transform="translate(60 642)" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="6" width="44" height="40" rx="8" />
        <path d="M0 18 H44 M12 0 V12 M32 0 V12" />
        <circle cx="12" cy="30" r="2" fill={accent} />
        <circle cx="22" cy="30" r="2" fill={accent} />
        <circle cx="32" cy="30" r="2" fill={accent} />
      </g>
      <text
        x={holderRtl ? 124 + 640 : 124}
        y="666"
        direction={holderRtl ? 'rtl' : undefined}
        style={{ fontFamily: SANS }}
        fontSize={holderFit.size}
        fontWeight="800"
        fill="#111113"
        fillOpacity={preview && !holder ? 0.4 : 1}
        textLength={holderFit.textLength}
        lengthAdjust={holderFit.textLength ? 'spacingAndGlyphs' : undefined}
      >
        {holderText}
      </text>
      <text x="124" y="702" style={{ fontFamily: SANS }} fontSize={metaFit.size} fontWeight="600" fill="#6B6B75" textLength={metaFit.textLength} lengthAdjust={metaFit.textLength ? 'spacingAndGlyphs' : undefined}>
        {meta}
      </text>

      {/* Stub: one-use ring */}
      <circle cx={CX} cy="150" r="104" fill="url(#rcHolo)" fillOpacity="0.1" />
      <circle cx={CX} cy="150" r="104" fill="none" stroke="url(#rcMetal)" strokeWidth="8" />
      <circle cx={CX} cy="150" r="104" fill="none" stroke="url(#rcHolo)" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="60 260" />
      <text x={CX} y="166" textAnchor="middle" style={{ fontFamily: DISPLAY }} fontSize="92" fontWeight="900" fill="#FFFFFF">
        1<tspan fill="url(#rcMetal)" fontSize="70">×</tspan>
      </text>
      <text x={CX} y="208" textAnchor="middle" style={{ fontFamily: SANS }} fontSize="25" fontWeight="800" fill="#FFFFFF" letterSpacing="1.5">ONE USE</text>
      <text x={CX} y="238" textAnchor="middle" style={{ fontFamily: SANS }} fontSize="25" fontWeight="800" fill={accent} letterSpacing="1.5">ONLY</text>

      <rect x={CX - 120} y="298" width="240" height="2.5" fill="url(#rcMetalH)" />
      <text x={CX} y="350" textAnchor="middle" style={{ fontFamily: SANS }} fontSize="25" fontWeight="800" fill={accent} letterSpacing="5">CARD NO.</text>
      <text x={CX} y="418" textAnchor="middle" style={{ fontFamily: DISPLAY }} fontSize="64" fontWeight="800" fill="#FFFFFF" letterSpacing="2">
        <tspan fill="url(#rcMetal)">#</tspan> {serial}
      </text>
      <rect x={CX - 120} y="452" width="240" height="2.5" fill="url(#rcMetalH)" />

      {/* Factual badges */}
      <Badge
        x={CX - 120}
        accent={accent}
        lines={[`${reward.discount_percentage}%`, 'OFF']}
        icon={<><path d="M4 26 L26 4 H48 V26 L26 48 Z" /><circle cx="37" cy="15" r="4" /></>}
      />
      <Badge
        x={CX}
        accent={accent}
        lines={['ONE', 'USE']}
        icon={<><path d="M26 2 L46 10 V26 C46 38 37 46 26 50 C15 46 6 38 6 26 V10 Z" /><path d="M16 26 L23 33 L37 19" /></>}
      />
      <Badge
        x={CX + 120}
        accent={accent}
        lines={['NEXT', 'VISIT']}
        icon={<><rect x="4" y="8" width="44" height="40" rx="7" /><path d="M4 20 H48 M16 2 V12 M36 2 V12" /></>}
      />

      {/* Status (real data only) */}
      {preview ? (
        <g>
          <rect x={CX - 140} y="640" width="280" height="58" rx="29" fill="#FFFFFF" fillOpacity="0.06" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="6 6" />
          <text x={CX} y="677" textAnchor="middle" style={{ fontFamily: SANS }} fontSize="22" fontWeight="800" fill="#FFFFFF" fillOpacity="0.7" letterSpacing="3">PREVIEW</text>
        </g>
      ) : (
        <g>
          <rect x={CX - 140} y="640" width="280" height="58" rx="29" fill={accent} fillOpacity="0.12" stroke="url(#rcMetal)" strokeWidth="3" />
          <circle cx={used ? CX - 116 : CX - 100} cy="669" r="8" fill={used ? '#9CA3AF' : '#4ADE80'} />
          <text x={used ? CX + 10 : CX + 14} y="677" textAnchor="middle" style={{ fontFamily: SANS }} fontSize={used ? 18 : 25} fontWeight="900" fill="#FFFFFF" letterSpacing={used ? 1 : 4}>
            {used ? `USED${reward.redeemed_at ? ` · ${formatDate(reward.redeemed_at)}` : ''}` : 'ACTIVE'}
          </text>
        </g>
      )}
    </svg>
  );
};
