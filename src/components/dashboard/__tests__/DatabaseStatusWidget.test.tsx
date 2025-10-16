import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DatabaseStatusWidget from '../../common/DatabaseStatusWidget';

// Mock the Supabase client and helpers with the exact import specifier used by the component
vi.mock('../../lib/supabase', () => {
  const supabaseMock = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
    },
    storage: {
      listBuckets: vi.fn().mockResolvedValue({ data: [], error: null })
    },
    channel: vi.fn(() => ({ unsubscribe: vi.fn() })),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  };

  return {
    default: supabaseMock,
    supabase: supabaseMock,
    getSupabaseProjectRef: () => 'test-ref',
    pingSupabaseHealth: vi.fn().mockResolvedValue({ ok: true, status: 200 })
  };
});

describe('DatabaseStatusWidget', () => {
  it('renders the widget title', async () => {
    render(<DatabaseStatusWidget />);
    // افتح اللوحة الموسعة بالنقر على فقاعة الحالة
    const trigger = await screen.findByText(/Checking|Connected|Disconnected/i);
    fireEvent.click(trigger);

    // انتظر حتى تظهر اللوحة الموسعة لتجنّب تحذير act
    await screen.findByText('Supabase Status');
  });

  it('shows loading state initially', async () => {
    render(<DatabaseStatusWidget />);
    // تحقق من الحالة الأولية، ثم اسمح لتحديثات الحالة بالاكتمال إن وجدت
    expect(await screen.findByText(/Checking/i)).toBeInTheDocument();
  });

  it('displays connection status', async () => {
    render(<DatabaseStatusWidget />);

    // انتظر اكتمال فحص الاتصال ثم تحقق من الحالة
    await waitFor(async () => {
      const statusElement =
        screen.queryByTestId('connection-status') ||
        (await screen.findByText(/connected|disconnected/i));

      expect(statusElement).toBeTruthy();
    });
  });
});