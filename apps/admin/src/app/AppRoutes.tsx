import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminGuard } from './components/auth/AdminGuard';
import { PublicRoute } from './components/auth/PublicRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { CreateOrganizationPage } from './pages/CreateOrganizationPage';
import { CreateUserPage } from './pages/CreateUserPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { OrganizationDetailPage } from './pages/OrganizationDetailPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { UsersPage } from './pages/UsersPage';

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
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/new" element={<CreateUserPage />} />
                <Route path="/users/:id" element={<UserDetailPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DashboardLayout>
          </AdminGuard>
        } />
    </Routes>
  );
}
