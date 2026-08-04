import * as React from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Label } from '@horizon-sync/ui/components/ui/label';

import { landingPageApi } from '../../../api/landing-page';
import { resolveImageUrl } from './image-url';

interface ImageUploadFieldProps {
  label: string;
  hint: string;
  value: string | null;
  onChange: (url: string | null) => void;
  /** Required for API upload — the selected product ID */
  productId: string;
  /** Required for API upload — auth token */
  accessToken: string | null;
  /** Which image type this field handles */
  imageType: 'logo' | 'banner';
}

/**
 * Image upload field with preview.
 * Uploads to the backend on file selection and stores the full image URL.
 */
export function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  productId,
  accessToken,
  imageType,
}: ImageUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!accessToken) {
      setUploadError('Please log in to upload images.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const response = await landingPageApi.uploadImage(accessToken, productId, file, imageType);
      // Store the relative URL (backend format). Display uses resolveImageUrl().
      onChange(response.url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {value ? (
        <div className="relative rounded-md border overflow-hidden bg-muted/30 h-20">
          <img src={resolveImageUrl(value) ?? undefined} alt={label} className="w-full h-full object-contain" />
          <button
            type="button"
            className="absolute top-1 right-1 h-6 w-6 bg-background/80 rounded-md flex items-center justify-center"
            onClick={() => onChange(null)}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : uploading ? (
        <div className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 text-xs text-muted-foreground border-primary/50">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Uploading...
        </div>
      ) : (
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 text-xs text-muted-foreground hover:border-primary/50 transition-colors"
          onClick={() => inputRef.current?.click()}
          disabled={!productId || !accessToken}
        >
          <Upload className="h-4 w-4" />
          {!productId ? 'Select a product first' : hint}
        </button>
      )}
      {uploadError && (
        <p className="text-[10px] text-destructive">{uploadError}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          // Reset so re-selecting the same file triggers onChange again
          e.target.value = '';
        }}
      />
    </div>
  );
}
