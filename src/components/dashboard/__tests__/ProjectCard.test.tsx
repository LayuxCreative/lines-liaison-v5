import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProjectCard from '../ProjectCard';
import { Project } from '../../../types';

const mockProject: Project = {
  id: '1',
  name: 'Test Project',
  description: 'A test project description',
  projectCode: 'TP001',
  status: 'active',
  priority: 'high',
  clientId: 'client-1',
  managerId: 'manager-1',
  teamMembers: ['user-1', 'user-2'],
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  progress: 75,
  budget: 100000,
  spent: 75000,
  category: 'BIM',
  files: [
    {
      id: 'file-1',
      name: 'test.dwg',
      type: 'dwg',
      size: 1024,
      url: '/files/test.dwg',
      projectId: '1',
      uploadedBy: 'user-1',
      uploadedAt: new Date('2024-01-01'),
      lastModified: new Date('2024-01-01'),
      lastModifiedBy: 'user-1',
      category: 'drawing',
      isApproved: true,
      version: 1,
      activity: [],
      versions: [],
      viewCount: 0,
      downloadCount: 0
    }
  ],
  createdAt: new Date('2024-01-01')
};

const minimalProject: Project = {
  id: '2',
  name: 'Minimal Project',
  description: 'Minimal project for testing',
  projectCode: 'MP001',
  status: 'planning',
  priority: 'low',
  clientId: 'client-2',
  managerId: 'manager-2',
  teamMembers: [],
  startDate: new Date('2024-02-01'),
  endDate: new Date('2024-06-30'),
  progress: 0,
  category: 'Civil',
  files: [],
  createdAt: new Date('2024-02-01')
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Hoist react-router-dom navigate mock to avoid scope issues across tests
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ProjectCard', () => {
  it('renders project information correctly', () => {
    renderWithRouter(<ProjectCard project={mockProject} />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project description')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // team members count
    expect(screen.getByText('1')).toBeInTheDocument(); // files count
    expect(screen.getByText('$100k')).toBeInTheDocument(); // budget
  });

  it('displays correct status badge', () => {
    renderWithRouter(<ProjectCard project={mockProject} />);
    
    const statusBadge = screen.getByText('ACTIVE');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('shows progress bar with correct width', () => {
    renderWithRouter(<ProjectCard project={mockProject} />);
    
    const progressBar = document.querySelector('[style*="width: 75%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles navigation on click', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    const title = screen.getByText('Test Project');
    fireEvent.click(title);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/projects/1');
  });

  it('handles minimal project data correctly', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={minimalProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('Minimal Project')).toBeInTheDocument();
    expect(screen.getByText('Civil')).toBeInTheDocument();
    expect(screen.getByText('Minimal project for testing')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    const planningBadge = screen.getByText('PLANNING');
    expect(planningBadge).toBeInTheDocument();
  });

  it('handles missing optional data gracefully', () => {
    const minimalProject: Project = {
      ...mockProject,
      teamMembers: undefined,
      files: undefined,
      budget: undefined
    };

    renderWithRouter(<ProjectCard project={minimalProject} />);
    
    // Team members count may appear multiple times; ensure at least one '0' exists
    expect(screen.getAllByText('0').length).toBeGreaterThan(0); // team members count
    expect(screen.getByText('N/A')).toBeInTheDocument(); // budget
  });
});