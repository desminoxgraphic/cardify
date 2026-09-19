export function formatSerialNumber(num: number): string {
  return Math.max(0, Math.trunc(num)).toString().padStart(3, '0');
}

export function normalizeHexColor(value: string | null | undefined): string {
  const normalized = value?.trim().toUpperCase() || '';
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : '#2563EB';
}

export function getAccessibleBrandColor(value: string | null | undefined): string {
  const color = normalizeHexColor(value);
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  if (luminance <= 0.58) return color;
  const factor = 0.62;
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel * factor).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
}

export function getContrastTextColor(value: string | null | undefined): string {
  const color = normalizeHexColor(value);
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.5 ? '#0F172A' : '#FFFFFF';
}

export function isValidRewardTransition(current: string, next: string): boolean {
  return current === 'ACTIVE' && next === 'USED';
}
