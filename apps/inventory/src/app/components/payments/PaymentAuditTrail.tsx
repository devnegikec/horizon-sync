import { Clock, User, FileText } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components';

interface AuditLogEntry {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'CONFIRM' | 'CANCEL' | 'ALLOCATE' | 'DEALLOCATE';
  user_id: string;
  user_name?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  timestamp: string;
}

interface PaymentAuditTrailProps {
  auditLogs: AuditLogEntry[];
}

const ACTION_COLORS: Record<AuditLogEntry['action'], string> = {
  CREATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  UPDATE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  CONFIRM: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  CANCEL: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  ALLOCATE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  DEALLOCATE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
};

const ACTION_LABELS: Record<AuditLogEntry['action'], string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  CONFIRM: 'Confirmed',
  CANCEL: 'Cancelled',
  ALLOCATE: 'Allocated',
  DEALLOCATE: 'Deallocated',
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function renderChanges(entry: AuditLogEntry) {
  if (entry.action === 'CREATE' && entry.new_values) {
    return (
      <div className="mt-2 space-y-1">
        <p className="text-xs text-muted-foreground">Initial values:</p>
        {Object.entries(entry.new_values).map(([field, value]) => (
          <div key={field} className="ml-2 text-xs">
            <span className="font-medium">{field}:</span> {formatValue(value)}
          </div>
        ))}
      </div>
    );
  }

  if (entry.old_values && entry.new_values) {
    const changedFields = Object.keys(entry.new_values).filter(
      (key) => entry.old_values![key] !== entry.new_values![key]
    );

    if (changedFields.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        <p className="text-xs text-muted-foreground">Changes:</p>
        {changedFields.map((field) => (
          <div key={field} className="ml-2 text-xs">
            <span className="font-medium">{field}:</span>{' '}
            <span className="text-red-600 line-through">{formatValue(entry.old_values![field])}</span>
            {' → '}
            <span className="text-green-600">{formatValue(entry.new_values![field])}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export function PaymentAuditTrail({ auditLogs }: PaymentAuditTrailProps) {
  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">No audit logs available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {auditLogs.map((entry, index) => (
            <div key={entry.id} className="p-4 hover:bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={ACTION_COLORS[entry.action]}>{ACTION_LABELS[entry.action]}</Badge>
                    <span className="text-sm text-muted-foreground">by</span>
                    <span className="text-sm font-medium">{entry.user_name || entry.user_id}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(entry.timestamp)}
                  </div>
                  {renderChanges(entry)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
