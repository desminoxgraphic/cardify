import { normalizeHexColor } from './reward-rules';

function toRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function shade(hex: string, factor: number): string {
  return toHex(toRgb(hex).map((c) => c * factor) as [number, number, number]);
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Brand palette for customer screens. `deep` is the business colour darkened just enough
 * for white text to stay readable (WCAG AA on body text), so light brand colours still work.
 */
export function getBrandTheme(value: string | null | undefined) {
  let deep = normalizeHexColor(value);
  for (let i = 0; i < 24 && relativeLuminance(deep) > 0.16; i++) deep = shade(deep, 0.9);
  return {
    base: normalizeHexColor(value),
    deep,
    dark: shade(deep, 0.42),
    light: toHex(toRgb(deep).map((c) => c + (255 - c) * 0.22) as [number, number, number]),
  };
}
