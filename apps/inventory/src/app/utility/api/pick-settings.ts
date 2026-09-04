import { apiRequest } from './core';

export interface PickSettingsResult {
    organization_id: string;
    settings: Record<string, unknown>;
}

/** A single setting descriptor returned by the settings catalog. */
export interface PickSettingsCatalogItem {
    key: string;
    type: string;
    default: unknown;
    allowed?: string[] | null;
    [key: string]: unknown;
}

export interface PickSettingsCatalogResult {
    settings: PickSettingsCatalogItem[];
}

/** Supported put-away generation modes (matches backend enum). */
export type PutAwayMode = 'auto' | 'manual';

/**
 * Pick / put-away settings API.
 *
 * The org-level `putaway_mode` default is stored in the same tenant-scoped
 * settings store as pick settings. Resolution order for generation requests:
 * explicit request `mode` → org `putaway_mode` override → code default `auto`.
 */
export const pickSettingsApi = {
    /** Runtime pick settings for pick execution (read-only, any authenticated user). */
    getRuntime: (accessToken: string) =>
        apiRequest<PickSettingsResult>('/pick-settings/runtime', accessToken),

    /** Settings catalog (powers the settings editor UI — includes `putaway_mode`). */
    getCatalog: (accessToken: string) =>
        apiRequest<PickSettingsCatalogResult>('/pick-settings/catalog', accessToken),

    /** Effective settings for the current org (defaults merged with overrides). */
    getEffective: (accessToken: string) =>
        apiRequest<PickSettingsResult>('/pick-settings', accessToken),

    /** Upsert an override (e.g. `{ putaway_mode: 'manual' }`). */
    upsert: (accessToken: string, settings: Record<string, unknown>) =>
        apiRequest<PickSettingsResult>('/pick-settings', accessToken, {
            method: 'PUT',
            body: { settings },
        }),

    /** Reset all overrides back to defaults. */
    reset: (accessToken: string) =>
        apiRequest<PickSettingsResult>('/pick-settings/reset', accessToken, {
            method: 'POST',
            body: {},
        }),
};
