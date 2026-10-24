'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, X, RefreshCw, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
  onRemove: () => void;
  placeholder?: string;
  aspect?: 'square' | 'wide';
  kind: 'logo' | 'cover';
  businessId: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  onRemove,
  placeholder = 'Upload PNG, JPG or WEBP',
  aspect = 'square',
  kind,
  businessId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Unsupported file type. Please upload PNG, JPG, or WEBP.');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    setUploading(true);

    try {
      const form = new FormData();
      form.set('file', file);
      form.set('kind', kind);
      form.set('business_id', businessId);
      const response = await fetch('/api/admin/assets', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Upload failed.');
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[13px] font-bold text-ink-950">
        {label}
      </label>

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-ink-200 bg-ivory-50 p-3">
          <div className="flex items-center gap-3">
            <div
              className={`relative rounded-xl overflow-hidden bg-white border border-ink-200 flex items-center justify-center shrink-0 ${
                aspect === 'square' ? 'w-16 h-16' : 'w-28 h-16'
              }`}
            >
              <Image src={value} alt={`${label} preview`} fill sizes={aspect === 'square' ? '64px' : '112px'} className="object-contain p-1" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink-950">Image Uploaded</p>
              <p className="text-xs text-success-600 font-semibold">Ready for store use ✓</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-[40px] bg-white hover:bg-slate-50 border border-ink-200 text-ink-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              title="Replace image"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replace</span>
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="w-10 min-h-[40px] bg-red-50 hover:bg-red-100 text-danger-600 rounded-xl flex items-center justify-center transition-colors border border-red-200"
              title="Remove image"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full min-h-[118px] border-2 border-dashed border-ink-300 hover:border-gold-400 bg-ivory-50 hover:bg-gold-50/40 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-70"
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-gold-700 text-xs font-bold">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading & Processing...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink-950">Click to upload {label.toLowerCase()}</p>
                <p className="text-[11px] text-ink-500">{placeholder}</p>
              </div>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-danger-600 font-medium">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
