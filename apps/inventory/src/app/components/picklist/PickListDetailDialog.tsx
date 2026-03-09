import * as React from 'react';

import { ClipboardList, Calendar } from 'lucide-react';

import { Separator } from '@horizon-sync/ui/components';

import type { PickList } from '../../types/pick-list.types';
import { DetailDialogContainer } from '../common';

import { PickListDetailContent } from './PickListDetailContent';
import { PickListDetailFooter } from './PickListDetailFooter';
import { PickListStatusBadge } from './PickListStatusBadge';

interface PickListDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickList: PickList | null;
  onCreateDeliveryNote?: (pickList: PickList) => void;
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PickListDetailDialog({ open, onOpenChange, pickList, onCreateDeliveryNote }: PickListDetailDialogProps) {
  if (!pickList) return null;

  return (
    <DetailDialogContainer open={open}
      onOpenChange={onOpenChange}
      icon={ClipboardList}
      title={pickList.pick_list_no}
      status={pickList.status}
      statusBadge={<PickListStatusBadge status={pickList.status} />}
      subtitle={
        <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5 font-medium">
          <Calendar className="h-3.5 w-3.5" />
          {formatDateTime(pickList.pick_date)}
        </p>
      }>
      <Separator />
      <PickListDetailContent pickList={pickList} />
      <PickListDetailFooter pickList={pickList} onClose={() => onOpenChange(false)} onCreateDeliveryNote={onCreateDeliveryNote} />
    </DetailDialogContainer>
  );
}
