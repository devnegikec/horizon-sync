// ─── Flag badge ──────────────────────────────────────────────────────────────

export function FlagBadge({ flag }: { flag: string }) {
  const map: Record<string, string> = {
    ok: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-white',
    short: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-white',
    damaged: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-white',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-white',
    hold: 'bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-white',
    quarantine: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-white',
    excess: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white',
    mixed: 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-white',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[flag] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white'}`}>
      {flag}
    </span>
  );
}
