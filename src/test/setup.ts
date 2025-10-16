import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.mock('../lib/config', () => ({
  APP_CONFIG: {
    supabase: {
      url: 'http://localhost:54321',
      anonKey: 'test-anon-key'
    },
    app: {
      name: 'Lines Liaison Test',
      version: '1.0.0'
    }
  }
}));

// Mock Supabase library exports used by the app
const supabaseMock = {
  auth: {
    signIn: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
    refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
  },
  from: vi.fn(() => ({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  })),
  storage: {
    listBuckets: vi.fn().mockResolvedValue({ data: [], error: null })
  },
  channel: vi.fn(() => ({ unsubscribe: vi.fn() }))
}

// Mock using multiple specifiers to match imports in components
vi.mock('../lib/supabase', () => ({
  default: supabaseMock,
  supabase: supabaseMock,
  auth: {
    refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
  },
  getSupabaseProjectRef: () => 'local-test-ref',
  checkSupabaseConnection: vi.fn().mockResolvedValue({ connected: true, error: null })
}));

vi.mock('../../lib/supabase', () => ({
  default: supabaseMock,
  supabase: supabaseMock,
  auth: {
    refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
  },
  getSupabaseProjectRef: () => 'local-test-ref',
  checkSupabaseConnection: vi.fn().mockResolvedValue({ connected: true, error: null })
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Router mocks to avoid requiring a Router wrapper in unit tests
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'test' }),
    useParams: () => ({}),
    useSearchParams: () => {
      const params = new URLSearchParams();
      const setParams = vi.fn();
      return [params, setParams] as unknown as ReturnType<typeof actual.useSearchParams>;
    }
  };
});

// Notifications hook mocks (multiple import path variants seen in repo)
vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    addNotification: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    loadNotifications: vi.fn().mockResolvedValue(undefined),
  })
}));

vi.mock('./NotificationManager', () => ({
  useNotifications: () => ({
    state: { notifications: [], unreadCount: 0, isLoading: false, error: null, settings: {
      userId: 'test-user', emailNotifications: true, pushNotifications: false, inAppNotifications: true,
      categories: { urgent: true, work: true, administrative: true, social: true, financial: true, security: true, system: true },
      quietHours: { enabled: false, startTime: '22:00', endTime: '07:00' },
      frequency: 'immediate', updatedAt: new Date()
    }, toastNotifications: [] },
    dispatch: vi.fn(),
    addNotification: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    updateSettings: vi.fn(),
    showToast: vi.fn(),
    removeToast: vi.fn(),
    getFilteredNotifications: vi.fn(() => [])
  }),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Auth context mock for tests importing useAuth without wrapping provider
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com', full_name: 'Test User', role: 'team_member', status: 'active' },
    isLoading: false,
    login: vi.fn().mockResolvedValue({ success: true }),
    register: vi.fn().mockResolvedValue({ success: true, user: null }),
    logout: vi.fn(),
    updateUserStatus: vi.fn(),
    updateUserProfile: vi.fn(),
    refreshUserProfile: vi.fn()
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Supabase service mock to prevent real network calls in tests (type-safe)
type MockServiceResponse<T> = { success: true; data: T; error: null };
const mockServiceResponse = <T = undefined>(data?: T): MockServiceResponse<T | undefined> => ({
  success: true,
  data,
  error: null,
});

// JSDOM does not implement scrollTo; mock to avoid console warnings in tests
// and ensure components calling window.scrollTo do not error out.
// @ts-expect-error jsdom environment lacks scrollTo definition by default
window.scrollTo = vi.fn();

vi.mock('../services/supabaseService', () => ({
  supabaseService: {
    // Auth
    login: vi.fn().mockResolvedValue(mockServiceResponse({ user: { id: 'test-user' } })),
    register: vi.fn().mockResolvedValue(mockServiceResponse({ user: { id: 'test-user' } })),
    logout: vi.fn().mockResolvedValue(mockServiceResponse()),
    refreshUserProfile: vi.fn().mockResolvedValue(mockServiceResponse({ id: 'test-user' })),
    updateUserProfile: vi.fn().mockResolvedValue(mockServiceResponse()),

    // Notifications
    getNotifications: vi.fn().mockResolvedValue(mockServiceResponse([])),
    subscribeToNotifications: vi.fn().mockResolvedValue({ id: 'sub-1' }),
    unsubscribe: vi.fn(),

    // Projects/Tasks/Messages/Files basic stubs
    getProjects: vi.fn().mockResolvedValue(mockServiceResponse([])),
    getProjectById: vi.fn().mockResolvedValue(mockServiceResponse(null)),
    getTasks: vi.fn().mockResolvedValue(mockServiceResponse([])),
    getMessagesByProjectId: vi.fn().mockResolvedValue(mockServiceResponse([])),
    getFilesByProjectId: vi.fn().mockResolvedValue(mockServiceResponse([])),
  }
}));

vi.mock('../../services/supabaseService', () => ({
  supabaseService: {
    login: vi.fn().mockResolvedValue(mockServiceResponse({ user: { id: 'test-user' } })),
    register: vi.fn().mockResolvedValue(mockServiceResponse({ user: { id: 'test-user' } })),
    logout: vi.fn().mockResolvedValue(mockServiceResponse()),
    refreshUserProfile: vi.fn().mockResolvedValue(mockServiceResponse({ id: 'test-user' })),
    updateUserProfile: vi.fn().mockResolvedValue(mockServiceResponse()),

    getNotifications: vi.fn().mockResolvedValue(mockServiceResponse([])),
    subscribeToNotifications: vi.fn().mockResolvedValue({ id: 'sub-1' }),
    unsubscribe: vi.fn(),

    getProjects: vi.fn().mockResolvedValue(mockServiceResponse([])),
    getProjectById: vi.fn().mockResolvedValue(mockServiceResponse(null)),
    getTasks: vi.fn().mockResolvedValue(mockServiceResponse([])),
    getMessagesByProjectId: vi.fn().mockResolvedValue(mockServiceResponse([])),
    getFilesByProjectId: vi.fn().mockResolvedValue(mockServiceResponse([])),
  }
}));