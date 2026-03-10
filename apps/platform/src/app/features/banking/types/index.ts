// Banking Types
import { z } from 'zod';

// Bank Account Types
export interface BankAccount {
    id: string;
    organization_id: string;
    gl_account_id: string;
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    iban?: string;
    swift_code?: string;
    routing_number?: string;
    branch_name?: string;
    branch_code?: string;
    sort_code?: string;
    bsb_number?: string;
    account_type?: string;
    account_purpose?: string;
    is_primary: boolean;
    is_active: boolean;
    online_banking_enabled?: boolean;
    mobile_banking_enabled?: boolean;
    wire_transfer_enabled?: boolean;
    ach_enabled?: boolean;
    daily_transfer_limit?: number;
    monthly_transfer_limit?: number;
    requires_dual_approval?: boolean;
    bank_api_enabled?: boolean;
    bank_api_credentials_id?: string;
    last_sync_date?: string;
    sync_frequency?: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
}

// Bank Account History
export interface BankAccountHistory {
    id: string;
    bank_account_id: string;
    field_name: string;
    old_value?: string;
    new_value?: string;
    changed_by: string;
    changed_at: string;
    change_reason?: string;
}

// Banking API Responses
export interface BankAccountListResponse {
    items: BankAccount[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// Payment and Transfer Types
export interface PaymentTransaction {
    id: string;
    from_account_id: string;
    to_account_id?: string;
    amount: number;
    currency: string;
    description: string;
    reference_number?: string;
    transaction_type: 'payment' | 'transfer' | 'wire' | 'ach';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    scheduled_date?: string;
    processed_date?: string;
    approval_required: boolean;
    approved_by?: string;
    approved_at?: string;
    created_by: string;
    created_at: string;
}

// Bank API Integration Types
export interface BankApiConnection {
    id: string;
    bank_account_id: string;
    api_provider: string;
    connection_status: 'connected' | 'disconnected' | 'error';
    last_sync: string;
    sync_frequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'manual';
    auto_reconciliation: boolean;
    credentials_encrypted: boolean;
}

// Banking Dashboard Overview
export interface BankingOverview {
    total_accounts: number;
    total_balance: number;
    active_connections: number;
    pending_transactions: number;
    recent_transactions: PaymentTransaction[];
    account_balances: Array<{
        account_id: string;
        bank_name: string;
        balance: number;
        currency: string;
        last_updated: string;
    }>;
}

// Form Schemas using Zod
export const createBankAccountSchema = z.object({
    gl_account_id: z.string().uuid('Invalid GL Account ID'),
    bank_name: z.string().min(1, 'Bank name is required').max(100),
    account_holder_name: z.string().min(1, 'Account holder name is required').max(200),
    account_number: z.string().min(1, 'Account number is required').max(50),
    iban: z.string().optional().refine((val) => {
        if (!val) return true;
        return /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(val.replace(/\s/g, ''));
    }, 'Invalid IBAN format'),
    swift_code: z.string().optional().refine((val) => {
        if (!val) return true;
        return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(val.replace(/\s/g, ''));
    }, 'Invalid SWIFT code format'),
    routing_number: z.string().optional().refine((val) => {
        if (!val) return true;
        return /^[0-9]{9}$/.test(val.replace(/[\s-]/g, ''));
    }, 'Invalid routing number format'),
    branch_name: z.string().optional(),
    branch_code: z.string().optional(),
    sort_code: z.string().optional().refine((val) => {
        if (!val) return true;
        return /^[0-9]{6}$/.test(val.replace(/[\s-]/g, ''));
    }, 'Invalid sort code format'),
    bsb_number: z.string().optional().refine((val) => {
        if (!val) return true;
        return /^[0-9]{6}$/.test(val.replace(/[\s-]/g, ''));
    }, 'Invalid BSB number format'),
    account_type: z.enum(['checking', 'savings', 'business', 'investment', 'other']).optional(),
    account_purpose: z.enum(['operating', 'payroll', 'tax', 'investment', 'other']).optional(),
    is_primary: z.boolean().default(false),
    online_banking_enabled: z.boolean().default(false),
    mobile_banking_enabled: z.boolean().default(false),
    wire_transfer_enabled: z.boolean().default(false),
    ach_enabled: z.boolean().default(false),
    daily_transfer_limit: z.number().positive().optional(),
    monthly_transfer_limit: z.number().positive().optional(),
    requires_dual_approval: z.boolean().default(false),
    bank_api_enabled: z.boolean().default(false),
    sync_frequency: z.enum(['manual', 'hourly', 'daily', 'weekly']).default('manual')
});

export type CreateBankAccountFormData = z.infer<typeof createBankAccountSchema>;

export const updateBankAccountSchema = createBankAccountSchema.partial().omit({ gl_account_id: true });
export type UpdateBankAccountFormData = z.infer<typeof updateBankAccountSchema>;

// Payment Form Schema
export const createPaymentSchema = z.object({
    from_account_id: z.string().uuid('Invalid from account'),
    to_account_id: z.string().uuid('Invalid to account').optional(),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3, 'Currency must be 3 characters'),
    description: z.string().min(1, 'Description is required').max(255),
    reference_number: z.string().optional(),
    transaction_type: z.enum(['payment', 'transfer', 'wire', 'ach']),
    scheduled_date: z.string().optional()
});

export type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;