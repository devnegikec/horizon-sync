import { coreApiClient } from '../../../utility/api-core';
import { BankAccount, BankAccountHistory, BankAccountListResponse, CreateBankAccountFormData, UpdateBankAccountFormData } from '../types';

/** EU countries that prioritize IBAN for duplicate detection. */
const EU_IBAN_COUNTRIES = new Set(['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR', 'LU']);

interface DuplicateCheckParams {
    account_number?: string;
    iban?: string;
    routing_number?: string;
    sort_code?: string;
    bsb_number?: string;
    ifsc_code?: string;
    country_code?: string;
    organization_id?: string;
}

interface DuplicateCheckResult {
    isDuplicate: boolean;
    duplicateField?: string;
    existingAccount?: BankAccount;
}

interface IdentifierResult { identifier: string; type: string }

/** Strip dashes and join two parts with a colon. */
function compositeId(prefix: string, suffix: string): string {
    return `${prefix.replace(/-/g, '')}:${suffix}`;
}

/**
 * Country-specific resolver functions.
 * Each returns an IdentifierResult when the required fields are present, or null.
 */
type CountryResolver = (p: DuplicateCheckParams) => IdentifierResult | null;

const COUNTRY_RESOLVERS: Record<string, CountryResolver> = {
    US: (p) => (p.routing_number && p.account_number)
        ? { identifier: compositeId(p.routing_number, p.account_number), type: 'routing_account' }
        : null,
    GB: (p) => (p.sort_code && p.account_number)
        ? { identifier: compositeId(p.sort_code, p.account_number), type: 'sort_account' }
        : null,
    AU: (p) => (p.bsb_number && p.account_number)
        ? { identifier: compositeId(p.bsb_number, p.account_number), type: 'bsb_account' }
        : null,
    IN: (p) => (p.ifsc_code && p.account_number)
        ? { identifier: compositeId(p.ifsc_code, p.account_number), type: 'ifsc_account' }
        : null,
};

/**
 * Resolve the primary banking identifier and its type from the given params.
 * Returns `null` when no usable identifier is found.
 */
function resolveBankIdentifier(params: DuplicateCheckParams): IdentifierResult | null {
    const country = params.country_code?.toUpperCase();

    // EU countries prioritize IBAN
    if (country && EU_IBAN_COUNTRIES.has(country) && params.iban) {
        return { identifier: params.iban, type: 'iban' };
    }

    // Country-specific composite identifiers
    const countryResolver = country ? COUNTRY_RESOLVERS[country] : undefined;
    const countryResult = countryResolver?.(params);
    if (countryResult) return countryResult;

    // Fallback — no country match, try available fields in priority order
    const fallbacks: Array<[string | undefined, string]> = [
        [params.iban, 'iban'],
        [params.account_number, 'account_number'],
        [params.routing_number, 'routing_number'],
    ];
    const match = fallbacks.find(([value]) => !!value);
    return match ? { identifier: match[0] as string, type: match[1] } : null;
}

class BankAccountService {
    // Create bank account linked to GL account
    async createBankAccount(glAccountId: string, data: CreateBankAccountFormData): Promise<BankAccount> {
        // Remove gl_account_id from the request body (it's passed in the URL path)
        const { gl_account_id: _glId, ...bankAccountData } = data;
        return coreApiClient.post<BankAccount>(`/chart-of-accounts/${glAccountId}/bank-accounts`, bankAccountData);
    }

    // Check for duplicate bank account using country-aware banking identifiers
    async checkDuplicateBankAccount(params: DuplicateCheckParams): Promise<DuplicateCheckResult> {
        const resolved = resolveBankIdentifier(params);
        if (!resolved) {
            return { isDuplicate: false };
        }

        const response = await coreApiClient.get<BankAccountListResponse>(
            '/bank-accounts',
            { bank_identifier: resolved.identifier },
        ).catch(() => ({ items: [] } as Pick<BankAccountListResponse, 'items'>));

        if (response.items && response.items.length > 0) {
            return {
                isDuplicate: true,
                duplicateField: resolved.type === 'iban' ? 'iban' : 'account_number',
                existingAccount: response.items[0],
            };
        }

        return { isDuplicate: false };
    }

    // Get all bank accounts
    async getAllBankAccounts(params?: {
        active?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<BankAccount[]> {
        const queryParams: Record<string, string | number | boolean | undefined> = {};
        if (params?.active !== undefined) {
            queryParams['is_active'] = params.active;
        }
        if (params?.limit) {
            queryParams['page_size'] = params.limit;
        }
        if (params?.offset) {
            const page = Math.floor((params.offset || 0) / (params.limit || 20)) + 1;
            queryParams['page'] = page;
        }

        const response = await coreApiClient.get<BankAccountListResponse>('/bank-accounts', queryParams);
        return response.items || [];
    }

    // Get bank accounts for GL account
    async getBankAccountsByGLAccount(
        glAccountId: string,
        params?: {
            active?: boolean;
            limit?: number;
            offset?: number;
        }
    ): Promise<BankAccountListResponse> {
        const queryParams: Record<string, string | number | boolean | undefined> = {};
        // Backend uses include_inactive, so we need to invert the active parameter
        if (params?.active !== undefined) {
            queryParams['include_inactive'] = !params.active;
        }

        // This endpoint returns BankAccount[] directly, not BankAccountListResponse
        const items = await coreApiClient.get<BankAccount[]>(
            `/chart-of-accounts/${glAccountId}/bank-accounts`,
            queryParams,
        );

        // Wrap in BankAccountListResponse format for consistency
        return {
            items,
            total: items.length,
            page: 1,
            page_size: items.length,
            total_pages: 1
        };
    }

    // Get specific bank account
    async getBankAccount(accountId: string): Promise<BankAccount> {
        return coreApiClient.get<BankAccount>(`/bank-accounts/${accountId}`);
    }

    // Update bank account
    async updateBankAccount(accountId: string, data: UpdateBankAccountFormData): Promise<BankAccount> {
        return coreApiClient.put<BankAccount>(`/bank-accounts/${accountId}`, data);
    }

    // Delete bank account
    async deleteBankAccount(accountId: string): Promise<void> {
        await coreApiClient.delete(`/bank-accounts/${accountId}`);
    }

    // Activate bank account
    async activateBankAccount(accountId: string): Promise<BankAccount> {
        return coreApiClient.put<BankAccount>(`/bank-accounts/${accountId}/activate`);
    }

    // Deactivate bank account
    async deactivateBankAccount(accountId: string): Promise<BankAccount> {
        return coreApiClient.put<BankAccount>(`/bank-accounts/${accountId}/deactivate`);
    }

    // Get bank account history
    async getBankAccountHistory(accountId: string): Promise<BankAccountHistory[]> {
        return coreApiClient.get<BankAccountHistory[]>(`/bank-accounts/${accountId}/history`);
    }

    // Validate banking details
    async validateBankingDetails(data: {
        iban?: string;
        swift_code?: string;
        routing_number?: string;
        sort_code?: string;
        bsb_number?: string;
    }): Promise<{ valid: boolean; errors: string[] }> {
        return coreApiClient.post<{ valid: boolean; errors: string[] }>('/banking/validate', data);
    }
}

export const bankAccountService = new BankAccountService();
