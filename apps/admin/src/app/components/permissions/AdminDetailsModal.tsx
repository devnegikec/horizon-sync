import { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Calendar,
    Clock,
    Shield,
    Users,
    Building2,
    Key,
    BarChart3,
    Activity,
    MessageCircle
} from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    Badge,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@horizon-sync/ui/components';

import { SystemAdminPermissionsService } from '../../services/system-admin-permissions.service';
import type { SystemAdminUser, OrganizationAccessInfo } from '../../types';

interface AdminDetailsModalProps {
    admin: SystemAdminUser;
    isOpen: boolean;
    onClose: () => void;
}

export function AdminDetailsModal({ admin, isOpen, onClose }: AdminDetailsModalProps) {
    const [organizationAccess, setOrganizationAccess] = useState<OrganizationAccessInfo[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && admin) {
            loadOrganizationAccess();
        }
    }, [isOpen, admin]);

    const loadOrganizationAccess = async () => {
        try {
            setLoading(true);
            const access = await SystemAdminPermissionsService.getOrganizationAccess(admin.user_id);
            setOrganizationAccess(access);
        } catch (error) {
            console.error('Failed to load organization access:', error);
        } finally {
            setLoading(false);
        }
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

    const getPermissionBadge = (permissionType: string) => {
        const permissionConfig = {
            'master': { variant: 'destructive' as const, label: 'Master Admin' },
            'user_manager': { variant: 'secondary' as const, label: 'User Manager' },
            'org_manager': { variant: 'warning' as const, label: 'Org Manager' },
            'billing': { variant: 'success' as const, label: 'Billing Admin' },
            'reporting': { variant: 'secondary' as const, label: 'Reporting Admin' },
        };

        const config = permissionConfig[permissionType as keyof typeof permissionConfig] || {
            variant: 'outline' as const,
            label: permissionType.replace('_', ' ').toUpperCase(),
        };

        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>System Administrator Details</DialogTitle>
                    <DialogDescription>
                        Complete information for {admin.full_name}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Basic Details</TabsTrigger>
                        <TabsTrigger value="permissions">Permissions</TabsTrigger>
                        <TabsTrigger value="access">Organization Access</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Administrator Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Full Name</p>
                                                <p className="font-medium">{admin.full_name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Username</p>
                                                <p className="font-medium">{admin.username}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Email</p>
                                                <p className="font-medium">{admin.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Assigned Date</p>
                                                <p className="font-medium">{formatDate(admin.assigned_date)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Assigned By</p>
                                                <p className="font-medium">{admin.assigned_by}</p>
                                            </div>
                                        </div>

                                        {admin.last_active && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Last Active</p>
                                                    <p className="font-medium">{formatDate(admin.last_active)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="permissions" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Current Permissions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {admin.permissions.map((permission, index) => {
                                        const Icon = getPermissionIcon(permission.permission_type);

                                        return (
                                            <Card key={index} className="border-l-4 border-l-primary">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="bg-primary/10 p-2 rounded-full">
                                                            <Icon className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-medium text-lg">
                                                                    {permission.permission_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                                </span>
                                                                {getPermissionBadge(permission.permission_type)}
                                                            </div>

                                                            <p className="text-sm text-muted-foreground mb-3">
                                                                {permission.description}
                                                            </p>

                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium">Scope:</span>
                                                                    <Badge variant={permission.permission_scope === 'all' ? 'destructive' : 'secondary'}>
                                                                        {permission.permission_scope === 'all' ? 'Global Access' : 'Specific Organizations'}
                                                                    </Badge>
                                                                </div>

                                                                {permission.allowed_organizations && permission.allowed_organizations.length > 0 && (
                                                                    <div>
                                                                        <p className="text-sm font-medium mb-1">Allowed Organizations:</p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {permission.allowed_organizations.map((orgId, orgIndex) => (
                                                                                <Badge key={orgIndex} variant="outline">
                                                                                    {orgId}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}

                                    {admin.permissions.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No permissions assigned
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="access" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Organization Access
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Loading organization access...
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {organizationAccess.map((access, index) => (
                                            <Card key={index} className="border-l-4 border-l-blue-500">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-blue-50 p-2 rounded-full">
                                                                <Building2 className="h-5 w-5 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{access.organization_name}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    ID: {access.organization_id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge variant="secondary">{access.access_type}</Badge>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Granted by {access.granted_by}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatDate(access.granted_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                        {organizationAccess.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                <p>No specific organization access granted</p>
                                                <p className="text-sm">
                                                    This administrator may have global access or no scoped permissions
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}