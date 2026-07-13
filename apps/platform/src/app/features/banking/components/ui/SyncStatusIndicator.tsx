import React from 'react';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface SyncStatusIndicatorProps {
    status: {
        status: 'idle' | 'syncing' | 'error';
        last_sync: string;
        next_sync?: string;
        error_message?: string;
    };
    size?: 'sm' | 'default';
}

export function SyncStatusIndicator({ status, size = 'default' }: SyncStatusIndicatorProps) {
    const getStatusIcon = () => {
        switch (status.status) {
            case 'syncing':
                return <RefreshCw className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} animate-spin`} />;
            case 'error':
                return <AlertCircle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />;
            case 'idle':
            default:
                return <CheckCircle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />;
        }
    };

    const getStatusVariant = (): 'success' | 'warning' | 'destructive' | 'default' => {
        switch (status.status) {
            case 'syncing':
                return 'warning';
            case 'error':
                return 'destructive';
            case 'idle':
            default:
                return 'success';
        }
    };

    const getStatusText = () => {
        switch (status.status) {
            case 'syncing':
                return 'Syncing';
            case 'error':
                return 'Error';
            case 'idle':
            default:
                return 'Connected';
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant()} className="flex items-center gap-1">
                {getStatusIcon()}
                {getStatusText()}
            </Badge>
            {size === 'default' && (
                <div className="text-xs text-muted-foreground">
                    {status.status === 'error' && status.error_message ? (
                        <span className="text-red-600">{status.error_message}</span>
                    ) : (
                        <span>Last sync: {new Date(status.last_sync).toLocaleDateString()}</span>
                    )}
                </div>
            )}
        </div>
    );
}