import * as React from 'react';

import { useQuery } from '@tanstack/react-query';
import { Loader2, ScanLine } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components';

import type {
    AsnOrder,
    AsnOrderTransferVerification,
    TransferCartonRollup,
    TransferSerialLine,
    TransferSerialStatus,
} from '../../types/asn-order.types';
import { asnOrderApi } from '../../utility/api/asn-orders';

const SERIAL_STATUS_BADGES: Record<TransferSerialStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
    received: { label: 'Received', variant: 'success' },
    in_transit: { label: 'In transit', variant: 'secondary' },
    missing: { label: 'Missing', variant: 'destructive' },
    unexpected: { label: 'Unexpected', variant: 'warning' },
};

function countByStatus(serials: TransferSerialLine[], status: TransferSerialStatus): number {
    return serials.filter((line) => line.status === status).length;
}

function SummaryTiles({ verification }: { verification: AsnOrderTransferVerification }) {
    const missing = verification.missing_serials ?? countByStatus(verification.serials, 'missing');
    const unexpected = verification.unexpected_serials ?? countByStatus(verification.serials, 'unexpected');

    const totals: Array<[string, number]> = [
        ['Dispatched', verification.dispatched_serials],
        ['Received', verification.received_serials],
        ['Missing', missing],
        ['Unexpected', unexpected],
    ];

    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {totals.map(([label, value]) => (
                <div key={label} className="rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-semibold">{value}</p>
                </div>
            ))}
        </div>
    );
}

function CartonRollups({ cartons }: { cartons: TransferCartonRollup[] }) {
    if (!cartons || cartons.length === 0) return null;

    return (
        <div className="space-y-1">
            <h4 className="text-sm font-medium">Carton Rollups</h4>
            <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                        <tr>
                            <th className="px-3 py-2 font-medium">Carton</th>
                            <th className="px-3 py-2 text-right font-medium">Expected</th>
                            <th className="px-3 py-2 text-right font-medium">Received</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {cartons.map((carton, index) => (
                            <tr key={carton.carton_serial ?? `carton-${index}`}>
                                <td className="px-3 py-2 font-mono">{carton.carton_serial ?? '—'}</td>
                                <td className="px-3 py-2 text-right">{carton.expected ?? 0}</td>
                                <td className="px-3 py-2 text-right">{carton.received ?? 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SerialTable({ serials }: { serials: TransferSerialLine[] }) {
    return (
        <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                        <th className="px-3 py-2 font-medium">Serial</th>
                        <th className="px-3 py-2 font-medium">SKU</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {serials.map((line) => {
                        const badge = SERIAL_STATUS_BADGES[line.status] ?? SERIAL_STATUS_BADGES.in_transit;
                        return (
                            <tr key={line.serial_no}>
                                <td className="px-3 py-2 font-mono">{line.serial_no}</td>
                                <td className="px-3 py-2 font-mono text-muted-foreground">{line.sku ?? line.item_name ?? '—'}</td>
                                <td className="px-3 py-2">
                                    <Badge variant={badge.variant}>{badge.label}</Badge>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export interface TransferVerificationScreenProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asnOrder: AsnOrder | null;
}

/**
 * Serial-match screen for internal-transfer ASNs. Renders the dispatched /
 * received / missing rollup, carton rollups and a per-serial table with status
 * badges (`received`, `in_transit`, `missing`, `unexpected`).
 */
// eslint-disable-next-line complexity
export function TransferVerificationScreen({ open, onOpenChange, asnOrder }: TransferVerificationScreenProps) {
    const accessToken = useUserStore((s) => s.accessToken);

    const { data, isLoading, error, refetch } = useQuery<AsnOrderTransferVerification>({
        queryKey: ['asn-transfer-verification', asnOrder?.id],
        queryFn: () => asnOrderApi.getTransferVerification(accessToken || '', asnOrder?.id || ''),
        enabled: !!accessToken && !!asnOrder?.id && open,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ScanLine className="h-5 w-5" />
                        Serial Match — {asnOrder?.asn_order_no ?? ''}
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2 text-sm">Loading serial match…</span>
                    </div>
                ) : error ? (
                    <div className="space-y-3 py-4">
                        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Failed to load serial match'}</p>
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                            Retry
                        </Button>
                    </div>
                ) : data ? (
                    <div className="space-y-4 text-sm">
                        <SummaryTiles verification={data} />
                        <CartonRollups cartons={data.cartons ?? []} />
                        <SerialTable serials={data.serials ?? []} />
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
