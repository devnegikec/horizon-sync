import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../../../app/components/quotations/StatusBadge';

describe('StatusBadge', () => {
  describe('Quotation statuses', () => {
    it('should render DRAFT status with amber styling', () => {
      const { container } = render(<StatusBadge status="draft" />);
      
      expect(screen.getByText('Draft')).toBeTruthy();
      const badge = container.querySelector('.bg-amber-100');
      expect(badge).toBeTruthy();
    });

    it('should render SENT status with blue styling', () => {
      const { container } = render(<StatusBadge status="sent" />);
      
      expect(screen.getByText('Sent')).toBeTruthy();
      const badge = container.querySelector('.bg-blue-100');
      expect(badge).toBeTruthy();
    });

    it('should render ACCEPTED status with green styling', () => {
      const { container } = render(<StatusBadge status="accepted" />);
      
      expect(screen.getByText('Accepted')).toBeTruthy();
      const badge = container.querySelector('.bg-green-100');
      expect(badge).toBeTruthy();
    });

    it('should render REJECTED status with red styling', () => {
      const { container } = render(<StatusBadge status="rejected" />);
      
      expect(screen.getByText('Rejected')).toBeTruthy();
      const badge = container.querySelector('.bg-red-100');
      expect(badge).toBeTruthy();
    });

    it('should render EXPIRED status with gray styling', () => {
      const { container } = render(<StatusBadge status="expired" />);
      
      expect(screen.getByText('Expired')).toBeTruthy();
      const badge = container.querySelector('.bg-gray-100');
      expect(badge).toBeTruthy();
    });
  });

  describe('Sales Order statuses', () => {
    it('should render CONFIRMED status with blue styling', () => {
      const { container } = render(<StatusBadge status="confirmed" />);
      
      expect(screen.getByText('Confirmed')).toBeTruthy();
      const badge = container.querySelector('.bg-blue-100');
      expect(badge).toBeTruthy();
    });

    it('should render PARTIALLY_DELIVERED status with purple styling', () => {
      const { container } = render(<StatusBadge status="partially_delivered" />);
      
      expect(screen.getByText('Partially Delivered')).toBeTruthy();
      const badge = container.querySelector('.bg-purple-100');
      expect(badge).toBeTruthy();
    });

    it('should render DELIVERED status with green styling', () => {
      const { container } = render(<StatusBadge status="delivered" />);
      
      expect(screen.getByText('Delivered')).toBeTruthy();
      const badge = container.querySelector('.bg-green-100');
      expect(badge).toBeTruthy();
    });

    it('should render CLOSED status with gray styling', () => {
      const { container } = render(<StatusBadge status="closed" />);
      
      expect(screen.getByText('Closed')).toBeTruthy();
      const badge = container.querySelector('.bg-gray-100');
      expect(badge).toBeTruthy();
    });

    it('should render CANCELLED status with red styling', () => {
      const { container } = render(<StatusBadge status="cancelled" />);
      
      expect(screen.getByText('Cancelled')).toBeTruthy();
      const badge = container.querySelector('.bg-red-100');
      expect(badge).toBeTruthy();
    });
  });

  describe('className prop merging', () => {
    it('should merge custom className with status styling', () => {
      const { container } = render(
        <StatusBadge status="draft" className="custom-class" />
      );
      
      const badge = container.querySelector('.custom-class');
      expect(badge).toBeTruthy();
      expect(badge?.classList.contains('bg-amber-100')).toBe(true);
    });

    it('should allow custom className to override default styling', () => {
      const { container } = render(
        <StatusBadge status="sent" className="bg-custom-color" />
      );
      
      const badge = container.querySelector('.bg-custom-color');
      expect(badge).toBeTruthy();
    });
  });

  describe('case insensitivity', () => {
    it('should handle uppercase status', () => {
      render(<StatusBadge status="DRAFT" />);
      expect(screen.getByText('Draft')).toBeTruthy();
    });

    it('should handle mixed case status', () => {
      render(<StatusBadge status="Accepted" />);
      expect(screen.getByText('Accepted')).toBeTruthy();
    });
  });

  describe('unknown status', () => {
    it('should render unknown status with default gray styling', () => {
      const { container } = render(<StatusBadge status="unknown_status" />);
      
      expect(screen.getByText('unknown_status')).toBeTruthy();
      const badge = container.querySelector('.bg-gray-100');
      expect(badge).toBeTruthy();
    });
  });
});
