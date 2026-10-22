/**
 * Razorpay Standard Checkout loader.
 *
 * The backend creates the Razorpay order and returns `key_id` + `order_id`; this
 * module loads `checkout.js`, opens the payment window and resolves with the
 * result. Signature verification and credit granting always happen server-side.
 */

const SCRIPT_ID = 'razorpay-checkout-js';
const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export interface RazorpayPaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number | string;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: { color?: string };
}

interface RazorpayFailure {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: RazorpayFailure) => void) => void;
}

type RazorpayConstructor = new (options: RazorpayOptions & {
  handler: (response: RazorpayPaymentResult) => void;
  modal?: { ondismiss?: () => void; backdropclose?: boolean };
}) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export type RazorpayOutcome =
  | { status: 'success'; payment: RazorpayPaymentResult }
  | { status: 'failed'; message: string }
  | { status: 'dismissed' };

/** Injects the Razorpay checkout script once and reports whether it is usable. */
export function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');

    const onLoad = () => resolve(Boolean(window.Razorpay));
    const onError = () => resolve(false);

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

/** Opens Razorpay Checkout and resolves when the customer succeeds, fails or dismisses it. */
export async function openRazorpayCheckout(options: RazorpayOptions): Promise<RazorpayOutcome> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    return { status: 'failed', message: 'Could not load Razorpay Checkout. Check your connection and try again.' };
  }

  const RazorpayCtor = window.Razorpay;

  return new Promise((resolve) => {
    let settled = false;
    const settle = (outcome: RazorpayOutcome) => {
      if (settled) return;
      settled = true;
      resolve(outcome);
    };

    const instance = new RazorpayCtor({
      ...options,
      handler: (payment) => settle({ status: 'success', payment }),
      modal: { ondismiss: () => settle({ status: 'dismissed' }) },
    });

    instance.on('payment.failed', (response) => {
      settle({ status: 'failed', message: response.error?.description ?? 'Payment failed. Please try again.' });
    });

    instance.open();
  });
}
