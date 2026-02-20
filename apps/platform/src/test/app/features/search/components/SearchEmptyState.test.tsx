/**
 * Unit tests for SearchEmptyState component
 */

import { render, screen } from '@testing-library/react';
import { SearchEmptyState } from '../../../../../app/features/search/../../../../app/features/search/components/SearchEmptyState';

describe('SearchEmptyState', () => {
  it('should display message with query', () => {
    const query = 'test query';
    render(<SearchEmptyState query={query} />);

    expect(screen.getByText('No results found')).toBeDefined();
    expect(screen.getByText((content, element) => {
      return element?.textContent === `No results found for "${query}". Try different keywords or check spelling.`;
    })).toBeDefined();
  });

  it('should display suggestions when provided', () => {
    const query = 'test query';
    const suggestions = ['Try searching for "items"', 'Check your spelling', 'Use fewer keywords'];
    
    render(<SearchEmptyState query={query} suggestions={suggestions} />);

    expect(screen.getByText('Suggestions:')).toBeDefined();
    suggestions.forEach(suggestion => {
      expect(screen.getByText(suggestion)).toBeDefined();
    });
  });

  it('should not display suggestions section when suggestions are empty', () => {
    const query = 'test query';
    
    render(<SearchEmptyState query={query} suggestions={[]} />);

    expect(screen.queryByText('Suggestions:')).toBeNull();
  });

  it('should not display suggestions section when suggestions are undefined', () => {
    const query = 'test query';
    
    render(<SearchEmptyState query={query} />);

    expect(screen.queryByText('Suggestions:')).toBeNull();
  });

  it('should render search icon', () => {
    const query = 'test query';
    const { container } = render(<SearchEmptyState query={query} />);

    // Check for the SearchX icon (lucide-react renders as SVG)
    const icon = container.querySelector('svg');
    expect(icon).toBeDefined();
    expect(icon).not.toBeNull();
  });
});
