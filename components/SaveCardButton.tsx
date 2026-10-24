'use client';

import React, { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { formatSerialNumber } from '@/lib/utils';
import { Reward, Business, PublicBusiness } from '@/lib/types';
import { Button, type ButtonVariant } from '@/components/ui';

const EXPORT_WIDTH = 1500;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Conversion failed.'));
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('No data.')));
    reader.readAsDataURL(blob);
  });
}

async function embedRemoteImages(svg: SVGElement): Promise<void> {
  for (const img of Array.from(svg.querySelectorAll('image'))) {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href');
    if (!href || href.startsWith('data:')) continue;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const resp = await fetch(new URL(href, window.location.href).toString(), { signal: controller.signal, mode: 'cors' });
      if (!resp.ok) throw new Error(`Logo request failed with ${resp.status}.`);
      const blob = await resp.blob();
      if (!blob.type.startsWith('image/')) throw new Error('Logo response was not an image.');
      img.setAttribute('href', await blobToDataUrl(blob));
      img.removeAttribute('xlink:href');
    } catch (err) {
      console.warn('Logo unavailable during card export; using business initials.', err);
      img.remove();
    } finally {
      window.clearTimeout(timeout);
    }
  }
}

/** Replace CSS font variables with the real family names and embed those fonts, so the PNG matches the screen. */
async function embedFonts(svg: SVGElement): Promise<void> {
  const root = getComputedStyle(document.documentElement);
  const families = new Set<string>();
  svg.querySelectorAll<SVGElement>('[style*="font-family"]').forEach((el) => {
    const resolved = el.style.fontFamily.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
      const value = root.getPropertyValue(name).trim();
      value.split(',').forEach((f) => families.add(f.trim().replace(/^['"]|['"]$/g, '')));
      return value;
    });
    el.style.fontFamily = resolved;
  });

  const faces: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = rule.style.getPropertyValue('font-family').trim().replace(/^['"]|['"]$/g, '');
      if (!families.has(family)) continue;
      const match = rule.style.getPropertyValue('src').match(/url\(["']?([^"')]+)["']?\)/);
      if (!match) continue;
      try {
        const resp = await fetch(new URL(match[1], sheet.href || window.location.href).toString());
        if (!resp.ok) continue;
        const dataUrl = await blobToDataUrl(await resp.blob());
        faces.push(
          `@font-face{font-family:'${family}';src:url(${dataUrl});font-weight:${rule.style.getPropertyValue('font-weight') || 'normal'};font-style:${rule.style.getPropertyValue('font-style') || 'normal'};unicode-range:${rule.style.getPropertyValue('unicode-range') || 'U+0-10FFFF'};}`
        );
      } catch {
        // Font fetch failed: the system fallback in the font stack is used instead.
      }
    }
  }
  if (faces.length) {
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = faces.join('');
    svg.insertBefore(style, svg.firstChild);
  }
}

function exportHeight(width: number, svg: SVGElement): number {
  const viewBox = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  if (viewBox.length === 4 && viewBox[2] > 0 && viewBox[3] > 0) return Math.round((width * viewBox[3]) / viewBox[2]);
  return Math.round(width / 1.62);
}

interface SaveCardButtonProps {
  business: Business | PublicBusiness;
  reward: Reward;
  svgId?: string;
  variant?: ButtonVariant;
  label?: string;
}

export const SaveCardButton: React.FC<SaveCardButtonProps> = ({
  business,
  reward,
  svgId = 'cardify-reward-svg',
  variant = 'gold',
  label = 'Save card to photos',
}) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const source = document.getElementById(svgId) as unknown as SVGElement | null;
      if (!source) throw new Error('Reward card SVG element not found.');

      // Same artwork that is displayed; clone it so the visible DOM is untouched.
      const svg = source.cloneNode(true) as SVGElement;
      svg.removeAttribute('id');
      svg.removeAttribute('class');
      svg.removeAttribute('style');

      const width = EXPORT_WIDTH;
      const height = exportHeight(width, svg);
      svg.setAttribute('width', String(width));
      svg.setAttribute('height', String(height));

      await document.fonts?.ready;
      await embedFonts(svg);
      // Embed the remote logo as a data URL; if it cannot be fetched, the initials underneath stay visible.
      await embedRemoteImages(svg);

      let svgString = new XMLSerializer().serializeToString(svg);
      if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(svgString)) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      if (!/xmlns:xlink=/.test(svgString)) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
      }

      const objectUrl = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not supported.');

      const rendered = new Image();
      rendered.decoding = 'sync';
      await new Promise<void>((resolve, reject) => {
        rendered.onload = () => {
          ctx.drawImage(rendered, 0, 0, width, height);
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        rendered.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('SVG could not be rendered onto canvas.'));
        };
        rendered.src = objectUrl;
      });

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed.'))), 'image/png');
      });

      const pngUrl = URL.createObjectURL(pngBlob);
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `${business.slug}-card-${formatSerialNumber(reward.serial_number)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);

      setSaved(true);
      window.setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error('Card export failed:', err);
      setError("Couldn't save your card. Please try again, or take a screenshot.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button
        variant={variant}
        size="lg"
        full
        onClick={handleDownload}
        loading={saving}
        icon={saved ? <Check className="w-5 h-5" /> : saving ? undefined : <Download className="w-5 h-5" />}
      >
        {saving ? 'Saving...' : saved ? 'Saved ✓' : label}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-danger-600 text-center">
          {error}
        </p>
      )}
    </div>
  );
};
