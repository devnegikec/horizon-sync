/**
 * Unit tests for SearchErrorState component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SearchErrorState } from '../../../../../app/features/search/../../../../app/features/search/components/SearchErrorState';

describe('SearchErrorState', () => {
  it('should display network error message', () => {
    const error = new Error('Unable to connect. Please check your connection and try again.');
    const onRetry = jest.fn();
    
    render(<SearchErrorState error={error} onRetry={onRetry} />);

    expect(screen.getByText('Search Error')).toBeDefined();
    expect(screen.getByText('Unable to connect. Please check your connection and try again.')).toBeDefined();
  });

  it('should display auth error message', () => {
    const error = new Error('Session expired. Please log in again.');
    const onRetry = jest.fn();
    
    render(<SearchErrorState error={error} onRetry={onRetry} />);

    expect(screen.getByText('Session expired. Please log in again.')).toBeDefined();
  });

  it('should display server error message', () => {
    const error = new Error('Search service unavailable. Please try again later.');
    const onRetry = jest.fn();
    
    render(<SearchErrorState error={error} onRetry={onRetry} />);

    expect(screen.getByText('Search service unavailable. Please try again later.')).toBeDefined();
  });

  it('should display default error message for unknown errors', () => {
    const error = new Error('Some unknown error');
    const onRetry = jest.fn();
    
    render(<SearchErrorState error={error} onRetry={onRetry} />);

    expect(screen.getByText('An error occurred while searching. Please try again.')).toBeDefined();
  });

  it('should call onRetry when retry button is clicked', () => {
    const error = new Error('Network error');
    const onRetry = jest.fn();
    
    render(<SearchErrorState error={error} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render error icon', () => {
    const error = new Error('Test error');
    const onRetry = jest.fn();
    const { container } = render(<SearchErrorState error={error} onRetry={onRetry} />);

    // Check for the AlertCircle icon (lucide-react renders as SVG)
    const icon = container.querySelector('svg');
    expect(icon).toBeDefined();
    expect(icon).not.toBeNull();
  });

  it('should render retry button with icon', () => {
    const error = new Error('Test error');
    const onRetry = jest.fn();
    
    render(<SearchErrorState error={error} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeDefined();
    expect(retryButton.textContent).toContain('Retry');
  });
});
