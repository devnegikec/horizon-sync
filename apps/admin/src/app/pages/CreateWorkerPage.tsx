import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { toast } from '@horizon-sync/ui';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@horizon-sync/ui/components/ui/card';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import { useCreateWorker } from '../hooks/useWorkers';
import { WorkerQRCodeModal } from '../components/workers/WorkerQRCodeModal';

/**
 * Generate a unique QR code string in the format WRK-XXXXXXXXXXXX
 */
function generateQRCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'WRK-';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const workerCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  qr_code: z.string().min(1, 'QR code is required'),
  organization_id: z.string().min(1, 'Organization ID is required'),
});

type WorkerCreateFormValues = z.infer<typeof workerCreateSchema>;

export function CreateWorkerPage() {
  const navigate = useNavigate();
  const createMutation = useCreateWorker();

  const [createdWorker, setCreatedWorker] = useState<{
    id: string;
    name: string;
    email: string;
    qrCode: string;
  } | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<WorkerCreateFormValues>({
    resolver: zodResolver(workerCreateSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      qr_code: generateQRCode(),
      organization_id: '',
    },
  });

  const currentQrCode = watch('qr_code');

  const handleRegenerateQR = () => {
    setValue('qr_code', generateQRCode(), { shouldValidate: true });
  };

  const onSubmit = (values: WorkerCreateFormValues) => {
    const payload = {
      email: values.email,
      first_name: values.first_name,
      last_name: values.last_name,
      phone: values.phone || undefined,
      qr_code: values.qr_code,
      organization_id: values.organization_id,
    };

    createMutation.mutate(payload, {
      onSuccess: (data) => {
        toast({
          title: 'Worker created',
          description: `${data.first_name} ${data.last_name} has been created successfully with QR login access.`,
        });
        setCreatedWorker({
          id: data.id,
          name: `${data.first_name} ${data.last_name}`,
          email: data.email,
          qrCode: data.qr_code,
        });
        setQrModalOpen(true);
      },
      onError: (error: unknown) => {
        const err = error as Error & {
          status?: number;
          data?: { detail?: string | { field: string; message: string }[] };
        };
        if (err.status === 409) {
          const detail = err.data?.detail;
          if (typeof detail === 'string') {
            if (detail.toLowerCase().includes('email')) {
              setError('email', { message: 'A user with this email already exists' });
            } else if (detail.toLowerCase().includes('qr')) {
              setError('qr_code', { message: 'This QR code is already in use. Try generating a new one.' });
            } else {
              setError('email', { message: detail });
            }
          }
        } else if (err.status === 422 && Array.isArray(err.data?.detail)) {
          for (const fieldErr of err.data.detail) {
            const fieldName = fieldErr.field as keyof WorkerCreateFormValues;
            if (fieldName in workerCreateSchema.shape) {
              setError(fieldName, { message: fieldErr.message });
            }
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description:
              (err.data?.detail as string) ?? 'Failed to create worker',
          });
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/workers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Create Warehouse Worker</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Worker Details</CardTitle>
          <CardDescription>
            Warehouse workers log in only via QR code — no password needed.
            They can scan, receive, and pick inventory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Email */}
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="worker@warehouse.com" {...register('email')} />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* First Name */}
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input id="first_name" placeholder="Rajesh" {...register('first_name')} />
                {errors.first_name && (
                  <p className="text-xs text-destructive mt-1">{errors.first_name.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input id="last_name" placeholder="Kumar" {...register('last_name')} />
                {errors.last_name && (
                  <p className="text-xs text-destructive mt-1">{errors.last_name.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+91-9876543210" {...register('phone')} />
              </div>

              {/* Organization ID */}
              <div>
                <Label htmlFor="organization_id">Organization ID *</Label>
                <Input
                  id="organization_id"
                  placeholder="660e8400-e29b-41d4-a716-446655440001"
                  {...register('organization_id')}
                />
                {errors.organization_id && (
                  <p className="text-xs text-destructive mt-1">{errors.organization_id.message}</p>
                )}
              </div>

              {/* QR Code */}
              <div>
                <Label htmlFor="qr_code">QR Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="qr_code"
                    className="font-mono"
                    readOnly
                    {...register('qr_code')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRegenerateQR}
                    title="Generate new QR code"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {errors.qr_code && (
                  <p className="text-xs text-destructive mt-1">{errors.qr_code.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated unique code for QR login. Click 🔄 to regenerate.
                </p>
              </div>
            </div>

            {/* Info box */}
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-sm font-medium">🔐 QR Login Only</p>
              <p className="text-xs text-muted-foreground mt-1">
                This worker will have no password — they log in by scanning their
                QR code with the mobile app. Role: <strong>warehouse_worker</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/workers')}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create & Generate QR'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* QR Code Modal (shown after successful creation) */}
      {createdWorker && (
        <WorkerQRCodeModal
          open={qrModalOpen}
          onOpenChange={(open) => {
            setQrModalOpen(open);
            if (!open) {
              navigate('/workers');
            }
          }}
          userId={createdWorker.id}
          workerName={createdWorker.name}
          workerEmail={createdWorker.email}
          qrCodeString={createdWorker.qrCode}
        />
      )}
    </div>
  );
}
