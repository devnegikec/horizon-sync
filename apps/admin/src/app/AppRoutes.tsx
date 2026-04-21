import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminGuard } from './components/auth/AdminGuard';
import { PublicRoute } from './components/auth/PublicRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { BillingManagementPage } from './pages/BillingManagementPage';
import { CreateOrganizationPage } from './pages/CreateOrganizationPage';
import { CreateUserPage } from './pages/CreateUserPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { OrganizationDeactivationPage } from './pages/OrganizationDeactivationPage';
import { OrganizationDetailPage } from './pages/OrganizationDetailPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { PaymentRemindersPage } from './pages/PaymentRemindersPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { SystemPermissionsPage } from './pages/SystemPermissionsPage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { RolesPage } from './pages/RolesPage';
import { UsersPage } from './pages/UsersPage';
import { FeatureControlsPage } from './pages/FeatureControlsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
      <Route path="/*"
        element={
          <AdminGuard>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/organizations" element={<OrganizationsPage />} />
                <Route path="/organizations/new" element={<CreateOrganizationPage />} />
                <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
                <Route path="/organizations/deactivation" element={<OrganizationDeactivationPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/new" element={<CreateUserPage />} />
                <Route path="/users/:id" element={<UserDetailPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/payment-reminders" element={<PaymentRemindersPage />} />
                <Route path="/billing" element={<BillingManagementPage />} />
                <Route path="/admin/permissions" element={<SystemPermissionsPage />} />
                <Route path="/settings" element={<SystemSettingsPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/roles" element={<RolesPage />} />
                <Route path="/feature-controls" element={<FeatureControlsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DashboardLayout>
          </AdminGuard>
        } />
    </Routes>
  );
}
