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

export const RewardCardArtwork: React.FC<RewardCardArtworkProps> = ({
  business,
  reward,
  logoDataUrl,
  id = 'cardify-reward-svg',
  className = 'w-full h-auto drop-shadow-xl',
}) => {
  const primaryColor = normalizeHexColor(business.primary_color);
  const fg = getContrastTextColor(primaryColor);
  const gradientEnd = shadeColor(primaryColor, 0.78);
  const logoToRender = logoDataUrl !== undefined ? logoDataUrl : business.logo_url;
  const initials = useMemo(() => initialsFor(business.name), [business.name]);

  const customerName = (reward.customer_name || 'CUSTOMER').trim().toUpperCase();
  const discountLabel = `${reward.discount_percentage}% OFF`;

  const nameFit = fitText(business.name, 660, 40, 22, 0.56);
  const discountFit = fitText(discountLabel, 1000, 122, 64, 0.52);
  const customerFit = fitText(customerName, 1000, 56, 34, 0.56);

  const pillText = 'NEXT VISIT';
  const pillTextWidth = pillText.length * 0.62 * 16 + (pillText.length - 1) * 3.4;
  const pillWidth = Math.ceil(pillTextWidth) + 56;
  const pillHeight = 46;
  const pillY = 434;

  return (
    <svg
      id={id}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={`${business.name} reward card`}
    >
      <defs>
        <linearGradient id="rewardCardBgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={gradientEnd} />
        </linearGradient>
        <radialGradient id="rewardCardGlow" cx="0.92" cy="0.04" r="0.68">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <clipPath id="rewardCardLogoClip">
          <rect x={PAD} y="66" width="104" height="104" rx="28" />
        </clipPath>
      </defs>

      <rect width={VIEW_W} height={VIEW_H} rx="44" fill="url(#rewardCardBgGrad)" />
      <rect width={VIEW_W} height={VIEW_H} rx="44" fill="url(#rewardCardGlow)" />
      <rect x="3" y="3" width={VIEW_W - 6} height={VIEW_H - 6} rx="41" fill="none" stroke={fg} strokeOpacity="0.14" strokeWidth="3" />

      <circle cx="1130" cy="688" r="248" fill={fg} fillOpacity="0.03" />

      {/* Logo (business initials underlay, real logo overlay when available) */}
      <rect x={PAD} y="66" width="104" height="104" rx="28" fill={fg} fillOpacity="0.12" stroke={fg} strokeOpacity="0.22" strokeWidth="2" />
      <text
        x="124"
        y="133"
        textAnchor="middle"
        fontFamily={SANS_FAMILY}
        fontSize="42"
        fontWeight="800"
        fill={fg}
        fillOpacity="0.9"
        letterSpacing="0.5"
      >
        {initials}
      </text>
      {logoToRender && (
        <image
          href={logoToRender}
          x={PAD}
          y="66"
          width="104"
          height="104"
          preserveAspectRatio="xMidYMid meet"
          clipPath="url(#rewardCardLogoClip)"
        />
      )}

      {/* Business name */}
      <text
        x={PAD + 124}
        y="136"
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

      {/* Created date (top right) */}
      <text
        x={CONTENT_RIGHT}
        y="96"
        textAnchor="end"
        fontFamily={SANS_FAMILY}
        fontSize="16"
        fontWeight="700"
        fill={fg}
        fillOpacity="0.6"
        letterSpacing="3"
      >
        CREATED
      </text>
      <text
        x={CONTENT_RIGHT}
        y="140"
        textAnchor="end"
        fontFamily={SANS_FAMILY}
        fontSize="28"
        fontWeight="800"
        fill={fg}
        letterSpacing="1.5"
      >
        {formatDate(reward.created_at)}
      </text>

      {/* Hero: discount */}
      <text
        x={PAD}
        y="312"
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

      {/* Hero: customer name */}
      <text
        x={PAD}
        y="412"
        fontFamily={SANS_FAMILY}
        fontSize={customerFit.fontSize}
        fontWeight="800"
        fill={fg}
        letterSpacing="0.5"
        textLength={customerFit.textLength}
        lengthAdjust={customerFit.textLength ? 'spacingAndGlyphs' : undefined}
      >
        {customerName}
      </text>

      {/* NEXT VISIT pill */}
      <rect x={PAD} y={pillY} width={pillWidth} height={pillHeight} rx={pillHeight / 2} fill={fg} fillOpacity="0.1" stroke={fg} strokeOpacity="0.2" strokeWidth="1.5" />
      <text
        x={PAD + 28}
        y={pillY + pillHeight / 2 + 6}
        fontFamily={SANS_FAMILY}
        fontSize="16"
        fontWeight="800"
        fill={fg}
        fillOpacity="0.85"
        letterSpacing="3.4"
      >
        {pillText}
      </text>

      {/* Divider */}
      <line x1={PAD} y1="520" x2={CONTENT_RIGHT} y2="520" stroke={fg} strokeOpacity="0.18" strokeWidth="2" />

      {/* Bottom left: card number */}
      <text
        x={PAD}
        y="572"
        fontFamily={SANS_FAMILY}
        fontSize="15"
        fontWeight="700"
        fill={fg}
        fillOpacity="0.6"
        letterSpacing="3"
      >
        CARD NO.
      </text>
      <text
        x={PAD + 1}
        y="630"
        fontFamily={MONO_FAMILY}
        fontSize="40"
        fontWeight="800"
        fill={fg}
        letterSpacing="2"
      >
        #{formatSerialNumber(reward.serial_number)}
      </text>

      {/* Bottom right: phone + validity */}
      <text
        x={CONTENT_RIGHT}
        y="572"
        textAnchor="end"
        fontFamily={SANS_FAMILY}
        fontSize="15"
        fontWeight="700"
        fill={fg}
        fillOpacity="0.6"
        letterSpacing="3"
      >
        PHONE
      </text>
      <text
        x={CONTENT_RIGHT}
        y="622"
        textAnchor="end"
        fontFamily={SANS_FAMILY}
        fontSize="34"
        fontWeight="800"
        fill={fg}
        letterSpacing="1"
      >
        {reward.customer_phone}
      </text>
      <text
        x={CONTENT_RIGHT}
        y="668"
        textAnchor="end"
        fontFamily={SANS_FAMILY}
        fontSize="15"
        fontWeight="600"
        fill={fg}
        fillOpacity="0.6"
        letterSpacing="0.5"
      >
        Valid for one use
      </text>
    </svg>
  );
};