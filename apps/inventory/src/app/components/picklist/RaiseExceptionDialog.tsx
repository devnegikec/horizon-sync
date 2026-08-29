import * as React from 'react';

import { AlertTriangle, TriangleAlert } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Separator,
    Textarea,
} from '@horizon-sync/ui/components';

import type { PickExceptionSeverity } from '../../types/pick-exception.types';
import type { PickListItem } from '../../types/pick-list.types';
import { pickExceptionApi } from '../../utility/api/pick-exceptions';

interface RaiseExceptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: PickListItem | null;
    onSaved?: () => void;
}

const SEVERITY_OPTIONS: { value: PickExceptionSeverity; label: string }[] = [
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
    { value: 'critical', label: 'Critical' },
];

function parseErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err !== null && 'message' in err) {
        return String((err as { message: string }).message);
    }
    return 'Failed to raise exception';
}

interface ExceptionFormState {
    reasonCode: string;
    severity: PickExceptionSeverity;
    quantity: string;
    note: string;
}

const INITIAL_FORM: ExceptionFormState = {
    reasonCode: '',
    severity: 'warning',
    quantity: '',
    note: '',
};

function useReasonCodes(open: boolean, accessToken: string | null | undefined) {
    const [reasonCodes, setReasonCodes] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!open || !accessToken) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        pickExceptionApi
            .reasonCodes(accessToken)
            .then((res) => {
                if (!cancelled) setReasonCodes(res.reason_codes ?? []);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(parseErrorMessage(err));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [open, accessToken]);

    return { reasonCodes, loading, error };
}

function ExceptionItemSummary({ item }: { item: PickListItem }) {
    const itemName = item.item?.name ?? item.item_name ?? item.item?.code ?? item.item_code ?? '—';
    const itemCode = item.item?.code ?? item.item_code ?? '—';
    return (
        <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3">
            <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
                <p className="text-sm font-medium">{itemName}</p>
                <p className="text-xs text-muted-foreground font-mono">{itemCode}</p>
            </div>
        </div>
    );
}

function ExceptionErrorBanner({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{message}</p>
        </div>
    );
}

function ExceptionFormFields({
    form,
    reasonCodes,
    loadingCodes,
    onChange,
}: {
    form: ExceptionFormState;
    reasonCodes: string[];
    loadingCodes: boolean;
    onChange: (form: ExceptionFormState) => void;
}) {
    const update = (patch: Partial<ExceptionFormState>) => onChange({ ...form, ...patch });

    return (
        <>
            <div className="space-y-2">
                <Label htmlFor="reason-code">Reason code *</Label>
                <Select value={form.reasonCode} onValueChange={(v) => update({ reasonCode: v })} disabled={loadingCodes}>
                    <SelectTrigger id="reason-code">
                        <SelectValue placeholder={loadingCodes ? 'Loading…' : 'Select reason code'} />
                    </SelectTrigger>
                    <SelectContent>
                        {reasonCodes.map((code) => (
                            <SelectItem key={code} value={code}>
                                {code.replace(/_/g, ' ')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select value={form.severity} onValueChange={(v) => update({ severity: v as PickExceptionSeverity })}>
                    <SelectTrigger id="severity">
                        <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                        {SEVERITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="quantity">Affected quantity</Label>
                <Input id="quantity"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Optional"
                    value={form.quantity}
                    onChange={(e) => update({ quantity: e.target.value })} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea id="note"
                    placeholder="Optional description of the issue"
                    rows={3}
                    value={form.note}
                    onChange={(e) => update({ note: e.target.value })} />
            </div>
        </>
    );
}

export function RaiseExceptionDialog({ open, onOpenChange, item, onSaved }: RaiseExceptionDialogProps) {
    const accessToken = useUserStore((s) => s.accessToken);
    const { reasonCodes, loading: loadingCodes, error: reasonCodesError } = useReasonCodes(open, accessToken);

    const [form, setForm] = React.useState<ExceptionFormState>(INITIAL_FORM);
    const [saving, setSaving] = React.useState(false);
    const [submitError, setSubmitError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            setForm({ ...INITIAL_FORM });
            setSubmitError(null);
        }
    }, [open]);

    if (!item) return null;

    const error = submitError ?? reasonCodesError;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken) {
            setSubmitError('Not authenticated');
            return;
        }
        if (!form.reasonCode) {
            setSubmitError('Please select a reason code');
            return;
        }
        setSaving(true);
        setSubmitError(null);
        try {
            await pickExceptionApi.capture(accessToken, {
                pick_list_item_id: item.id,
                reason_code: form.reasonCode,
                severity: form.severity,
                quantity: form.quantity ? Number(form.quantity) : null,
                note: form.note || null,
            });
            onOpenChange(false);
            onSaved?.();
        } catch (err: unknown) {
            setSubmitError(parseErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Raise Pick Exception</DialogTitle>
                        <DialogDescription>
                            Report a discrepancy, damage or other issue for this pick line. The
                            report is recorded against an immutable audit trail.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <ExceptionItemSummary item={item} />
                        <Separator />
                        <ExceptionFormFields form={form} reasonCodes={reasonCodes} loadingCodes={loadingCodes} onChange={setForm} />
                        {error ? <ExceptionErrorBanner message={error} /> : null}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving || loadingCodes || !form.reasonCode}>
                            {saving ? 'Reporting…' : 'Report Exception'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
