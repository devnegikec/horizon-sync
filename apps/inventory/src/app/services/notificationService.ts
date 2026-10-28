/**
 * Notification Service
 * Centralized toast notification management
 * 
 * Note: This uses a simple implementation. For production, consider:
 * - Installing 'sonner' or 'react-hot-toast'
 * - Using a proper toast library with better UX
 */

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

class NotificationService {
  private toastContainer: HTMLDivElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initContainer();
    }
  }

  private initContainer() {
    if (this.toastContainer) return;

    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'toast-container';
    this.toastContainer.style.cssText = `
      position: fixed;
      top: 4.75rem;
      right: 1.25rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: min(360px, calc(100vw - 2rem));
      max-width: calc(100vw - 2rem);
      box-sizing: border-box;
      pointer-events: none;
    `;
    document.body.appendChild(this.toastContainer);
  }

  private show(message: string, type: NotificationType, options: ToastOptions = {}) {
    if (!this.toastContainer) this.initContainer();
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    const duration = options.duration || 4000;

    const styles = {
      success: { background: '#15803d', icon: '✓' },
      error: { background: '#b91c1c', icon: '!' },
      warning: { background: '#a16207', icon: '!' },
      info: { background: '#1d4ed8', icon: 'i' },
    };

    const style = styles[type];
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    toast.style.cssText = `
      width: 100%;
      box-sizing: border-box;
      display: grid;
      grid-template-columns: 1.75rem minmax(0, 1fr) auto;
      align-items: start;
      gap: 0.65rem;
      padding: 0.8rem 0.85rem;
      border-radius: 0.75rem;
      background: ${style.background};
      color: #fff;
      font: 500 0.875rem/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-shadow: 0 10px 24px rgb(0 0 0 / 18%);
      overflow-wrap: anywhere;
      pointer-events: auto;
      animation: slide-in 0.25s ease-out;
    `;

    const icon = document.createElement('span');
    icon.textContent = style.icon;
    icon.style.cssText = 'display:flex;align-items:center;justify-content:center;width:1.5rem;height:1.5rem;border:1px solid rgb(255 255 255 / 55%);border-radius:999px;font-weight:700;';

    const messageElement = document.createElement('span');
    messageElement.textContent = message;
    messageElement.style.cssText = 'min-width:0;overflow-wrap:anywhere;';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Dismiss notification');
    closeButton.textContent = '×';
    closeButton.style.cssText = 'border:0;background:transparent;color:inherit;cursor:pointer;font-size:1.25rem;line-height:1;padding:0 0.1rem;opacity:0.85;';

    toast.append(icon, messageElement, closeButton);

    this.toastContainer.appendChild(toast);

    let dismissTimer: ReturnType<typeof setTimeout> | undefined;
    const dismiss = () => {
      if (dismissTimer) clearTimeout(dismissTimer);
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-6px)';
      toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      setTimeout(() => toast.remove(), 220);
    };
    closeButton.addEventListener('click', dismiss);

    dismissTimer = setTimeout(dismiss, duration);
  }

  success(message: string, options?: ToastOptions) {
    this.show(message, 'success', options);
  }

  error(message: string, options?: ToastOptions) {
    this.show(message, 'error', options);
  }

  warning(message: string, options?: ToastOptions) {
    this.show(message, 'warning', options);
  }

  info(message: string, options?: ToastOptions) {
    this.show(message, 'info', options);
  }

  // Specific handlers for QR block operations
  insufficientCredits(available: number, required: number) {
    this.error(
      `Insufficient credits: ${available.toLocaleString()} available, ${required.toLocaleString()} required. Please contact support to top up.`,
      { duration: 6000 }
    );
  }

  blockGenerating() {
    this.info('Block generation started. This may take a few minutes for large batches.');
  }

  blockCompleted(blockNo: string) {
    this.success(`Block "${blockNo}" generated successfully!`);
  }

  blockFailed() {
    this.error('Block generation failed. No credits were deducted. Please try again.');
  }

  masterPackOverridden() {
    this.warning(
      'Items per Master Pack is configured on this product and has been auto-populated. Changing it overrides the product default and may affect master pack grouping.',
      { duration: 6000 }
    );
  }

  networkError() {
    this.warning('Connection lost. Retrying...', { duration: 3000 });
  }

  conflictError() {
    this.warning('Block is currently being generated. Please wait...', { duration: 3000 });
  }
}

export const notificationService = new NotificationService();

// Add CSS animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `;
  document.head.appendChild(style);
}
