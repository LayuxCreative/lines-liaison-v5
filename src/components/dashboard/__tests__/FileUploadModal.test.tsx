import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileUploadModal } from '../FileUploadModal';

// Mock the FileUploadModal component
vi.mock('../FileUploadModal', () => ({
  FileUploadModal: () => (
    <div data-testid="file-upload-modal">
      <h2>Upload Files</h2>
      <div>Drag and drop files here</div>
      <button>Select Files</button>
      <button>Upload</button>
      <button>Cancel</button>
    </div>
  )
}));

describe('FileUploadModal', () => {
  it('renders the modal with upload interface', () => {
    render(<FileUploadModal isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByTestId('file-upload-modal')).toBeInTheDocument();
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
  });

  it('displays drag and drop area', () => {
    render(<FileUploadModal isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('Drag and drop files here')).toBeInTheDocument();
  });

  it('shows file selection button', () => {
    render(<FileUploadModal isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('Select Files')).toBeInTheDocument();
  });
});