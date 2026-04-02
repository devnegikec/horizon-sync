import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Search, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@horizon-sync/ui/lib';

import {
    InvoiceDialog,
    InvoiceFormData,
    invoiceFormSchema,
} from '@horizon-sync/ui/components';

import { AdminOrganizationService } from '../../services/admin-organization.service';
import type { Invoice } from '../../types';

interface CreateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: InvoiceFormData & { organization_id: string }) => Promise<void>;
}

interface Organization {
    id: string;
    name: string;
}

export function CreateInvoiceModal({ isOpen, onClose, onSubmit }: CreateInvoiceModalProps) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [customers, setCustomers] = useState<Array<{ id: string; customer_name: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loadingOrganizations, setLoadingOrganizations] = useState(false);

    // Searchable organization/customer state
    const [orgSearchQuery, setOrgSearchQuery] = useState('');
    const [orgSearchResults, setOrgSearchResults] = useState<Organization[]>([]);
    const [showOrgDropdown, setShowOrgDropdown] = useState(false);
    const [orgSearchLoading, setOrgSearchLoading] = useState(false);

    const [availableItems] = useState<Array<{ id: string; item_name: string; item_sku?: string; uom?: string }>>([
        { id: 'service-1', item_name: 'Professional Services', item_sku: 'SRV001', uom: 'hours' },
        { id: 'license-1', item_name: 'Software License', item_sku: 'LIC001', uom: 'units' },
        { id: 'support-1', item_name: 'Support Package', item_sku: 'SUP001', uom: 'months' },
    ]);

    const { toast } = useToast();

    // Debounced organization search
    const searchOrganizations = useCallback(async (query: string) => {
        if (!query.trim()) {
            setOrgSearchResults([]);
            return;
        }

        setOrgSearchLoading(true);
        try {
            const response = await AdminOrganizationService.list({
                search: query,
                page_size: 50,
                page: 1
            });

            const results = response.organizations.map((org) => ({
                id: org.id,
                name: org.name
            }));

            setOrgSearchResults(results);
        } catch (error) {
            console.error('Failed to search organizations:', error);
            setOrgSearchResults([]);
        } finally {
            setOrgSearchLoading(false);
        }
    }, []);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (orgSearchQuery) {
                searchOrganizations(orgSearchQuery);
            } else {
                setOrgSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [orgSearchQuery, searchOrganizations]);

    useEffect(() => {
        if (isOpen) {
            loadOrganizations();
            // Reset form state when modal opens
            setSelectedOrgId('');
            setSelectedOrg(null);
            setOrgSearchQuery('');
            setOrgSearchResults([]);
            setShowOrgDropdown(false);
        }
    }, [isOpen]);

    // Load customers when organization is selected
    useEffect(() => {
        if (selectedOrgId && selectedOrg) {
            loadCustomers(selectedOrgId);
        } else {
            setCustomers([]);
        }
    }, [selectedOrgId, selectedOrg]);

    // Handle organization selection from search
    const handleOrgSelect = (org: Organization) => {
        setSelectedOrg(org);
        setSelectedOrgId(org.id);
        setOrgSearchQuery(org.name);
        setShowOrgDropdown(false);
    };

    // Handle search input changes
    const handleOrgSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setOrgSearchQuery(value);
        setShowOrgDropdown(true);

        // Clear selection if user types something different
        if (selectedOrg && value !== selectedOrg.name) {
            setSelectedOrg(null);
            setSelectedOrgId('');
        }
    };

    // Handle search input focus
    const handleOrgSearchFocus = () => {
        setShowOrgDropdown(true);
        if (!orgSearchQuery && organizations.length > 0) {
            setOrgSearchResults(organizations.slice(0, 10));
        }
    };

    const loadOrganizations = async () => {
        try {
            setLoadingOrganizations(true);
            const response = await AdminOrganizationService.list({
                page_size: 100
            });
            const orgs = response.organizations.map((org) => ({
                id: org.id,
                name: org.name,
            }));
            setOrganizations(orgs);

            // If no selection and only one org, auto-select it
            if (orgs.length === 1 && !selectedOrgId) {
                const org = orgs[0];
                setSelectedOrg(org);
                setSelectedOrgId(org.id);
                setOrgSearchQuery(org.name);
            }
        } catch (error) {
            console.error('Failed to load organizations:', error);
            toast({
                title: 'Error',
                description: 'Failed to load organizations',
                variant: 'destructive',
            });
        } finally {
            setLoadingOrganizations(false);
        }
    };

    const resetForm = () => {
        setSelectedOrg(null);
        setSelectedOrgId('');
        setOrgSearchQuery('');
        setOrgSearchResults([]);
        setShowOrgDropdown(false);
        setCustomers([]);
    };

    const loadCustomers = async (organizationId: string) => {
        try {
            setLoadingCustomers(true);
            // For admin portal, we'll use the organization as the "customer" 
            // since it's creating invoices for organizations
            const org = organizations.find(o => o.id === organizationId);
            if (org) {
                setCustomers([{
                    id: organizationId,
                    customer_name: org.name
                }]);
            }
        } catch (error) {
            console.error('Failed to load customers:', error);
            toast({
                title: 'Error',
                description: 'Failed to load customers',
                variant: 'destructive',
            });
        } finally {
            setLoadingCustomers(false);
        }
    };

    const handleSubmit = async (data: InvoiceFormData) => {
        if (!selectedOrgId) {
            toast({
                title: 'Error',
                description: 'Please select an organization',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            await onSubmit({
                ...data,
                organization_id: selectedOrgId,
            });
            resetForm();
            onClose();
            toast({
                title: 'Success',
                description: 'Invoice created successfully',
            });
        } catch (error) {
            console.error('Failed to create invoice:', error);
            toast({
                title: 'Error',
                description: 'Failed to create invoice',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Custom validation schema for admin portal
    const adminInvoiceSchema = invoiceFormSchema.extend({
        // Admin portal specific extensions if needed
    });

    return (
        <>
            {/* Organization Selection Header */}
            {isOpen && !selectedOrgId && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-card p-6 rounded-lg border shadow-lg w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Select Customer Organization</h3>

                        {/* Searchable organization selector */}
                        <div className="space-y-4">
                            <div className="relative">
                                <Label htmlFor="org-search">Search Organization</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="org-search"
                                        placeholder="Type to search organizations..."
                                        value={orgSearchQuery}
                                        onChange={handleOrgSearchChange}
                                        onFocus={handleOrgSearchFocus}
                                        onBlur={() => setTimeout(() => setShowOrgDropdown(false), 200)}
                                        className="pr-10"
                                    />
                                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                                    {/* Dropdown Results */}
                                    {showOrgDropdown && (
                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                                            {orgSearchLoading ? (
                                                <div className="p-3 text-sm text-muted-foreground">
                                                    Searching...
                                                </div>
                                            ) : orgSearchResults.length > 0 ? (
                                                <div className="py-1">
                                                    {orgSearchResults.map((org, index) => (
                                                        <button
                                                            key={org.id}
                                                            onClick={() => handleOrgSelect(org)}
                                                            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm flex items-center justify-between"
                                                        >
                                                            <span>{org.name}</span>
                                                            {selectedOrg?.id === org.id && (
                                                                <Check className="h-4 w-4 text-primary" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : orgSearchQuery ? (
                                                <div className="p-3 text-sm text-muted-foreground">
                                                    No organizations found for "{orgSearchQuery}"
                                                </div>
                                            ) : (
                                                <div className="p-3 text-sm text-muted-foreground">
                                                    {loadingOrganizations ? 'Loading organizations...' : 'Type to search organizations'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Show selected org */}
                                {selectedOrg && !showOrgDropdown && (
                                    <div className="mt-2 p-2 bg-accent rounded-md text-sm flex items-center justify-between">
                                        <span>Selected: {selectedOrg.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedOrg(null);
                                                setSelectedOrgId('');
                                                setOrgSearchQuery('');
                                            }}
                                            className="h-auto p-1"
                                        >
                                            ×
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 pt-4">
                                <Button
                                    onClick={() => {
                                        if (selectedOrg) {
                                            setSelectedOrgId(selectedOrg.id);
                                        }
                                    }}
                                    disabled={!selectedOrg}
                                    className="flex-1"
                                >
                                    Continue to Create Invoice
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        resetForm();
                                        onClose();
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Creation Dialog */}
            <InvoiceDialog
                open={isOpen && !!selectedOrgId}
                onOpenChange={(open) => {
                    if (!open) {
                        resetForm();
                        onClose();
                    }
                }}
                onSave={handleSubmit}
                saving={loading}
                customers={customers}
                validationSchema={adminInvoiceSchema}
                invoiceTypes={['Sales', 'Purchase']}
                availableStatuses={['Draft']}
                availableItems={availableItems}
                isLoadingItems={loadingCustomers}
            />
        </>
    );
}