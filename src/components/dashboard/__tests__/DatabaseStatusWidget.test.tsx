import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DatabaseStatusWidget from '../../common/DatabaseStatusWidget';

// Mock the Supabase client
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}));

describe('DatabaseStatusWidget', () => {
  it('renders the widget title', () => {
    render(<DatabaseStatusWidget />);
    
    expect(screen.getByText('Database Status')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<DatabaseStatusWidget />);
    
    expect(screen.getByText('Checking connection...')).toBeInTheDocument();
  });

  it('displays connection status', async () => {
    render(<DatabaseStatusWidget />);
    
    // Wait for the component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should show either connected or error state
    const statusElement = screen.getByTestId('connection-status') || 
                         screen.getByText(/connected/i) || 
                         screen.getByText(/error/i);
    
    expect(statusElement).toBeInTheDocument();
  });
});