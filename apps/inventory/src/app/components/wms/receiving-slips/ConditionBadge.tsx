// ─── Condition badge ────────────────────────────────────────────────────────

const CONDITION_MAP: Record<string, string> = {
  HOLD: 'bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-white',
  QUARANTINE: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-white',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-white',
  MIXED: 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-white',
};

export function ConditionBadge({ code }: { code?: string | null }) {
  if (!code) return <span className="text-xs text-muted-foreground">—</span>;
  const style = CONDITION_MAP[code] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {code}
    </span>
  );
}
