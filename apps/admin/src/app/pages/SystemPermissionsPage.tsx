import { useState, useEffect } from 'react';

import {
    Shield,
    Users,
    Building2,
    Key,
    Plus,
    Edit,
    Trash2,
    Eye,
    Download,
    UserCheck,
    Settings2,
    AlertCircle
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    SearchInput,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Badge,
    DataTable,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import { toast } from '@horizon-sync/ui';

import { SystemAdminPermissionsService } from '../services/system-admin-permissions.service';
import type {
    SystemAdminUser,
    SystemAdminAuditLog,
    PermissionType,
    OrganizationAccessInfo,
} from '../types';
import { AssignAdminModal } from '../components/permissions/AssignAdminModal';
import { EditPermissionsModal } from '../components/permissions/EditPermissionsModal';
import { AdminDetailsModal } from '../components/permissions/AdminDetailsModal';
import { AuditLogModal } from '../components/permissions/AuditLogModal';

const PAGE_SIZE = 20;

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    description?: string;
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, description }: StatCardProps) {
    return (
        <Card className="border-border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                        {description && (
                            <p className="text-xs text-muted-foreground">{description}</p>
                        )}
                    </div>
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
                        <Icon className={cn('h-6 w-6', iconColor)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getPermissionBadge(permissionType: string) {
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
}

function getActionBadge(actionType: string) {
    const actionConfig = {
        'assign': { variant: 'success' as const, label: 'Assigned' },
        'update': { variant: 'secondary' as const, label: 'Updated' },
        'revoke': { variant: 'destructive' as const, label: 'Revoked' },
        'access_grant': { variant: 'success' as const, label: 'Access Granted' },
        'access_revoke': { variant: 'warning' as const, label: 'Access Revoked' },
    };

    const config = actionConfig[actionType as keyof typeof actionConfig] || {
        variant: 'outline' as const,
        label: actionType.replace('_', ' ').toUpperCase(),
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function SystemPermissionsPage() {
    const [adminUsers, setAdminUsers] = useState<SystemAdminUser[]>([]);
    const [auditLogs, setAuditLogs] = useState<SystemAdminAuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [permissionFilter, setPermissionFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState('admins');
    const [page, setPage] = useState(1);
    const [totalAdmins, setTotalAdmins] = useState(0);
    const [totalLogs, setTotalLogs] = useState(0);

    // Stats
    const [masterAdmins, setMasterAdmins] = useState(0);
    const [userManagers, setUserManagers] = useState(0);
    const [orgManagers, setOrgManagers] = useState(0);
    const [billingAdmins, setBillingAdmins] = useState(0);

    // Modals
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<SystemAdminUser | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
    const [adminToRevoke, setAdminToRevoke] = useState<SystemAdminUser | null>(null);

    const availablePermissions = SystemAdminPermissionsService.getAvailablePermissionTypes();

    useEffect(() => {
        loadData();
    }, [page, permissionFilter, searchQuery]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load admin users
            const adminFilters: any = {
                page,
                page_size: PAGE_SIZE,
                active_only: true,
            };

            if (permissionFilter !== 'all') {
                adminFilters.permission_type = permissionFilter;
            }

            const adminsData = await SystemAdminPermissionsService.getSystemAdminUsers(adminFilters);
            setAdminUsers(adminsData.admin_users);
            setTotalAdmins(adminsData.total);

            // Calculate stats
            const masterCount = adminsData.admin_users.filter(admin =>
                admin.permissions.some(p => p.permission_type === 'master')
            ).length;
            const userManagerCount = adminsData.admin_users.filter(admin =>
                admin.permissions.some(p => p.permission_type === 'user_manager')
            ).length;
            const orgManagerCount = adminsData.admin_users.filter(admin =>
                admin.permissions.some(p => p.permission_type === 'org_manager')
            ).length;
            const billingCount = adminsData.admin_users.filter(admin =>
                admin.permissions.some(p => p.permission_type === 'billing')
            ).length;

            setMasterAdmins(masterCount);
            setUserManagers(userManagerCount);
            setOrgManagers(orgManagerCount);
            setBillingAdmins(billingCount);

            // Load audit logs
            const auditData = await SystemAdminPermissionsService.getSystemAdminAuditLog({
                page: 1,
                page_size: 10, // Load recent logs only for summary
            });
            setAuditLogs(auditData.audit_logs);
            setTotalLogs(auditData.total);

        } catch (error) {
            console.error('Failed to load system admin data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load system admin data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAssignAdmin = async (assignData: any) => {
        try {
            await SystemAdminPermissionsService.assignSystemAdmin(assignData);
            toast({
                title: 'Success',
                description: 'System admin assigned successfully',
            });
            setShowAssignModal(false);
            loadData();
        } catch (error) {
            console.error('Failed to assign system admin:', error);
            toast({
                title: 'Error',
                description: 'Failed to assign system admin',
                variant: 'destructive',
            });
        }
    };

    const handleUpdatePermissions = async (userId: string, updateData: any) => {
        try {
            await SystemAdminPermissionsService.updateSystemAdminPermissions(userId, updateData);
            toast({
                title: 'Success',
                description: 'Permissions updated successfully',
            });
            setShowEditModal(false);
            setSelectedAdmin(null);
            loadData();
        } catch (error) {
            console.error('Failed to update permissions:', error);
            toast({
                title: 'Error',
                description: 'Failed to update permissions',
                variant: 'destructive',
            });
        }
    };

    const handleRevokeAdmin = async (userId: string, reason?: string) => {
        try {
            await SystemAdminPermissionsService.revokeSystemAdmin(userId, reason);
            toast({
                title: 'Success',
                description: 'System admin revoked successfully',
            });
            setShowRevokeConfirm(false);
            setAdminToRevoke(null);
            loadData();
        } catch (error) {
            console.error('Failed to revoke system admin:', error);
            toast({
                title: 'Error',
                description: 'Failed to revoke system admin',
                variant: 'destructive',
            });
        }
    };

    const filteredAdmins = adminUsers.filter(admin => {
        if (searchQuery &&
            !admin.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !admin.full_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !admin.email.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
            return false;
        }
        return true;
    });

    const adminColumns = [
        {
            accessorKey: 'username',
            header: 'Username',
            cell: ({ row }: any) => (
                <div className="space-y-1">
                    <Button
                        variant="link"
                        className="p-0 h-auto font-medium"
                        onClick={() => {
                            setSelectedAdmin(row.original);
                            setShowDetailsModal(true);
                        }}
                    >
                        {row.original.username}
                    </Button>
                    <p className="text-xs text-muted-foreground">{row.original.email}</p>
                </div>
            ),
        },
        {
            accessorKey: 'full_name',
            header: 'Full Name',
        },
        {
            accessorKey: 'permissions',
            header: 'Permissions',
            cell: ({ row }: any) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.permissions.slice(0, 2).map((permission: any, index: number) => (
                        <div key={index}>
                            {getPermissionBadge(permission.permission_type)}
                        </div>
                    ))}
                    {row.original.permissions.length > 2 && (
                        <Badge variant="outline">+{row.original.permissions.length - 2}</Badge>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'assigned_date',
            header: 'Assigned Date',
            cell: ({ row }: any) => formatDate(row.original.assigned_date),
        },
        {
            accessorKey: 'last_active',
            header: 'Last Active',
            cell: ({ row }: any) =>
                row.original.last_active
                    ? formatDate(row.original.last_active)
                    : 'Never',
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: any) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedAdmin(row.original);
                            setShowDetailsModal(true);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedAdmin(row.original);
                            setShowEditModal(true);
                        }}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                            setAdminToRevoke(row.original);
                            setShowRevokeConfirm(true);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const auditColumns = [
        {
            accessorKey: 'action_type',
            header: 'Action',
            cell: ({ row }: any) => getActionBadge(row.original.action_type),
        },
        {
            accessorKey: 'admin_username',
            header: 'Admin User',
            cell: ({ row }: any) => (
                <div className="space-y-1">
                    <p className="font-medium">{row.original.admin_username}</p>
                    {row.original.target_username && (
                        <p className="text-xs text-muted-foreground">
                            Target: {row.original.target_username}
                        </p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'target_organization_name',
            header: 'Organization',
            cell: ({ row }: any) =>
                row.original.target_organization_name || 'N/A',
        },
        {
            accessorKey: 'performed_date',
            header: 'Date',
            cell: ({ row }: any) => formatDate(row.original.performed_date),
        },
        {
            accessorKey: 'notes',
            header: 'Notes',
            cell: ({ row }: any) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.notes || 'N/A'}
                </span>
            ),
        },
    ];

    if (loading && adminUsers.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading system admin data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Administrator Permissions</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage system administrator roles, permissions, and access control
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                    <Button
                        onClick={() => setShowAssignModal(true)}
                        size="sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Admin
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Master Admins"
                    value={masterAdmins}
                    icon={Shield}
                    iconBg="bg-red-50"
                    iconColor="text-red-600"
                    description="Full system access"
                />
                <StatCard
                    title="User Managers"
                    value={userManagers}
                    icon={Users}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                    description="User management access"
                />
                <StatCard
                    title="Org Managers"
                    value={orgManagers}
                    icon={Building2}
                    iconBg="bg-green-50"
                    iconColor="text-green-600"
                    description="Organization management"
                />
                <StatCard
                    title="Billing Admins"
                    value={billingAdmins}
                    icon={Key}
                    iconBg="bg-purple-50"
                    iconColor="text-purple-600"
                    description="Billing system access"
                />
            </div>

            {/* Main Content */}
            <Card className="border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Permission Management</CardTitle>
                        <div className="flex items-center gap-2">
                            <SearchInput
                                placeholder="Search admins..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                className="w-64"
                            />
                            <Select value={permissionFilter} onValueChange={setPermissionFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Permissions</SelectItem>
                                    <SelectItem value="master">Master Admin</SelectItem>
                                    <SelectItem value="user_manager">User Manager</SelectItem>
                                    <SelectItem value="org_manager">Org Manager</SelectItem>
                                    <SelectItem value="billing">Billing Admin</SelectItem>
                                    <SelectItem value="reporting">Reporting Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="admins">System Admins ({totalAdmins})</TabsTrigger>
                            <TabsTrigger value="audit">Audit Log ({totalLogs})</TabsTrigger>
                            <TabsTrigger value="permissions">Permission Types</TabsTrigger>
                        </TabsList>

                        <TabsContent value="admins">
                            <DataTable
                                columns={adminColumns}
                                data={filteredAdmins}
                            />
                        </TabsContent>

                        <TabsContent value="audit">
                            <DataTable
                                columns={auditColumns}
                                data={auditLogs}
                            />
                        </TabsContent>

                        <TabsContent value="permissions">
                            <div className="grid gap-4 md:grid-cols-2">
                                {availablePermissions.map((permission) => (
                                    <Card key={permission.type}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg">{permission.label}</CardTitle>
                                                {getPermissionBadge(permission.type)}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {permission.description}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {permission.scope_required ? (
                                                    <>
                                                        <AlertCircle className="h-3 w-3" />
                                                        Organization scope required
                                                    </>
                                                ) : (
                                                    <>
                                                        <Settings2 className="h-3 w-3" />
                                                        Global access
                                                    </>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Modals */}
            {showAssignModal && (
                <AssignAdminModal
                    isOpen={showAssignModal}
                    onClose={() => setShowAssignModal(false)}
                    onSubmit={handleAssignAdmin}
                    availablePermissions={availablePermissions}
                />
            )}

            {selectedAdmin && showEditModal && (
                <EditPermissionsModal
                    admin={selectedAdmin}
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedAdmin(null);
                    }}
                    onSubmit={(updateData) => handleUpdatePermissions(selectedAdmin.user_id, updateData)}
                    availablePermissions={availablePermissions}
                />
            )}

            {selectedAdmin && showDetailsModal && (
                <AdminDetailsModal
                    admin={selectedAdmin}
                    isOpen={showDetailsModal}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedAdmin(null);
                    }}
                />
            )}

            {showAuditModal && (
                <AuditLogModal
                    isOpen={showAuditModal}
                    onClose={() => setShowAuditModal(false)}
                />
            )}

            {showRevokeConfirm && adminToRevoke && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-2">Revoke System Admin</h3>
                        <p className="text-muted-foreground mb-4">
                            Are you sure you want to revoke system admin permissions for {adminToRevoke.full_name}? This action cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowRevokeConfirm(false);
                                    setAdminToRevoke(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleRevokeAdmin(adminToRevoke.user_id)}
                            >
                                Revoke Access
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}