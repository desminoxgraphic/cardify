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

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h * 60, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return toHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}

export function shade(hex: string, factor: number): string {
  return toHex(toRgb(hex).map((c) => c * factor) as [number, number, number]);
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Brand palette for customer screens. `deep` is the business colour deepened just enough
 * for white text to stay readable (WCAG AA on body text). Light colours are deepened in HSL,
 * keeping their hue and saturation, so e.g. yellow becomes rich amber instead of olive.
 */
export function getBrandTheme(value: string | null | undefined) {
  const base = normalizeHexColor(value);
  let deep = base;
  if (relativeLuminance(base) > 0.16) {
    let [h, s, l] = rgbToHsl(toRgb(base));
    if (s > 0.15) {
      s = Math.max(s, 0.78);
      // Pure yellows read as olive when darkened; lean them slightly warmer.
      if (h > 44 && h < 72) h = h - Math.min(10, h - 38);
    }
    for (let i = 0; i < 40 && relativeLuminance(hslToHex(h, s, l)) > 0.16; i++) l -= 0.015;
    deep = hslToHex(h, s, l);
  }
  return {
    base,
    deep,
    dark: shade(deep, 0.42),
    light: toHex(toRgb(deep).map((c) => c + (255 - c) * 0.22) as [number, number, number]),
  };
}
