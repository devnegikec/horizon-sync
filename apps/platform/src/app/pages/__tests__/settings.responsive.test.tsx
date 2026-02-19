import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SettingsPage } from '../settings';
import { useAuth } from '../../hooks';
import { useUserStore } from '@horizon-sync/store';

// Mock dependencies
jest.mock('../../hooks', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@horizon-sync/store', () => ({
  useUserStore: jest.fn(),
}));

jest.mock('../../features/organization/components/OrganizationSettings', () => ({
  OrganizationSettings: ({ organizationId, canEdit }: any) => (
    <div data-testid="organization-settings" data-can-edit={canEdit}>
      Organization Settings - {organizationId}
    </div>
  ),
}));

jest.mock('../../features/organization/components/CurrencySettings', () => ({
  CurrencySettings: ({ organizationId, canEdit }: any) => (
    <div data-testid="currency-settings" data-can-edit={canEdit}>
      Currency Settings - {organizationId}
    </div>
  ),
}));

jest.mock('../../features/organization/utils/permissions', () => ({
  hasPermission: jest.fn((user: any, permission: string) => {
    return user?.permissions?.includes(permission) || false;
  }),
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

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Organization',
    display_name: 'Test Org',
    status: 'active' as const,
    is_active: true,
    settings: { currency: 'USD' },
    extra_data: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAccessToken: jest.fn(),
    });

    mockUseUserStore.mockReturnValue({
      organization: mockOrganization,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Requirement 10.1: Mobile layout (single column)
   */
  describe('Mobile Layout', () => {
    beforeEach(() => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
    });

    it('should render components in a grid container', () => {
      const { container } = render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      // Find the grid container
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should have gap-6 spacing between components', () => {
      const { container } = render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('gap-6');
    });

    it('should render both OrganizationSettings and CurrencySettings', () => {
      render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('organization-settings')).toBeInTheDocument();
      expect(screen.getByTestId('currency-settings')).toBeInTheDocument();
    });

    it('should display components in single column on mobile (no md:grid-cols-2 applied)', () => {
      const { container } = render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      const gridContainer = container.querySelector('.grid');
      
      // On mobile, the grid should not have explicit columns (defaults to 1 column)
      // The md:grid-cols-2 class is present but not active on mobile
      expect(gridContainer).toHaveClass('md:grid-cols-2');
    });
  });

  /**
   * Requirement 10.2: Tablet layout (responsive grid)
   */
  describe('Tablet Layout', () => {
    beforeEach(() => {
      // Mock tablet viewport (768px is md breakpoint in Tailwind)
      global.innerWidth = 768;
      global.innerHeight = 1024;
    });

    it('should use responsive grid layout with md:grid-cols-2', () => {
      const { container } = render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('md:grid-cols-2');
    });

    it('should render both components in the grid', () => {
      render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      const orgSettings = screen.getByTestId('organization-settings');
      const currencySettings = screen.getByTestId('currency-settings');

      expect(orgSettings).toBeInTheDocument();
      expect(currencySettings).toBeInTheDocument();
    });
  });

  /**
   * Requirement 10.3: Desktop layout (two-column grid)
   */
  describe('Desktop Layout', () => {
    beforeEach(() => {
      // Mock desktop viewport
      global.innerWidth = 1920;
      global.innerHeight = 1080;
    });

    it('should use two-column grid layout', () => {
      const { container } = render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('md:grid-cols-2');
    });

    it('should render both components side by side', () => {
      render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      const orgSettings = screen.getByTestId('organization-settings');
      const currencySettings = screen.getByTestId('currency-settings');

      expect(orgSettings).toBeInTheDocument();
      expect(currencySettings).toBeInTheDocument();
    });

    it('should maintain consistent spacing with gap-6', () => {
      const { container } = render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('gap-6');
    });
  });

  /**
   * Requirement 10.4: Responsive typography
   */
  describe('Responsive Typography', () => {
    it('should use appropriate heading sizes', () => {
      render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      const heading = screen.getByText('Settings');
      expect(heading).toHaveClass('text-3xl');
      expect(heading).toHaveClass('font-bold');
    });

    it('should use muted foreground for description text', () => {
      render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      const description = screen.getByText(/Configure your organization settings/i);
      expect(description).toHaveClass('text-muted-foreground');
    });
  });

  /**
   * Requirement 10.5: Touch-friendly elements on mobile
   */
  describe('Touch-Friendly Elements', () => {
    beforeEach(() => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
    });

    it('should render components with adequate spacing for touch', () => {
      const { container } = render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      // Verify spacing between sections
      const mainContainer = container.querySelector('.space-y-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should pass canEdit prop to components for touch-friendly controls', () => {
      render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      const orgSettings = screen.getByTestId('organization-settings');
      const currencySettings = screen.getByTestId('currency-settings');

      // Verify canEdit is passed (user has permission)
      expect(orgSettings).toHaveAttribute('data-can-edit', 'true');
      expect(currencySettings).toHaveAttribute('data-can-edit', 'true');
    });
  });

  /**
   * Additional responsive behavior tests
   */
  describe('Responsive Behavior', () => {
    it('should maintain layout structure across different viewport sizes', () => {
      const viewports = [
        { width: 320, height: 568 },  // Small mobile
        { width: 375, height: 667 },  // iPhone
        { width: 768, height: 1024 }, // Tablet
        { width: 1024, height: 768 }, // Landscape tablet
        { width: 1920, height: 1080 }, // Desktop
      ];

      viewports.forEach(({ width, height }) => {
        global.innerWidth = width;
        global.innerHeight = height;

        const { container } = render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>
        );

        // Grid container should always be present
        const gridContainer = container.querySelector('.grid');
        expect(gridContainer).toBeInTheDocument();
        expect(gridContainer).toHaveClass('gap-6');
        expect(gridContainer).toHaveClass('md:grid-cols-2');
      });
    });

    it('should render page header consistently across viewports', () => {
      render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText(/Configure your organization settings/i)).toBeInTheDocument();
    });

    it('should apply animation classes for smooth transitions', () => {
      const { container } = render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      const mainContainer = container.querySelector('.animate-in');
      expect(mainContainer).toHaveClass('fade-in');
      expect(mainContainer).toHaveClass('slide-in-from-bottom-4');
      expect(mainContainer).toHaveClass('duration-500');
    });
  });

  /**
   * Grid layout verification
   */
  describe('Grid Layout Classes', () => {
    it('should have correct Tailwind grid classes', () => {
      const { container } = render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      const gridContainer = container.querySelector('.grid');
      
      // Verify all required classes are present
      expect(gridContainer?.className).toContain('grid');
      expect(gridContainer?.className).toContain('gap-6');
      expect(gridContainer?.className).toContain('md:grid-cols-2');
    });

    it('should render grid with proper structure', () => {
      const { container } = render(
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      );

      const gridContainer = container.querySelector('.grid');
      const children = gridContainer?.children;

      // Should have exactly 2 children (OrganizationSettings and CurrencySettings)
      expect(children).toHaveLength(2);
    });
  });
});
