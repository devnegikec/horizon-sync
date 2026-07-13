import { QrCode, Boxes, ScanLine, CreditCard } from 'lucide-react';

import { StatCard } from '../shared';

interface QSealStatsProps {
  total: number;
  active: number;
  totalQRCodes: number;
  totalScans: number;
}

export function QSealStats({ total, active, totalQRCodes, totalScans }: QSealStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Products"
        value={total}
        icon={Boxes}
        iconBg="bg-slate-100 dark:bg-slate-800"
        iconColor="text-slate-600 dark:text-slate-400"
      />
      <StatCard
        title="Active Products"
        value={active}
        icon={QrCode}
        iconBg="bg-emerald-100 dark:bg-emerald-900/20"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Total QR Codes"
        value={totalQRCodes.toLocaleString()}
        icon={CreditCard}
        iconBg="bg-blue-100 dark:bg-blue-900/20"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title="Total Scans"
        value={totalScans.toLocaleString()}
        icon={ScanLine}
        iconBg="bg-violet-100 dark:bg-violet-900/20"
        iconColor="text-violet-600 dark:text-violet-400"
      />
    </div>
  );
}
