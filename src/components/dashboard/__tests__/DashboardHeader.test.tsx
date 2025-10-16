import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock all the dependencies
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', name: 'Test User' },
    logout: vi.fn()
  })
}));

vi.mock('../../../hooks/useNotifications', () => ({
  useNotifications: () => ({ unreadCount: 3 })
}));

vi.mock('../../../contexts/DataContext', () => ({
  useData: () => ({ projects: [], users: [], files: [], loading: false, error: null })
}));

// Mock all child components
vi.mock('../../common/NotificationDropdown', () => ({ default: () => <div>NotificationDropdown</div> }));
vi.mock('../../common/GlobalSearch', () => ({ default: () => <div>GlobalSearch</div> }));
vi.mock('../../common/UserProfileDropdown', () => ({ default: () => <div>UserProfileDropdown</div> }));
vi.mock('../../common/UserStatusIndicator', () => ({ default: () => <div>UserStatusIndicator</div> }));
vi.mock('../MegaMenuPopup', () => ({ default: () => <div>MegaMenuPopup</div> }));

// Import after mocks
import DashboardHeader from '../DashboardHeader';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('DashboardHeader', () => {
  it('renders the header component', () => {
    renderWithRouter(<DashboardHeader />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('displays the Lines Liaison logo', () => {
    renderWithRouter(<DashboardHeader />);
    
    expect(screen.getByText('LiNES AND LiAiSON')).toBeInTheDocument();
  });

  it('shows user name when logged in', () => {
    renderWithRouter(<DashboardHeader />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});