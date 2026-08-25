import * as React from 'react';

import { Button } from '@horizon-sync/ui/components';
import { useFeatureVisibility } from '@horizon-sync/ui/hooks';
import { useUserStore } from '@horizon-sync/store';

import { itemApi } from '../../utility/api/items';
import { REQUIRE_ITEM_APPROVAL } from '../../constants/feature-flags';
import { environment } from '../../../environments/environment';

export interface ItemApprovalActionsProps {
    item: { id: string; status?: string | null };
    onChanged?: () => void;
    className?: string;
}

/**
 * Submit / Approve / Reject controls for the item approval workflow.
 * Renders only when the item is in a relevant approval state.
 */
export function ItemApprovalActions({ item, onChanged, className }: ItemApprovalActionsProps) {
    const accessToken = useUserStore((s) => s.accessToken);
    const approvalFlag = useFeatureVisibility(
        REQUIRE_ITEM_APPROVAL,
        `${environment.apiCoreUrl}/api/v1`,
        accessToken,
    );
    const [loading, setLoading] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [rejecting, setRejecting] = React.useState(false);
    const [reason, setReason] = React.useState('');

    // Hide the whole workflow when the approval feature flag is off or still loading.
    if (approvalFlag.loading || !approvalFlag.enabled) {
        return null;
    }

    const status = item.status ?? '';
    if (status !== 'draft' && status !== 'pending_approval') {
        return null;
    }

    const run = async (action: 'submit' | 'approve' | 'reject') => {
        if (!accessToken) {
            setError('You are not authenticated.');
            return;
        }
        setError(null);
        setLoading(action);
        try {
            if (action === 'submit') {
                await itemApi.submitForApproval(accessToken, item.id);
            } else if (action === 'approve') {
                await itemApi.approve(accessToken, item.id);
            } else if (action === 'reject') {
                if (!reason.trim()) {
                    setError('A rejection reason is required.');
                    return;
                }
                await itemApi.reject(accessToken, item.id, reason.trim());
            }
            setReason('');
            setRejecting(false);
            onChanged?.();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Action failed.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className={className}>
            <div className="flex flex-wrap items-center gap-2">
                {status === 'draft' && (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={loading !== null}
                        onClick={() => run('submit')}
                    >
                        {loading === 'submit' ? 'Submitting…' : 'Submit for Approval'}
                    </Button>
                )}

                {status === 'pending_approval' && (
                    <>
                        <Button
                            type="button"
                            size="sm"
                            variant="default"
                            disabled={loading !== null}
                            onClick={() => run('approve')}
                        >
                            {loading === 'approve' ? 'Approving…' : 'Approve'}
                        </Button>
                        {!rejecting ? (
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                disabled={loading !== null}
                                onClick={() => setRejecting(true)}
                            >
                                Reject
                            </Button>
                        ) : (
                            <span className="flex items-center gap-2">
                                <input
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Rejection reason"
                                    className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={loading !== null || !reason.trim()}
                                    onClick={() => run('reject')}
                                >
                                    {loading === 'reject' ? 'Rejecting…' : 'Confirm'}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={loading !== null}
                                    onClick={() => {
                                        setRejecting(false);
                                        setReason('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </span>
                        )}
                    </>
                )}
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
    );
}
