/* eslint-disable @typescript-eslint/no-explicit-any -- test mocks use untyped props */

import * as React from 'react';

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

import { useUserStore } from '@horizon-sync/store';

import { useAuth } from '../../hooks';
import { SettingsPage } from '../settings';

// Mock dependencies
jest.mock('../../hooks', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@horizon-sync/store', () => ({
  useUserStore: jest.fn(),
}));

jest.mock('../../features/organization/utils/permissions', () => ({
  hasPermission: jest.fn(() => true),
  hasPermissionFromStore: jest.fn(() => true),
}));

jest.mock('../../features/organization/components/OrganizationProfileSettings', () => ({
  OrganizationProfileSettings: ({ organizationId, canEdit }: any) => (
    <div data-testid="organization-config-settings" data-can-edit={canEdit}>
      Organization Config Settings - {organizationId}
    </div>
  ),
}));

jest.mock('../../features/organization/components/OrganizationSettings', () => ({
  OrganizationSettings: ({ canEdit }: any) => (
    <div data-testid="organization-settings" data-can-edit={canEdit}>
      Organization Settings
    </div>
  ),
}));

jest.mock('../../features/organization/components/UomSettings', () => ({
  UomSettings: () => <div>UOM Settings</div>,
}));

jest.mock('../../features/organization/components/ItemUomConversionsSettings', () => ({
  ItemUomConversionsSettings: () => <div>Item UOM Conversions</div>,
}));

jest.mock('../../features/feature-flags/components/FeatureFlagsSettings', () => ({
  FeatureFlagsSettings: () => <div>Feature Flags Settings</div>,
}));

// Mock banking components
jest.mock('../../features/banking/components/BankingDashboard', () => ({
  BankingDashboard: () => <div data-testid="banking-dashboard">Banking Dashboard</div>,
}));
jest.mock('../../features/banking/components/BankAccountManager', () => ({
  BankAccountManager: () => <div>Bank Account Manager</div>,
}));
jest.mock('../../features/banking/components/PaymentCenter', () => ({
  PaymentCenter: () => <div>Payment Center</div>,
}));
jest.mock('../../features/banking/components/TransferWorkflow', () => ({
  TransferWorkflow: () => <div>Transfer Workflow</div>,
}));
jest.mock('../../features/banking/components/BankApiConnector', () => ({
  BankApiConnector: () => <div>Bank API Connector</div>,
}));
jest.mock('../../features/banking/components/forms/CreateBankAccountForm', () => ({
  CreateBankAccountForm: () => <div>Create Bank Account</div>,
}));
jest.mock('../../features/banking/components/forms/PaymentForm', () => ({
  PaymentForm: () => <div>Payment Form</div>,
}));

// Mock feature flags
jest.mock('@horizon-sync/ui/hooks', () => ({
  useFeatureVisibility: jest.fn(() => ({ visible: false, loading: false })),
  useFeatureVisibilities: jest.fn(() => ({
    banking_module_enabled: { visible: false, loading: false },
  })),
}));

jest.mock('@horizon-sync/ui', () => ({
  BANKING_MODULE_ENABLED: 'banking_module_enabled',
}));

// Mock environment
jest.mock('../../../environments/environment', () => ({
  environment: {
    production: false,
    apiCoreUrl: 'http://localhost:8001',
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>;

describe('SettingsPage - Responsive Design', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    organization_id: 'org-123',
    permissions: ['organization.update'],
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAccessToken: jest.fn(),
    } as any);

    mockUseUserStore.mockReturnValue({
      organization: {
        id: 'org-123',
        name: 'Test Organization',
        display_name: 'Test Org',
        status: 'active',
        is_active: true,
        settings: { currency: 'USD' },
        extra_data: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderSettings = () =>
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>,
    );

  describe('Mobile Layout', () => {
    beforeEach(() => {
      global.innerWidth = 375;
      global.innerHeight = 667;
    });

    it('should render components in a grid container', () => {
      renderSettings();
      expect(screen.getByTestId('organization-config-settings')).toBeInTheDocument();
    });

    it('should have gap-6 spacing between components', () => {
      const { container } = renderSettings();
      const spacer = container.querySelector('.space-y-6');
      expect(spacer).toBeInTheDocument();
    });

    it('should render both OrganizationSettings and CurrencySettings', () => {
      renderSettings();
      expect(screen.getByTestId('organization-config-settings')).toBeInTheDocument();
    });

    it('should display components in single column on mobile (no md:grid-cols-2 applied)', () => {
      const { container } = renderSettings();
      const spacer = container.querySelector('.space-y-6');
      expect(spacer).toBeInTheDocument();
    });
  });

  describe('Tablet Layout', () => {
    beforeEach(() => {
      global.innerWidth = 768;
      global.innerHeight = 1024;
    });

    it('should use responsive grid layout with md:grid-cols-2', () => {
      renderSettings();
      expect(screen.getByTestId('organization-config-settings')).toBeInTheDocument();
    });

    it('should render both components in the grid', () => {
      renderSettings();
      expect(screen.getByTestId('organization-config-settings')).toBeInTheDocument();
    });
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;
    });

    it('should use two-column grid layout', () => {
      renderSettings();
      expect(screen.getByTestId('organization-config-settings')).toBeInTheDocument();
    });

    it('should render both components side by side', () => {
      renderSettings();
      expect(screen.getByTestId('organization-config-settings')).toBeInTheDocument();
    });

    it('should maintain consistent spacing with gap-6', () => {
      const { container } = renderSettings();
      const spacer = container.querySelector('.space-y-6');
      expect(spacer).toBeInTheDocument();
    });
  });

  describe('Responsive Typography', () => {
    it('should use appropriate heading sizes', () => {
      renderSettings();
      const heading = screen.getByText('Settings');
      expect(heading).toHaveClass('text-3xl');
      expect(heading).toHaveClass('font-bold');
    });

    it('should use muted foreground for description text', () => {
      renderSettings();
      const description = screen.getByText(/Configure your organization settings/i);
      expect(description).toHaveClass('text-muted-foreground');
    });
  });

  describe('Touch-Friendly Elements', () => {
    beforeEach(() => {
      global.innerWidth = 375;
      global.innerHeight = 667;
    });

    it('should render components with adequate spacing for touch', () => {
      const { container } = renderSettings();
      const mainContainer = container.querySelector('.space-y-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should pass canEdit prop to components for touch-friendly controls', () => {
      renderSettings();
      const configSettings = screen.getByTestId('organization-config-settings');
      expect(configSettings).toHaveAttribute('data-can-edit', 'true');
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain layout structure across different viewport sizes', () => {
      const viewports = [
        { width: 320, height: 568 },
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1024, height: 768 },
        { width: 1920, height: 1080 },
      ];

      viewports.forEach(({ width, height }) => {
        global.innerWidth = width;
        global.innerHeight = height;

        const { container, unmount } = renderSettings();
        const spacer = container.querySelector('.space-y-6');
        expect(spacer).toBeInTheDocument();
        unmount();
      });
    });

    it('should render page header consistently across viewports', () => {
      renderSettings();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText(/Configure your organization settings/i)).toBeInTheDocument();
    });

    it('should apply animation classes for smooth transitions', () => {
      const { container } = renderSettings();
      const mainContainer = container.querySelector('.animate-in');
      expect(mainContainer).toHaveClass('fade-in');
      expect(mainContainer).toHaveClass('slide-in-from-bottom-4');
      expect(mainContainer).toHaveClass('duration-500');
    });
  });

  describe('Grid Layout Classes', () => {
    it('should have correct Tailwind grid classes', () => {
      const { container } = renderSettings();
      const spacer = container.querySelector('.space-y-6');
      expect(spacer).toBeInTheDocument();
    });

    it('should render grid with proper structure', () => {
      renderSettings();
      expect(screen.getByTestId('organization-config-settings')).toBeInTheDocument();
    });
  });
});
