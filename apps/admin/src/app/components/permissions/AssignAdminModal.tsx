import { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Search,
    Shield,
    Users,
    Building2,
    Key,
    BarChart3
} from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Button,
    Input,
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

import { AdminUserService } from '../../services/admin-user.service';
import { AdminOrganizationService } from '../../services/admin-organization.service';

interface AssignAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AssignAdminRequest) => Promise<void>;
    availablePermissions: Array<{
        type: string;
        label: string;
        description: string;
        scope_required: boolean;
    }>;
}

interface AssignAdminRequest {
    user_id: string;
    permissions: Array<{
        permission_type: 'master' | 'user_manager' | 'org_manager' | 'billing' | 'reporting';
        allowed_organizations?: string[];
    }>;
    notes?: string;
}

interface User {
    id: string;
    username: string;
    email: string;
    full_name: string;
}

interface Organization {
    id: string;
    name: string;
    organization_type: string;
}

export function AssignAdminModal({
    isOpen,
    onClose,
    onSubmit,
    availablePermissions
}: AssignAdminModalProps) {
    const [step, setStep] = useState<'search' | 'permissions'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [organizationScopes, setOrganizationScopes] = useState<Record<string, string[]>>({});
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadOrganizations();
        }
    }, [isOpen]);

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

    const searchUsers = async () => {
        if (!searchQuery.trim()) {
            showToast.error('Please enter a search term');
            return;
        }

        try {
            setSearchLoading(true);
            const response = await AdminUserService.searchUsers({
                query: searchQuery,
                page_size: 20,
                exclude_system_admins: true,
            });
            setUsers(response.users || []);
        } catch (error) {
            console.error('Failed to search users:', error);
            showToast.error('Failed to search users');
        } finally {
            setSearchLoading(false);
        }
    };

    const selectUser = (user: User) => {
        setSelectedUser(user);
        setStep('permissions');
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

    const handleSubmit = async () => {
        if (!selectedUser) return;

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

        const assignData: AssignAdminRequest = {
            user_id: selectedUser.id,
            permissions: selectedPermissions.map(permType => ({
                permission_type: permType as any,
                allowed_organizations: organizationScopes[permType] || undefined,
            })),
            notes: notes || undefined,
        };

        try {
            setLoading(true);
            await onSubmit(assignData);
            handleClose();
        } catch (error) {
            console.error('Failed to assign admin:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep('search');
        setSearchQuery('');
        setUsers([]);
        setSelectedUser(null);
        setSelectedPermissions([]);
        setOrganizationScopes({});
        setNotes('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Assign System Administrator</DialogTitle>
                    <DialogDescription>
                        {step === 'search'
                            ? 'Search for a user to assign system administrator permissions'
                            : `Configure permissions for ${selectedUser?.full_name}`
                        }
                    </DialogDescription>
                </DialogHeader>

                {step === 'search' && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search by username, email, or full name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                                />
                            </div>
                            <Button onClick={searchUsers} disabled={searchLoading}>
                                <Search className="h-4 w-4 mr-2" />
                                Search
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {users.map((user) => (
                                <Card
                                    key={user.id}
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => selectUser(user)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 p-2 rounded-full">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{user.full_name}</p>
                                                <p className="text-sm text-muted-foreground">{user.username}</p>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {searchQuery && users.length === 0 && !searchLoading && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No users found matching "{searchQuery}"
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'permissions' && selectedUser && (
                    <div className="space-y-6">
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <h3 className="font-medium mb-2">Selected User</h3>
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{selectedUser.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-base font-medium">System Administrator Permissions</Label>
                            <p className="text-sm text-muted-foreground mb-4">
                                Select the permissions to grant to this user
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
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Add any notes about this assignment..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === 'search' && (
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                    )}

                    {step === 'permissions' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('search')}>
                                Back
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || selectedPermissions.length === 0}
                            >
                                {loading ? 'Assigning...' : 'Assign Administrator'}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}