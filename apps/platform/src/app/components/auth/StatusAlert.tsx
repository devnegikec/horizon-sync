import { CheckCircle2 } from 'lucide-react';

interface StatusAlertProps {
  message: string;
  variant: 'success' | 'error';
}

export function StatusAlert({ message, variant }: StatusAlertProps) {
  const styles = variant === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-destructive/10 border-destructive/20 text-destructive';
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${styles}`}>
      {variant === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}
