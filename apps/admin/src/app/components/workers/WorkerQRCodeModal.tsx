import { useEffect, useState, useCallback } from 'react';

import { Download, Printer, X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { useWorkerQRImage } from '../../hooks/useWorkers';

interface WorkerQRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  workerName: string;
  workerEmail: string;
  qrCodeString?: string;
}

export function WorkerQRCodeModal({
  open,
  onOpenChange,
  userId,
  workerName,
  workerEmail,
  qrCodeString,
}: WorkerQRCodeModalProps) {
  const { data: qrBlob, isLoading, isError } = useWorkerQRImage(userId, open);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (qrBlob) {
      const url = URL.createObjectURL(qrBlob);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    return undefined;
  }, [qrBlob]);

  const handleDownload = useCallback(() => {
    if (!objectUrl) return;
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `${workerName.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [objectUrl, workerName]);

  const handlePrint = useCallback(() => {
    if (!objectUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${workerName} - QR Code</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; }
            img { width: 250px; height: 250px; }
            .name { margin-top: 16px; font-size: 16px; font-weight: 600; }
            .email { font-size: 13px; color: #666; margin-top: 4px; }
            .qr-string { font-size: 12px; color: #999; margin-top: 8px; font-family: monospace; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <img src="${objectUrl}" alt="QR Code" />
          <div class="name">${workerName}</div>
          <div class="email">${workerEmail}</div>
          ${qrCodeString ? `<div class="qr-string">${qrCodeString}</div>` : ''}
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [objectUrl, workerName, workerEmail, qrCodeString]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Worker QR Code</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {isLoading ? (
            <Skeleton className="h-[250px] w-[250px] rounded-lg" />
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-[250px] w-[250px] items-center justify-center rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/5">
                <X className="h-12 w-12 text-destructive/50" />
              </div>
              <p className="text-sm text-destructive">
                Failed to load QR code. The worker may not have a QR code yet.
              </p>
            </div>
          ) : objectUrl ? (
            <img
              src={objectUrl}
              alt={`QR code for ${workerName}`}
              className="h-[250px] w-[250px] rounded-lg border border-border object-contain"
            />
          ) : null}

          {/* Worker Info */}
          <div className="text-center space-y-1">
            <p className="font-semibold text-base">{workerName}</p>
            <p className="text-sm text-muted-foreground">{workerEmail}</p>
            {qrCodeString && (
              <p className="text-xs text-muted-foreground font-mono">
                {qrCodeString}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={!objectUrl}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!objectUrl}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
