// ─── Flag badge ──────────────────────────────────────────────────────────────

export function FlagBadge({ flag }: { flag: string }) {
  const map: Record<string, string> = {
    ok: 'bg-green-100 text-green-700',
    short: 'bg-yellow-100 text-yellow-700',
    damaged: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[flag] ?? 'bg-gray-100 text-gray-700'}`}>
      {flag}
    </span>
  );
}
