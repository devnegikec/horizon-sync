import * as React from 'react';

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { PublicQRValidation } from '../PublicQRValidation';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const authenticResult = {
  verification_status: 'authentic',
  authentic: true,
  message: 'This product is genuine and verified.',
  requires_action: false,
  challenge_type: null,
  product_name: 'Demo Product',
  generic_name: 'Demo Generic',
  brand_name: 'Demo Brand',
  sku_name: 'Blue / Large',
  sku_code: 'DEMO-BLU-L',
  variant_attributes: { Colour: 'Blue', Size: 'Large' },
  gtin: '0123456789012',
  serial_number: 'PRO-ABC12345',
  qr_type: 'dynamic',
  qr_channel: null,
  activation_method: 'pre',
  industry: 'Consumer Goods',
  warranty_period_months: 18,
  logo_url: 'https://images.example/logo.png',
  product_image_url: 'https://images.example/product.png',
  banner_image_url: 'https://images.example/banner.png',
  contact_email: 'support@example.com',
  contact_phone: '+91 9999999999',
  website_url: 'https://example.com/product',
};

function renderPage(url = '/g/0123456789012/s/PRO-ABC12345/1770000000000?c=signed-value') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/g/:gtin/s/:serial/:timestamp" element={<PublicQRValidation />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PublicQRValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the branded enterprise landing page for an authentic Dynamic QR', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: authenticResult });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Authentic Product' })).toBeInTheDocument();
    expect(screen.getByText('Demo Brand')).toBeInTheDocument();
    expect(screen.getByText('DEMO-BLU-L')).toBeInTheDocument();
    expect(screen.getByText('support@example.com')).toBeInTheDocument();
    expect(screen.getByAltText('Demo Product banner')).toHaveAttribute('src', 'https://images.example/banner.png');
    expect(screen.getByText(/Powered by/i)).toBeInTheDocument();
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining('/api/v1/public/qr/verify'), {
      gtin: '0123456789012',
      serial_number: 'PRO-ABC12345',
      timestamp: '1770000000000',
      signature: 'signed-value',
    });
  });

  it('shows the protected-layer instruction for a Dual overt QR', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        ...authenticResult,
        verification_status: 'verification_required',
        authentic: false,
        requires_action: true,
        challenge_type: 'scan_covert',
        qr_type: 'dual',
        qr_channel: 'overt',
        message: 'Scan the protected QR code to complete product verification.',
      },
    });

    renderPage('/g/0123456789012/s/PRO-ABC12345/1770000000000?c=signed-value&qr=overt');

    expect(await screen.findByRole('heading', { name: 'Complete Verification' })).toBeInTheDocument();
    expect(screen.getByText('Scan the protected QR')).toBeInTheDocument();
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ qr_channel: 'overt' }));
  });

  it('restores plus characters from legacy unencoded Base64 signatures', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: authenticResult });

    renderPage('/g/0123456789012/s/PRO-ABC12345/1770000000000?c=MEQC+ABC%2FDEF%3D');

    await screen.findByRole('heading', { name: 'Authentic Product' });
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signature: 'MEQC+ABC/DEF=' }));
  });

  it('submits a protected code and renders the Secure Code result', async () => {
    const user = userEvent.setup();
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          ...authenticResult,
          verification_status: 'verification_required',
          authentic: false,
          requires_action: true,
          challenge_type: 'secure_code',
          qr_type: 'secure_code',
          message: 'Enter the protected code to verify this product.',
        },
      })
      .mockResolvedValueOnce({
        data: { ...authenticResult, qr_type: 'secure_code' },
      });

    renderPage();

    const input = await screen.findByLabelText('Protected product code');
    await user.type(input, 'a1b2c3d4e5f6');
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalledTimes(2));
    expect(mockedAxios.post).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ secure_code: 'A1B2C3D4E5F6' }));
    expect(await screen.findByRole('heading', { name: 'Authentic Product' })).toBeInTheDocument();
  });

  it('uses the red failure state for an invalid QR', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        verification_status: 'invalid',
        authentic: false,
        message: 'QR verification failed.',
        requires_action: false,
        challenge_type: null,
        product_name: null,
        generic_name: null,
        brand_name: null,
        sku_name: null,
        sku_code: null,
        variant_attributes: {},
        gtin: null,
        serial_number: null,
        qr_type: null,
        qr_channel: null,
        activation_method: null,
        industry: null,
        warranty_period_months: null,
        logo_url: null,
        product_image_url: null,
        banner_image_url: null,
        contact_email: null,
        contact_phone: null,
        website_url: null,
      },
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Authentication Failed' })).toBeInTheDocument();
    expect(screen.getByText('QR verification failed.')).toBeInTheDocument();
    expect(screen.queryByText('Verified product')).not.toBeInTheDocument();
  });
});
