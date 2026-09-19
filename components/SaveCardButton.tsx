'use client';

import React, { useState } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import { formatSerialNumber } from '@/lib/utils';
import { Reward, Business, PublicBusiness } from '@/lib/types';

const EXPORT_WIDTH = 1200;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Logo conversion failed.'));
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Logo conversion returned no data.'));
    reader.readAsDataURL(blob);
  });
}

async function embedRemoteImages(svg: SVGElement): Promise<void> {
  const images = Array.from(svg.querySelectorAll('image'));
  for (const img of images) {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href');
    if (!href || href.startsWith('data:')) continue;
    if (!/^https?:\/\//i.test(href)) continue;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const resp = await fetch(href, { signal: controller.signal, mode: 'cors' });
      if (!resp.ok) throw new Error(`Logo request failed with ${resp.status}.`);
      const blob = await resp.blob();
      if (!blob.type.startsWith('image/')) throw new Error('Logo response was not an image.');
      const dataUrl = await blobToDataUrl(blob);
      img.setAttribute('href', dataUrl);
      img.removeAttribute('xlink:href');
    } catch (err) {
      console.warn('Logo unavailable during card export; using business initials.', err);
      img.remove();
    } finally {
      window.clearTimeout(timeout);
    }
  }
}

function exportHeight(width: number, svg: SVGElement): number {
  const viewBox = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  if (viewBox.length === 4 && viewBox[2] > 0 && viewBox[3] > 0) {
    return Math.round((width * viewBox[3]) / viewBox[2]);
  }
  return Math.round(width / 1.586);
}

interface SaveCardButtonProps {
  business: Business | PublicBusiness;
  reward: Reward;
  svgId?: string;
}

export const SaveCardButton: React.FC<SaveCardButtonProps> = ({
  business,
  reward,
  svgId = 'cardify-reward-svg',
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

      // Embed remote logo (e.g. Supabase Storage) as a data URL before serializing.
      // If it cannot be fetched, the initials fallback already rendered underneath stays in place.
      await embedRemoteImages(svg);

      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svg);
      if (!svgString.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      if (!svgString.match(/xmlns:xlink=/)) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
      }

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const objectUrl = URL.createObjectURL(svgBlob);

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
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${business.slug}-card-${formatSerialNumber(reward.serial_number)}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);

      setSaved(true);
      window.setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error('Card export failed:', err);
      setError("Couldn't save your card. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={saving}
        className="w-full bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-75 text-base"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Saving...</span>
          </>
        ) : saved ? (
          <>
            <Check className="w-5 h-5 text-white" />
            <span>Saved ✓</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>Save Card</span>
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="text-xs font-medium text-[#DC2626]">
          {error}
        </p>
      )}
    </div>
  );
};