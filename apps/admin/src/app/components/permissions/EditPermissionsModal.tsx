import { useState, useEffect } from 'react';
import { Shield, Users, Building2, Key, BarChart3 } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Button,
    Label,
    Textarea,
    Checkbox,
    Card,
    CardContent,
    Badge,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@horizon-sync/ui/components';
import { toast } from '@horizon-sync/ui';

// Add convenience methods for toast
const showToast = {
    success: (message: string) => toast({ title: 'Success', description: message, variant: 'default' }),
    error: (message: string) => toast({ title: 'Error', description: message, variant: 'destructive' })
};

import { AdminOrganizationService } from '../../services/admin-organization.service';
import type { SystemAdminUser } from '../../types';

interface EditPermissionsModalProps {
    admin: SystemAdminUser;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: UpdatePermissionsRequest) => Promise<void>;
    availablePermissions: Array<{
        type: string;
        label: string;
        description: string;
        scope_required: boolean;
    }>;
}

interface UpdatePermissionsRequest {
    permissions: Array<{
        permission_type: 'master' | 'user_manager' | 'org_manager' | 'billing' | 'reporting';
        allowed_organizations?: string[];
    }>;
    notes?: string;
}

interface Organization {
    id: string;
    name: string;
    organization_type: string;
}

export function EditPermissionsModal({
    admin,
    isOpen,
    onClose,
    onSubmit,
    availablePermissions
}: EditPermissionsModalProps) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [organizationScopes, setOrganizationScopes] = useState<Record<string, string[]>>({});
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && admin) {
            loadOrganizations();
            initializeCurrentPermissions();
        }
    }, [isOpen, admin]);

    const loadOrganizations = async () => {
        try {
            const response = await AdminOrganizationService.getOrganizations({
                page_size: 100,
                organization_type: 'customer',
            });
            setOrganizations(response.organizations || []);
        } catch (error) {
            console.error('Failed to load organizations:', error);
            showToast.error('Failed to load organizations');
        }
    };

    const initializeCurrentPermissions = () => {
        if (!admin.permissions) return;

        const permissions = admin.permissions.map(p => p.permission_type);
        setSelectedPermissions(permissions);

        const scopes: Record<string, string[]> = {};
        admin.permissions.forEach(permission => {
            if (permission.allowed_organizations) {
                scopes[permission.permission_type] = permission.allowed_organizations;
            }
        });
        setOrganizationScopes(scopes);
    };

    const togglePermission = (permissionType: string) => {
        if (selectedPermissions.includes(permissionType)) {
            setSelectedPermissions(prev => prev.filter(p => p !== permissionType));
            // Remove organization scope when removing permission
            const newScopes = { ...organizationScopes };
            delete newScopes[permissionType];
            setOrganizationScopes(newScopes);
        } else {
            setSelectedPermissions(prev => [...prev, permissionType]);
        }
    };

    const updateOrganizationScope = (permissionType: string, orgIds: string[]) => {
        setOrganizationScopes(prev => ({
            ...prev,
            [permissionType]: orgIds,
        }));
    };

    const getPermissionIcon = (type: string) => {
        switch (type) {
            case 'master': return Shield;
            case 'user_manager': return Users;
            case 'org_manager': return Building2;
            case 'billing': return Key;
            case 'reporting': return BarChart3;
            default: return Shield;
        }
    };

    const hasPermissionChanged = () => {
        const currentPermissionTypes = admin.permissions.map(p => p.permission_type).sort();
        const newPermissionTypes = selectedPermissions.sort();

        if (currentPermissionTypes.length !== newPermissionTypes.length) return true;
        if (!currentPermissionTypes.every((type, index) => type === newPermissionTypes[index])) return true;

        // Check organization scopes
        for (const permission of admin.permissions) {
            const currentOrgs = (permission.allowed_organizations || []).sort();
            const newOrgs = (organizationScopes[permission.permission_type] || []).sort();

            if (currentOrgs.length !== newOrgs.length) return true;
            if (!currentOrgs.every((org, index) => org === newOrgs[index])) return true;
        }

        return false;
    };

    const handleSubmit = async () => {
        if (selectedPermissions.length === 0) {
            showToast.error('Please select at least one permission');
            return;
        }

        // Validate organization scopes for required permissions
        const permissionsRequiringScope = availablePermissions
            .filter(p => p.scope_required && selectedPermissions.includes(p.type));

        for (const permission of permissionsRequiringScope) {
            if (!organizationScopes[permission.type] || organizationScopes[permission.type].length === 0) {
                showToast.error(`Please select organizations for ${permission.label}`);
                return;
            }
        }

        const updateData: UpdatePermissionsRequest = {
            permissions: selectedPermissions.map(permType => ({
                permission_type: permType as any,
                allowed_organizations: organizationScopes[permType] || undefined,
            })),
            notes: notes || undefined,
        };

        try {
            setLoading(true);
            await onSubmit(updateData);
            handleClose();
        } catch (error) {
            console.error('Failed to update permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedPermissions([]);
        setOrganizationScopes({});
        setNotes('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit System Administrator Permissions</DialogTitle>
                    <DialogDescription>
                        Update permissions for {admin.full_name} ({admin.username})
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">Current Administrator</h3>
                        <div className="space-y-2">
                            <p><span className="font-medium">Name:</span> {admin.full_name}</p>
                            <p><span className="font-medium">Username:</span> {admin.username}</p>
                            <p><span className="font-medium">Email:</span> {admin.email}</p>
                            <p><span className="font-medium">Assigned:</span> {new Date(admin.assigned_date).toLocaleDateString()}</p>
                            {admin.last_active && (
                                <p><span className="font-medium">Last Active:</span> {new Date(admin.last_active).toLocaleDateString()}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label className="text-base font-medium">System Administrator Permissions</Label>
                        <p className="text-sm text-muted-foreground mb-4">
                            Update the permissions for this administrator
                        </p>

                        <div className="space-y-4">
                            {availablePermissions.map((permission) => {
                                const Icon = getPermissionIcon(permission.type);
                                const isSelected = selectedPermissions.includes(permission.type);

                                return (
                                    <Card key={permission.type} className={isSelected ? 'border-primary' : ''}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => togglePermission(permission.type)}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Icon className="h-5 w-5 text-primary" />
                                                        <span className="font-medium">{permission.label}</span>
                                                        {permission.type === 'master' && (
                                                            <Badge variant="destructive">High Risk</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {permission.description}
                                                    </p>

                                                    {isSelected && permission.scope_required && (
                                                        <div className="bg-muted/50 p-3 rounded-md">
                                                            <Label className="text-xs font-medium mb-2 block">
                                                                Organization Access
                                                            </Label>
                                                            <Select
                                                                value=""
                                                                onValueChange={(orgId) => {
                                                                    const currentScope = organizationScopes[permission.type] || [];
                                                                    if (!currentScope.includes(orgId)) {
                                                                        updateOrganizationScope(permission.type, [...currentScope, orgId]);
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Add organization..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {organizations
                                                                        .filter(org => !(organizationScopes[permission.type] || []).includes(org.id))
                                                                        .map((org) => (
                                                                            <SelectItem key={org.id} value={org.id}>
                                                                                {org.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                            </Select>

                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {(organizationScopes[permission.type] || []).map((orgId) => {
                                                                    const org = organizations.find(o => o.id === orgId);
                                                                    return (
                                                                        <Badge
                                                                            key={orgId}
                                                                            variant="secondary"
                                                                            className="cursor-pointer"
                                                                            onClick={() => {
                                                                                const currentScope = organizationScopes[permission.type] || [];
                                                                                updateOrganizationScope(
                                                                                    permission.type,
                                                                                    currentScope.filter(id => id !== orgId)
                                                                                );
                                                                            }}
                                                                        >
                                                                            {org?.name} ×
                                                                        </Badge>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="notes">Update Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add notes about this permission update..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {!hasPermissionChanged() && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <p className="text-sm text-yellow-800">
                                No changes detected. Modify permissions above to update this administrator.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || selectedPermissions.length === 0 || !hasPermissionChanged()}
                    >
                        {loading ? 'Updating...' : 'Update Permissions'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}