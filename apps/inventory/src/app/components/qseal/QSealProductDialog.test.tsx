import type React from 'react';

import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { QSealProduct } from '../../types/qseal.types';

import { QSealProductDialog } from './QSealProductDialog';

class ResizeObserverMock {
  observe() {
    return undefined;
  }
  unobserve() {
    return undefined;
  }
  disconnect() {
    return undefined;
  }
}

global.ResizeObserver = ResizeObserverMock;
HTMLElement.prototype.hasPointerCapture = jest.fn(() => false);
HTMLElement.prototype.setPointerCapture = jest.fn();
HTMLElement.prototype.releasePointerCapture = jest.fn();
HTMLElement.prototype.scrollIntoView = jest.fn();
URL.createObjectURL = jest.fn(() => 'blob:http://localhost/preview');
URL.revokeObjectURL = jest.fn();

const shelfLifeSettings = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    setting_type: 'shelf_life' as const,
    value: '12',
    label: '12 Months',
    description: null,
    sort_order: 1,
    is_active: true,
    extra_data: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    setting_type: 'shelf_life' as const,
    value: '24',
    label: '24 Months',
    description: null,
    sort_order: 2,
    is_active: false,
    extra_data: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const serialPrefixSettings = [
  {
    id: '55555555-5555-4555-8555-555555555555',
    organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    setting_type: 'serial_prefix' as const,
    value: 'PH',
    label: 'Pharma',
    description: null,
    sort_order: 1,
    is_active: true,
    extra_data: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

jest.mock('../../features/qr-management/hooks/useBrands', () => ({
  useBrands: () => ({
    data: {
      brands: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          name: 'Saved Brand',
          short_code: 'SB',
        },
      ],
    },
    loading: false,
  }),
}));

jest.mock('../../hooks/useQRProductSettings', () => ({
  useQRProductSettings: jest.fn((settingType: string) => ({
    settings: settingType === 'serial_prefix' ? serialPrefixSettings : shelfLifeSettings,
    loading: false,
    error: null,
  })),
}));

jest.mock('../containers', () => ({
  FormDialog: ({
    children,
    onSubmit,
    submitLabel,
  }: {
    children: React.ReactNode;
    onSubmit: (event: React.FormEvent) => void;
    submitLabel: string;
  }) => (
    <form onSubmit={onSubmit}>
      {children}
      <button type="submit">{submitLabel}</button>
    </form>
  ),
}));

function makeProduct(overrides: Partial<QSealProduct> = {}): QSealProduct {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    brand_id: '33333333-3333-4333-8333-333333333333',
    name: 'Existing Product',
    generic_name: null,
    gtin: '012345678901',
    industry: null,
    qr_type: null,
    is_active: true,
    landing_page: 'https://example.com/product',
    image_url: 'https://images.example/logo.png',
    banner_image_url: 'https://images.example/banner.png',
    email: null,
    phone_number: null,
    client_product_auth_url: 'https://example.com/auth',
    activation_method: 'pre',
    sr_number_type: 'R6DAN',
    serial_prefix_setting_id: serialPrefixSettings[0].id,
    serial_prefix: 'PH',
    redirect_to_client: false,
    warranty_period_months: null,
    shelf_life_setting_id: shelfLifeSettings[0].id,
    extra_data: null,
    created_by: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('QSealProductDialog Shelf Life', () => {
  it('shows the previously selected brand while editing', async () => {
    const product: QSealProduct = {
      id: '44444444-4444-4444-8444-444444444444',
      organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      brand_id: '33333333-3333-4333-8333-333333333333',
      name: 'Existing Product',
      generic_name: null,
      gtin: '012345678901',
      industry: null,
      qr_type: null,
      is_active: true,
      landing_page: null,
      image_url: null,
      banner_image_url: null,
      email: null,
      phone_number: null,
      client_product_auth_url: null,
      activation_method: 'pre',
      sr_number_type: null,
      serial_prefix_setting_id: serialPrefixSettings[0].id,
      serial_prefix: 'PH',
      redirect_to_client: false,
      warranty_period_months: null,
      shelf_life_setting_id: shelfLifeSettings[0].id,
      extra_data: null,
      created_by: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    render(<QSealProductDialog open onOpenChange={jest.fn()} product={product} onSave={jest.fn()} />);

    const brandSelect = screen.getByRole('combobox', { name: 'Brand' });
    await waitFor(() => expect(brandSelect).toHaveTextContent('Saved Brand'));
    expect(brandSelect).toBeDisabled();
  });

  it('renders Shelf Life as a dropdown instead of a numeric input', () => {
    render(<QSealProductDialog open onOpenChange={jest.fn()} onSave={jest.fn()} />);

    expect(screen.getByRole('combobox', { name: 'Shelf Life' })).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton', { name: /Shelf Life/i })).not.toBeInTheDocument();
  });

  it('submits the selected Shelf Life and Serial Prefix UUIDs', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    render(<QSealProductDialog open onOpenChange={jest.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText(/Product Name/i), 'Test Product');
    await user.type(screen.getByLabelText(/GTIN/i), '012345678901');
    await user.type(screen.getByLabelText(/Landing Page/i), 'https://example.com/product');
    await user.type(screen.getByLabelText(/Product Auth URL/i), 'https://example.com/auth');
    await user.click(screen.getByRole('combobox', { name: 'Shelf Life' }));
    await user.click(screen.getByRole('option', { name: '12 Months' }));
    await user.click(screen.getByRole('combobox', { name: 'Serial Prefix' }));
    await user.click(screen.getByRole('option', { name: 'PH — Pharma' }));
    const [logoInput, bannerInput] = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const logoFile = new File(['logo'], 'logo.png', { type: 'image/png' });
    const bannerFile = new File(['banner'], 'banner.png', { type: 'image/png' });
    await user.upload(logoInput, logoFile);
    await user.upload(bannerInput, bannerFile);
    await user.click(screen.getByRole('button', { name: 'Create Product' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          shelf_life_setting_id: shelfLifeSettings[0].id,
          serial_prefix_setting_id: serialPrefixSettings[0].id,
        }),
        expect.objectContaining({
          logoFile,
          bannerFile,
          removeLogo: false,
          removeBanner: false,
        }),
      );
    });
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('warranty_period_months');
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('generic_name');
  }, 10000);

  it('removes Generic Name and requires both Product images on create', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    render(<QSealProductDialog open onOpenChange={jest.fn()} onSave={onSave} />);

    expect(screen.queryByLabelText(/Generic Name/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create Product' }));

    expect(await screen.findByText('Logo is required. Please upload an image.')).toBeInTheDocument();
    expect(screen.getByText('Banner image is required. Please upload an image.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('accepts existing HTTP image URLs during update', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    render(<QSealProductDialog open onOpenChange={jest.fn()} product={makeProduct()} onSave={onSave} />);

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Brand' })).toHaveTextContent('Saved Brand'),
    );
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      expect.not.objectContaining({ generic_name: expect.anything() }),
      expect.objectContaining({ logoFile: null, bannerFile: null }),
    );
  });

  it('rejects an expired blob URL as an existing image during update', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    render(
      <QSealProductDialog open
        onOpenChange={jest.fn()}
        product={makeProduct({ image_url: 'blob:http://localhost:4200/expired-logo' })}
        onSave={onSave}/>,
    );

    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('Logo is required. Please upload an image.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
