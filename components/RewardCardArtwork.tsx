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
}

interface TextFit {
  fontSize: number;
  textLength?: number;
}

const VIEW_W = 1200;
const VIEW_H = 757;
const PAD = 72;
const CONTENT_RIGHT = VIEW_W - PAD;

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

function Label({ x, y, anchor = 'start', fg, children }: { x: number; y: number; anchor?: 'start' | 'middle' | 'end'; fg: string; children: React.ReactNode }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={SANS_FAMILY} fontSize="15" fontWeight="700" fill={fg} fillOpacity="0.62" letterSpacing="3">
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
}) => {
  const primaryColor = normalizeHexColor(business.primary_color);
  const fg = getContrastTextColor(primaryColor);
  const lightText = fg === '#FFFFFF';
  const gradientEnd = shadeColor(primaryColor, lightText ? 0.3 : 0.8);
  const logoToRender = logoDataUrl !== undefined ? logoDataUrl : business.logo_url;
  const initials = useMemo(() => initialsFor(business.name), [business.name]);

  const customerName = (reward.customer_name || 'CUSTOMER').trim().toUpperCase();
  const discountLabel = `${reward.discount_percentage}% OFF`;

  const nameFit = fitText(business.name, 720, 40, 22, 0.56);
  const discountFit = fitText(discountLabel, 1040, 128, 64, 0.55);
  const customerFit = fitText(customerName, 1040, 48, 30, 0.62);
  const phoneFit = fitText(reward.customer_phone, 360, 32, 20, 0.6);

  const pillText = 'NEXT VISIT · ONE USE';
  const pillWidth = Math.ceil(pillText.length * 0.62 * 16 + (pillText.length - 1) * 3) + 52;
  const pillHeight = 46;
  const pillX = PAD + 150;
  const pillY = 233;

  return (
    <svg
      id={id}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={`${business.name} reward card, ${discountLabel}, card number ${formatSerialNumber(reward.serial_number)}`}
    >
      <defs>
        <linearGradient id="rewardCardBgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={gradientEnd} />
        </linearGradient>
        <linearGradient id="rewardCardSheen" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rewardCardChip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F7E2A6" />
          <stop offset="50%" stopColor="#C9A250" />
          <stop offset="100%" stopColor="#F1D48A" />
        </linearGradient>
        <linearGradient id="rewardCardRim" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
        </linearGradient>
        <clipPath id="rewardCardClip">
          <rect width={VIEW_W} height={VIEW_H} rx="44" />
        </clipPath>
        <clipPath id="rewardCardLogoClip">
          <rect x={PAD} y="64" width="100" height="100" rx="26" />
        </clipPath>
      </defs>

      <g clipPath="url(#rewardCardClip)">
        <rect width={VIEW_W} height={VIEW_H} fill="url(#rewardCardBgGrad)" />

        {/* Signal arcs motif */}
        <g fill="none" stroke={fg} strokeOpacity="0.07" strokeWidth="2">
          {[180, 270, 360, 450, 540, 630].map((r) => (
            <circle key={r} cx={VIEW_W + 40} cy={VIEW_H + 40} r={r} />
          ))}
        </g>
        <path d={`M0 0 H${VIEW_W * 0.72} L${VIEW_W * 0.38} ${VIEW_H} H0 Z`} fill="url(#rewardCardSheen)" />
      </g>
      <rect x="2" y="2" width={VIEW_W - 4} height={VIEW_H - 4} rx="42" fill="none" stroke="url(#rewardCardRim)" strokeWidth="3" />

      {/* Logo (business initials underlay, real logo overlay when available) */}
      <rect x={PAD} y="64" width="100" height="100" rx="26" fill={fg} fillOpacity="0.12" stroke={fg} strokeOpacity="0.24" strokeWidth="2" />
      <text x={PAD + 50} y="129" textAnchor="middle" fontFamily={SANS_FAMILY} fontSize="40" fontWeight="800" fill={fg} fillOpacity="0.9" letterSpacing="0.5">
        {initials}
      </text>
      {logoToRender && (
        <image
          href={logoToRender}
          x={PAD}
          y="64"
          width="100"
          height="100"
          preserveAspectRatio="xMidYMid meet"
          clipPath="url(#rewardCardLogoClip)"
        />
      )}

      {/* Business name + card type */}
      <text
        x={PAD + 124}
        y="112"
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
      <Label x={PAD + 126} y={148} fg={fg}>REWARD CARD</Label>

      {/* Contactless mark (top right) */}
      <g transform={`translate(${CONTENT_RIGHT - 52} 72)`} fill="none" stroke={fg} strokeOpacity="0.85" strokeWidth="6" strokeLinecap="round">
        <path d="M8 14 a30 30 0 0 1 0 52" />
        <path d="M24 4 a46 46 0 0 1 0 72" />
        <path d="M40 -6 a62 62 0 0 1 0 92" />
      </g>

      {/* Chip */}
      <g transform={`translate(${PAD} 214)`}>
        <rect width="118" height="86" rx="16" fill="url(#rewardCardChip)" />
        <g fill="none" stroke="#8A6A2A" strokeOpacity="0.55" strokeWidth="2.5">
          <rect x="38" y="18" width="42" height="50" rx="9" />
          <path d="M0 30 H38 M0 56 H38 M80 30 H118 M80 56 H118 M59 0 V18 M59 68 V86" />
        </g>
      </g>

      {/* NEXT VISIT pill */}
      <rect x={pillX} y={pillY} width={pillWidth} height={pillHeight} rx={pillHeight / 2} fill={fg} fillOpacity="0.12" stroke={fg} strokeOpacity="0.24" strokeWidth="1.5" />
      <text x={pillX + 26} y={pillY + pillHeight / 2 + 6} fontFamily={SANS_FAMILY} fontSize="16" fontWeight="800" fill={fg} fillOpacity="0.9" letterSpacing="3">
        {pillText}
      </text>

      {/* Hero: discount */}
      <text
        x={PAD - 4}
        y="438"
        fontFamily={SANS_FAMILY}
        fontSize={discountFit.fontSize}
        fontWeight="900"
        fill={fg}
        letterSpacing="-3"
        textLength={discountFit.textLength}
        lengthAdjust={discountFit.textLength ? 'spacingAndGlyphs' : undefined}
      >
        {discountLabel}
      </text>

      {/* Cardholder */}
      <Label x={PAD} y={494} fg={fg}>CARDHOLDER</Label>
      <text
        x={PAD}
        y="544"
        fontFamily={SANS_FAMILY}
        fontSize={customerFit.fontSize}
        fontWeight="800"
        fill={fg}
        letterSpacing="2"
        textLength={customerFit.textLength}
        lengthAdjust={customerFit.textLength ? 'spacingAndGlyphs' : undefined}
      >
        {customerName}
      </text>

      {/* Divider */}
      <line x1={PAD} y1="590" x2={CONTENT_RIGHT} y2="590" stroke={fg} strokeOpacity="0.2" strokeWidth="2" />

      {/* Bottom row: card number / phone / issued */}
      <Label x={PAD} y={634} fg={fg}>CARD NO.</Label>
      <text x={PAD} y="684" fontFamily={MONO_FAMILY} fontSize="38" fontWeight="800" fill={fg} letterSpacing="2">
        #{formatSerialNumber(reward.serial_number)}
      </text>

      <Label x={430} y={634} fg={fg}>PHONE</Label>
      <text
        x={430}
        y="680"
        fontFamily={SANS_FAMILY}
        fontSize={phoneFit.fontSize}
        fontWeight="800"
        fill={fg}
        letterSpacing="1"
        textLength={phoneFit.textLength}
        lengthAdjust={phoneFit.textLength ? 'spacingAndGlyphs' : undefined}
      >
        {reward.customer_phone}
      </text>

      <Label x={CONTENT_RIGHT} y={634} anchor="end" fg={fg}>ISSUED</Label>
      <text x={CONTENT_RIGHT} y="680" textAnchor="end" fontFamily={SANS_FAMILY} fontSize="28" fontWeight="800" fill={fg} letterSpacing="1.5">
        {formatDate(reward.created_at)}
      </text>
      <text x={CONTENT_RIGHT} y="716" textAnchor="end" fontFamily={SANS_FAMILY} fontSize="15" fontWeight="700" fill={fg} fillOpacity="0.55" letterSpacing="1">
        boostov.ma
      </text>
    </svg>
  );
};
