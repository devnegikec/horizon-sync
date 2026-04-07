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
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
    `;
    document.body.appendChild(this.toastContainer);
  }

  private show(message: string, type: NotificationType, options: ToastOptions = {}) {
    if (!this.toastContainer) this.initContainer();
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    const duration = options.duration || 4000;

    const colors = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      warning: 'bg-yellow-600',
      info: 'bg-blue-600',
    };

    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ',
    };

    toast.className = `${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-2 animate-slide-in`;
    toast.innerHTML = `
      <span class="text-lg font-bold">${icons[type]}</span>
      <span class="flex-1">${message}</span>
      <button class="text-white hover:text-gray-200 font-bold" onclick="this.parentElement.remove()">×</button>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
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
