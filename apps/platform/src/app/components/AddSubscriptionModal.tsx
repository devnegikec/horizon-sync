import * as React from 'react';

import { Plus } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@horizon-sync/ui/components/ui/dialog';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';

import { useAuth } from '../hooks';
import { SubscriptionService } from '../services/subscription.service';

interface AddSubscriptionModalProps {
  onSuccess?: () => void;
}

export function AddSubscriptionModal({ onSuccess }: AddSubscriptionModalProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { accessToken } = useAuth();
  
  const [formData, setFormData] = React.useState({
    plan_code: '',
    billing_cycle: 'monthly' as 'monthly' | 'yearly',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    try {
      setIsLoading(true);
      await SubscriptionService.createSubscription(formData, accessToken);
      setOpen(false);
      setFormData({ plan_code: '', billing_cycle: 'monthly' });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="h-4 w-4" />
          Add Subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Subscription</DialogTitle>
          <DialogDescription>
            Select a plan and billing cycle for the new subscription.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            <Select value={formData.plan_code}
              onValueChange={(value) =>
                setFormData({ ...formData, plan_code: value })
              }>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Plan</SelectItem>
                <SelectItem value="pro">Professional Plan</SelectItem>
                <SelectItem value="enterprise">Enterprise Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing">Billing Cycle</Label>
            <Select value={formData.billing_cycle}
              onValueChange={(value) =>
                setFormData({ ...formData, billing_cycle: value as 'monthly' | 'yearly' })
              }>
              <SelectTrigger>
                <SelectValue placeholder="Select billing cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.plan_code}>
              {isLoading ? 'Creating...' : 'Create Subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
