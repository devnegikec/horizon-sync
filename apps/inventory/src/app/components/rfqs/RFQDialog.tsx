import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { rfqApi } from '../../utility/api';
import type { CreateRFQPayload } from '../../types/rfq.types';

interface RFQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfqId: string | null;
  onSave: () => void;
}

export function RFQDialog({ open, onOpenChange, rfqId, onSave }: RFQDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingRFQ, setFetchingRFQ] = useState(false);
  
  const [formData, setFormData] = useState({
    material_request_id: '',
    supplier_ids: '',
    closing_date: '',
  });

  useEffect(() => {
    if (open && rfqId && accessToken) {
      // Fetch RFQ details for editing
      const fetchRFQ = async () => {
        setFetchingRFQ(true);
        try {
          const rfq = await rfqApi.getById(accessToken, rfqId);
          setFormData({
            material_request_id: rfq.material_request_id || '',
            supplier_ids: rfq.suppliers?.map(s => s.supplier_id).join(', ') || '',
            closing_date: rfq.closing_date?.split('T')[0] || '',
          });
        } catch (err) {
          console.error('Error fetching RFQ:', err);
          toast({
            title: 'Error',
            description: 'Failed to load RFQ details',
            variant: 'destructive',
          });
        } finally {
          setFetchingRFQ(false);
        }
      };
      fetchRFQ();
    } else if (open && !rfqId) {
      // Reset form for new RFQ
      setFormData({
        material_request_id: '',
        supplier_ids: '',
        closing_date: '',
      });
    }
  }, [rfqId, open, accessToken, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const payload: CreateRFQPayload = {
        material_request_id: formData.material_request_id,
        supplier_ids: formData.supplier_ids.split(',').map(id => id.trim()).filter(Boolean),
        closing_date: formData.closing_date,
      };

      console.log('Saving RFQ with payload:', payload);

      if (rfqId) {
        await rfqApi.update(accessToken, rfqId, {
          supplier_ids: payload.supplier_ids,
          closing_date: payload.closing_date,
        });
        toast({
          title: 'Success',
          description: 'RFQ updated successfully',
        });
      } else {
        await rfqApi.create(accessToken, payload);
        toast({
          title: 'Success',
          description: 'RFQ created successfully',
        });
      }
      
      onSave();
    } catch (err) {
      console.error('RFQ save error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save RFQ';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rfqId ? 'Edit RFQ' : 'Create New RFQ'}</DialogTitle>
          <DialogDescription>
            {rfqId ? 'Update RFQ details' : 'Create a new request for quotation'}
          </DialogDescription>
        </DialogHeader>

        {fetchingRFQ ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material_request_id">Material Request ID</Label>
              <Input
                id="material_request_id"
                value={formData.material_request_id}
                onChange={(e) => setFormData({ ...formData, material_request_id: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Enter material request ID"
                required
                disabled={!!rfqId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_ids">Supplier IDs (comma-separated)</Label>
              <Input
                id="supplier_ids"
                value={formData.supplier_ids}
                onChange={(e) => setFormData({ ...formData, supplier_ids: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="supplier-id-1, supplier-id-2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closing_date">Closing Date</Label>
              <Input
                id="closing_date"
                type="date"
                value={formData.closing_date}
                onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {rfqId ? 'Update' : 'Create'} RFQ
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
