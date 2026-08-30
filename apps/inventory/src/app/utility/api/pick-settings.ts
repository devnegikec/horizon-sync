import { apiRequest } from './core';

export interface PickSettingsResult {
    organization_id: string;
    settings: Record<string, unknown>;
}

/**
 * Runtime pick settings for pick execution (read-only, any authenticated user).
 * Used to gate pick execution UI (e.g. handling units) on the org's config.
 */
export const pickSettingsApi = {
    getRuntime: (accessToken: string) =>
        apiRequest<PickSettingsResult>('/pick-settings/runtime', accessToken),
};
