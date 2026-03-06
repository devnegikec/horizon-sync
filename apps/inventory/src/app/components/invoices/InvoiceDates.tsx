import { Calendar } from 'lucide-react';

import type { Invoice } from '../../types/invoice.types';
import { formatDate } from '../../utility/formatDate';

export function InvoiceDates({ invoice }: { invoice: Invoice }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="text-sm text-muted-foreground">Posting Date</p>
        <div className="flex items-center gap-2 mt-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium">{invoice.posting_date ? formatDate(invoice.posting_date, 'DD-MMM-YY') : '—'}</p>
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Due Date</p>
        <div className="flex items-center gap-2 mt-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium">{invoice.due_date ? formatDate(invoice.due_date, 'DD-MMM-YY') : '—'}</p>
        </div>
      </div>
    </div>
  );
}
