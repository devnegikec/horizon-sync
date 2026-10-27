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
  secure_verified_at: null,
  one_time_verified_at: null,
  activation_method: 'pre',
  industry: 'Consumer Goods',
  warranty_period_months: 18,
  batch_number: 'BATCH-2026-01',
  manufacturing_date: '2026-01-10',
  expiry_date: '2027-01-10',
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
    mockedAxios.get.mockResolvedValue({ data: { config: null } } as never);
  });

  it('renders the branded enterprise landing page for an authentic Dynamic QR', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: authenticResult });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Authentic Product' })).toBeInTheDocument();
    expect(screen.getByText('Demo Brand')).toBeInTheDocument();
    expect(screen.getByText('DEMO-BLU-L')).toBeInTheDocument();
    expect(screen.getByText('BATCH-2026-01')).toBeInTheDocument();
    expect(screen.getByText('2026-01-10')).toBeInTheDocument();
    expect(screen.getByText('2027-01-10')).toBeInTheDocument();
    expect(screen.getByText('support@example.com')).toBeInTheDocument();
    expect(screen.getByAltText('Demo Product banner')).toHaveAttribute('src', 'https://images.example/banner.png');
    expect(screen.getByText(/Powered by/i)).toBeInTheDocument();
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/public/qr/verify'),
      {
        gtin: '0123456789012',
        serial_number: 'PRO-ABC12345',
        timestamp: '1770000000000',
        signature: 'signed-value',
      },
      { headers: { 'X-Scan-Event-Id': expect.any(String) } },
    );
  });

  it('requests browser location automatically without rendering a location card', async () => {
    const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
    const getCurrentPosition = jest.fn((onSuccess: PositionCallback) => {
      onSuccess({
        coords: {
          latitude: 28.6139,
          longitude: 77.209,
          accuracy: 25,
        } as GeolocationCoordinates,
        timestamp: Date.now(),
      } as GeolocationPosition);
    });
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });
    mockedAxios.post.mockResolvedValueOnce({
      data: { ...authenticResult, scan_event_id: 'scan-event-id' },
    });
    mockedAxios.patch.mockResolvedValueOnce({ data: undefined } as never);

    try {
      renderPage();

      expect(await screen.findByRole('heading', { name: 'Authentic Product' })).toBeInTheDocument();
      await waitFor(() => expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/public/qr/scans/scan-event-id/location'),
        {
          latitude: 28.6139,
          longitude: 77.209,
          accuracy_meters: 25,
        },
      ));
      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Help protect genuine products')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /share location/i })).not.toBeInTheDocument();
    } finally {
      if (originalGeolocation) {
        Object.defineProperty(navigator, 'geolocation', originalGeolocation);
      } else {
        delete (navigator as Navigator & { geolocation?: Geolocation }).geolocation;
      }
    }
  });

  it('renders the dedicated first-time enterprise state for an authentic One-Time QR', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        config: {
          banner_image_url: '/static/landing-pages/one-time-banner.png',
          social_links: [{ platform: 'facebook', url: 'https://example.com/social', enabled: true }],
          warranty: { enabled: true, title: 'One-Time warranty' },
          feedback: { enabled: true, type: 'feedback', title: 'One-Time feedback' },
          custom_cta: { enabled: true, button_text: 'One-Time CTA', button_url: 'https://example.com/cta' },
        },
      },
    } as never);
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        ...authenticResult,
        qr_type: 'one_time',
        scan_event_id: 'one-time-event-id',
        one_time_verified_at: '2026-10-13T15:20:00.000Z',
        message: 'This product is genuine and verified.',
      },
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Product authentication successful' })).toBeInTheDocument();
    expect(screen.getByText('First-time authentication complete')).toBeInTheDocument();
    expect(screen.getByText('One-Time QR')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Product details' })).toBeInTheDocument();
    expect(screen.getByText('PRO-ABC12345')).toBeInTheDocument();
    expect(screen.getByText('This one-time QR code is now protected against reuse.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Authentic Product' })).not.toBeInTheDocument();
    expect(screen.queryByText('Help protect genuine products')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Demo Product banner')).not.toBeInTheDocument();
    expect(screen.queryByText('Need assistance?')).not.toBeInTheDocument();
    expect(screen.queryByText('Stay connected')).not.toBeInTheDocument();
    expect(screen.queryByText('One-Time warranty')).not.toBeInTheDocument();
    expect(screen.queryByText('One-Time feedback')).not.toBeInTheDocument();
    expect(screen.queryByText('One-Time CTA')).not.toBeInTheDocument();
    expect(screen.queryByText('GTIN')).not.toBeInTheDocument();
  });

  it('renders the authenticated product state on a second One-Time QR scan', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        ...authenticResult,
        verification_status: 'already_used',
        authentic: false,
        qr_type: 'one_time',
        one_time_verified_at: '2026-10-14T06:52:00.000Z',
        message: 'This One-Time QR code has already been used.',
      },
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Product Authentication' })).toBeInTheDocument();
    expect(screen.getByText(/This product was successfully authenticated on Oct 14, 2026/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Product Details:' })).toBeInTheDocument();
    expect(screen.getByText('PRO-ABC12345')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Code Already Used' })).not.toBeInTheDocument();
    expect(screen.queryByText('Please enter the secure code')).not.toBeInTheDocument();
  });

  it('applies the saved public landing-page configuration', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: authenticResult });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        config: {
          logo_url: '/static/landing-pages/demo-logo.png',
          banner_image_url: '/static/landing-pages/demo-banner.png',
          primary_color: '#0f766e',
          accent_color: '#f97316',
          product_details: {
            show_gtin: false,
            show_batch: false,
            show_mfg_date: false,
            show_expiry_date: false,
            show_serial_number: true,
            custom_fields: [{ label: 'Material', value: 'Recycled aluminium' }],
          },
          footer: {
            text: 'Demo Brand official verification',
            show_powered_by: false,
            custom_links: [{ label: 'Privacy', url: 'https://example.com/privacy' }],
          },
          social_links: [{ platform: 'instagram', url: 'https://instagram.com/demo-brand', enabled: true }],
          warranty: {
            enabled: true,
            title: 'Extended warranty',
            description: 'Protect your product for longer.',
            cta_text: 'View coverage',
            cta_url: 'https://example.com/warranty',
          },
          feedback: {
            enabled: true,
            type: 'survey',
            title: 'Have thoughts?',
            description: 'Tell us about your verification experience.',
            survey_url: 'https://example.com/survey',
          },
          custom_cta: {
            enabled: true,
            button_text: 'Shop now',
            button_url: 'https://example.com/shop',
            button_style: 'outline',
          },
        },
      },
    } as never);

    renderPage();

    await screen.findByRole('heading', { name: 'Authentic Product' });
    await waitFor(() => expect(screen.getByAltText('Demo Brand logo')).toHaveAttribute('src', 'http://localhost/static/landing-pages/demo-logo.png'));
    expect(screen.getByAltText('Demo Product banner')).toHaveAttribute('src', 'http://localhost/static/landing-pages/demo-banner.png');
    expect(screen.queryByText('0123456789012')).not.toBeInTheDocument();
    expect(screen.queryByText('BATCH-2026-01')).not.toBeInTheDocument();
    expect(screen.queryByText('2026-01-10')).not.toBeInTheDocument();
    expect(screen.queryByText('2027-01-10')).not.toBeInTheDocument();
    expect(screen.getByText('Recycled aluminium')).toBeInTheDocument();
    expect(screen.getByText('Demo Brand official verification')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', 'https://example.com/privacy');
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://instagram.com/demo-brand');
    expect(screen.getByRole('heading', { name: 'Extended warranty' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Have thoughts?' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Shop now/i })).toHaveAttribute('href', 'https://example.com/shop');
    expect(screen.queryByText(/Powered by/i)).not.toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/api/v1/public/products/sku/0123456789012/landing-page'));
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
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ qr_channel: 'overt' }), expect.any(Object));
  });

  it('restores plus characters from legacy unencoded Base64 signatures', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: authenticResult });

    renderPage('/g/0123456789012/s/PRO-ABC12345/1770000000000?c=MEQC+ABC%2FDEF%3D');

    await screen.findByRole('heading', { name: 'Authentic Product' });
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signature: 'MEQC+ABC/DEF=' }), expect.any(Object));
  });

  it('submits a protected code and renders the Secure Code result', async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({
      data: {
        config: {
          banner_image_url: '/static/landing-pages/secure-banner.png',
          social_links: [{ platform: 'facebook', url: 'https://example.com/social', enabled: true }],
          feedback: { enabled: true, type: 'feedback', title: 'Your experience matters' },
          warranty: { enabled: true, title: 'Warranty' },
        },
      },
    } as never);
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
        data: { ...authenticResult, qr_type: 'secure_code', scan_event_id: 'secure-event-id' },
      });

    renderPage();

    const input = await screen.findByLabelText('Protected product code');
    expect(screen.getByRole('heading', { name: 'Product Authentication' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Please enter the secure code' })).toBeInTheDocument();
    await user.type(input, 'a1b2c3d4e5f6');
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalledTimes(2));
    expect(mockedAxios.post).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({ secure_code: 'A1B2C3D4E5F6' }),
      expect.any(Object),
    );
    expect(await screen.findByRole('heading', { name: 'The product authentication has been successfully verified.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Product Information' })).toBeInTheDocument();
    expect(screen.getByText('Secure code verified successfully.')).toBeInTheDocument();
    expect(screen.queryByText('Help protect genuine products')).not.toBeInTheDocument();
    expect(screen.queryByText('Need assistance?')).not.toBeInTheDocument();
    expect(screen.queryByText('Stay connected')).not.toBeInTheDocument();
    expect(screen.queryByText('Warranty')).not.toBeInTheDocument();
    expect(screen.queryByText('Your experience matters')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Demo Product banner')).not.toBeInTheDocument();
  });

  it('shows the previous Secure QR authentication without asking for the code again', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        ...authenticResult,
        qr_type: 'secure_code',
        secure_verified_at: '2026-10-14T06:50:00.000Z',
      },
    });

    renderPage();

    expect(await screen.findByText('The product authentication has been successfully verified.')).toBeInTheDocument();
    expect(screen.queryByText('Please enter the secure code')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /verify code/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Authenticated Oct 14, 2026/i)).toBeInTheDocument();
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
