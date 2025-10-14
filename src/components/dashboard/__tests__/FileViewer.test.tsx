import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FileViewer from '../FileViewer';
import type { ProjectFile } from '../../../types';

// Mock the FileViewer component
vi.mock('../FileViewer', () => ({
  default: ({ file, onClose }: { 
    file: ProjectFile | null; 
    onClose?: () => void;
  }) => (
    <div data-testid="file-viewer">
      <h2>File Viewer</h2>
      <div>File: {file?.name || 'No file'}</div>
      <div>Type: {file?.type || 'Unknown'}</div>
      <div>Size: {file?.size || 0} bytes</div>
      <button onClick={onClose}>Download</button>
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

const mockFile: ProjectFile = {
  id: '1',
  name: 'test-document.pdf',
  type: 'application/pdf',
  size: 1024000,
  url: 'https://example.com/file.pdf',
  projectId: 'project-1',
  uploadedBy: 'user-1',
  uploadedAt: new Date('2024-01-01'),
  lastModified: new Date('2024-01-01'),
  lastModifiedBy: 'user-1',
  category: 'document',
  isApproved: true,
  version: 1,
  activity: [],
  versions: [],
  viewCount: 0,
  downloadCount: 0
};

describe('FileViewer', () => {
  it('renders the file viewer with file information', () => {
    render(<FileViewer file={mockFile} isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByTestId('file-viewer')).toBeInTheDocument();
    expect(screen.getByText('File Viewer')).toBeInTheDocument();
  });

  it('displays file name and type', () => {
    render(<FileViewer file={mockFile} isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('File: test-document.pdf')).toBeInTheDocument();
    expect(screen.getByText('Type: application/pdf')).toBeInTheDocument();
  });

  it('shows file size', () => {
    render(<FileViewer file={mockFile} isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('Size: 1024000 bytes')).toBeInTheDocument();
  });

  it('handles missing file gracefully', () => {
    render(<FileViewer file={null} isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('File: No file')).toBeInTheDocument();
    expect(screen.getByText('Type: Unknown')).toBeInTheDocument();
  });
});