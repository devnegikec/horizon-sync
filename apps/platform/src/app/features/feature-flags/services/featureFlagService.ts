import { environment } from '../../../../environments/environment';

const FEATURE_FLAGS_URL = `${environment.apiCoreUrl}/api/v1/feature-flags`;

export interface TenantFeatureFlag {
    name: string;
    description: string | null;
    enabled: boolean;
    visible: boolean;
    scope: string;
    tenant_id: string | null;
    inherited: boolean;
}

export interface FeatureFlagUpsertPayload {
    enabled?: boolean;
    visible?: boolean;
    description?: string | null;
}

async function parseError(res: Response, fallback: string): Promise<Error> {
    const body = await res.json().catch(() => null);
    const message =
        body?.detail?.message ||
        body?.detail ||
        body?.message ||
        fallback;
    return new Error(typeof message === 'string' ? message : fallback);
}

export const featureFlagService = {
    /** List effective feature flags for the current user's organization. */
    async list(token: string): Promise<TenantFeatureFlag[]> {
        const res = await fetch(FEATURE_FLAGS_URL, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            throw await parseError(res, `Failed to load feature flags (HTTP ${res.status})`);
        }
        const data = await res.json();
        return Array.isArray(data?.flags) ? data.flags : [];
    },

    /** Upsert a TENANT-scoped override for a feature flag. */
    async update(
        token: string,
        featureName: string,
        payload: FeatureFlagUpsertPayload,
    ): Promise<void> {
        const res = await fetch(`${FEATURE_FLAGS_URL}/${featureName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            throw await parseError(res, `Failed to update feature flag (HTTP ${res.status})`);
        }
    },
};
