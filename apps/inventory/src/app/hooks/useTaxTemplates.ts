import { useState, useEffect } from 'react';
import { useAuth } from '@platform/app/hooks/useAuth';

import { taxTemplateApi } from '../api/tax-templates';
import type { TaxTemplate } from '../types/tax-template.types';

interface UseTaxTemplatesResult {
    salesTaxTemplates: TaxTemplate[];
    purchaseTaxTemplates: TaxTemplate[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

export function useTaxTemplates(): UseTaxTemplatesResult {
    const { accessToken } = useAuth();
    const [salesTaxTemplates, setSalesTaxTemplates] = useState<TaxTemplate[]>([]);
    const [purchaseTaxTemplates, setPurchaseTaxTemplates] = useState<TaxTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchTaxTemplates = async () => {
        if (!accessToken) return;

        setIsLoading(true);
        setError(null);

        try {
            // Fetch sales tax templates (Output category)
            const salesResponse = await taxTemplateApi.list(accessToken, 1, 100, {
                tax_category: 'Output',
                is_active: true,
            });

            // Fetch purchase tax templates (Input category)
            const purchaseResponse = await taxTemplateApi.list(accessToken, 1, 100, {
                tax_category: 'Input',
                is_active: true,
            });

            setSalesTaxTemplates(salesResponse.data);
            setPurchaseTaxTemplates(purchaseResponse.data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTaxTemplates();
    }, [accessToken]);

    return {
        salesTaxTemplates,
        purchaseTaxTemplates,
        isLoading,
        error,
        refetch: fetchTaxTemplates,
    };
}
