import {
  FileText,
  FilePenLine,
  Send,
  CheckCircle,
  AlertCircle,
  DollarSign,
} from 'lucide-react';

import { StatCard } from '../shared';

interface InvoiceStatsProps {
  total: number;
  draft: number;
  submitted: number;
  paid: number;
  overdue: number;
  totalOutstanding: number;
}

export function InvoiceStats({
  total,
  draft,
  submitted,
  paid,
  overdue,
  totalOutstanding,
}: InvoiceStatsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      <StatCard
        title="Total Invoices"
        value={total}
        icon={FileText}
        iconBg="bg-slate-100 dark:bg-slate-800"
        iconColor="text-slate-600 dark:text-slate-400"
      />
      <StatCard
        title="Draft"
        value={draft}
        icon={FilePenLine}
        iconBg="bg-amber-100 dark:bg-amber-900/20"
        iconColor="text-amber-600 dark:text-amber-400"
      />
      <StatCard
        title="Submitted"
        value={submitted}
        icon={Send}
        iconBg="bg-blue-100 dark:bg-blue-900/20"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title="Paid"
        value={paid}
        icon={CheckCircle}
        iconBg="bg-emerald-100 dark:bg-emerald-900/20"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Overdue"
        value={overdue}
        icon={AlertCircle}
        iconBg="bg-red-100 dark:bg-red-900/20"
        iconColor="text-red-600 dark:text-red-400"
      />
      <StatCard
        title="Total Outstanding"
        value={`$${totalOutstanding.toLocaleString()}`}
        icon={DollarSign}
        iconBg="bg-purple-100 dark:bg-purple-900/20"
        iconColor="text-purple-600 dark:text-purple-400"
      />
    </div>
  );
}
