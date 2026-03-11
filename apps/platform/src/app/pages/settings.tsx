import * as React from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import { useUserStore } from '@horizon-sync/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';

import { OrganizationConfigSettings } from '../features/organization/components/OrganizationConfigSettings';
import { hasPermissionFromStore } from '../features/organization/utils/permissions';
import { useAuth } from '../hooks';
import { BankingDashboard } from '../features/banking/components/BankingDashboard';
import { BankAccountManager } from '../features/banking/components/BankAccountManager';
import { PaymentCenter } from '../features/banking/components/PaymentCenter';
import { TransferWorkflow } from '../features/banking/components/TransferWorkflow';
import { BankApiConnector } from '../features/banking/components/BankApiConnector';
import { CreateBankAccountForm } from '../features/banking/components/forms/CreateBankAccountForm';
import { PaymentForm } from '../features/banking/components/forms/PaymentForm';


/**
 * SettingsPage Component
 * 
 * Main container for organization settings page.
 * Displays organization information, currency configuration, and banking settings.
 * 
 * Requirements: 7.1, 6.1, 6.2, 10.1, 10.2, 10.3
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken, isAuthenticated } = useAuth();
  const isBankingRoute = location.pathname.startsWith('/settings/banking');

  // Banking route handler function
  const RenderBankingRoute = () => {
    const pathname = location.pathname;
    
    // Default banking dashboard
    if (pathname === '/settings/banking') {
      return <BankingDashboard />;
    }
    
    // Bank Account Management
    if (pathname === '/settings/banking/accounts') {
      return <BankAccountManager />;
    }
    
    if (pathname === '/settings/banking/accounts/new') {
      return (
        <CreateBankAccountForm
          glAccountId="00000000-0000-0000-0000-000000000000"
          onSuccess={() => window.history.back()}
          onCancel={() => window.history.back()}
        />
      );
    }
    
    // Payment Center
    if (pathname === '/settings/banking/payments') {
      return <PaymentCenter />;
    }
    
    if (pathname === '/settings/banking/payments/new') {
      return (
        <PaymentForm
          onSuccess={() => window.history.back()}
          onCancel={() => window.history.back()}
        />
      );
    }
    
    // Transfer Workflow
    if (pathname === '/settings/banking/transfers') {
      return <TransferWorkflow />;
    }
    
    if (pathname === '/settings/banking/transfers/new') {
      return <TransferWorkflow glAccountId="default-gl-account" />;
    }
    
    // Bank API Integration
    if (pathname === '/settings/banking/api') {
      return <BankApiConnector />;
    }
    
    if (pathname.startsWith('/settings/banking/api/')) {
      return <BankApiConnector />;
    }
    
    // Activity and History
    if (pathname === '/settings/banking/activity') {
      return <div>Banking Activity (To be implemented)</div>;
    }
    
    if (pathname === '/settings/banking/analytics') {
      return <div>Banking Analytics (To be implemented)</div>;
    }
    
    // Default fallback to dashboard
    return <BankingDashboard />;
  };

  // Requirement 6.1, 6.2: Check authentication and redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user || !accessToken) {
    return null;
  }

  // Get organization_id from user
  const organizationId = user.organization_id;

  // If no organization_id, show error message
  if (!organizationId) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your organization settings and preferences
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No organization found for your account.</p>
        </div>
      </div>
    );
  }

  // Check if user has permission to edit organization settings from global store
  const canEdit = hasPermissionFromStore('organization.update');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your organization settings and preferences
        </p>
      </div>

      {/* Settings Content with Tabs */}
      {/* Requirement 10.1, 10.2, 10.3: Responsive layout */}
      <Tabs value={isBankingRoute ? 'banking' : 'general'} onValueChange={(value) => {
        if (value === 'banking') {
          navigate('/settings/banking');
        } else {
          navigate('/settings');
        }
      }} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="banking">Banking</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Organization Configuration Settings (Currencies, Naming Series, Address) */}
          <OrganizationConfigSettings organizationId={organizationId} accessToken={accessToken} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="banking" className="space-y-6">
          {/* Banking Settings - Conditional Component Rendering based on path */}
          {RenderBankingRoute()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

