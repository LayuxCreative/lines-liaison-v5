import { v4 as uuidv4 } from 'uuid';

export interface LocalFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // Base64 encoded data
  createdAt: Date;
  projectId?: string;
}

export interface LocalFileUploadResult {
  success: boolean;
  file?: LocalFile;
  error?: string;
}

export interface LocalFileListResult {
  success: boolean;
  files?: LocalFile[];
  error?: string;
}

class LocalFileService {
  private readonly STORAGE_KEY = 'lines_liaison_local_files';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  /**
   * Get all files from local storage
   */
  private getStoredFiles(): LocalFile[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading local files:', error);
      return [];
    }
  }

  /**
   * Save files to local storage
   */
  private saveFiles(files: LocalFile[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
    } catch (error) {
      console.error('Error saving local files:', error);
      throw new Error('Failed to save files to local storage');
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { isValid: boolean; error?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`
      };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported'
      };
    }

    return { isValid: true };
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:type;base64, prefix
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload file to local storage
   */
  async uploadFile(file: File, projectId?: string): Promise<LocalFileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Convert to base64
      const base64Data = await this.fileToBase64(file);

      // Create file object
      const localFile: LocalFile = {
        id: uuidv4(),
        name: file.name,
        size: file.size,
        type: file.type,
        data: base64Data,
        createdAt: new Date(),
        projectId
      };

      // Get existing files and add new one
      const existingFiles = this.getStoredFiles();
      existingFiles.push(localFile);

      // Save to local storage
      this.saveFiles(existingFiles);

      return {
        success: true,
        file: localFile
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Get all files
   */
  async getFiles(projectId?: string): Promise<LocalFileListResult> {
    try {
      let files = this.getStoredFiles();
      
      if (projectId) {
        files = files.filter(file => file.projectId === projectId);
      }

      return {
        success: true,
        files
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get files'
      };
    }
  }

  /**
   * Get file by ID
   */
  async getFile(id: string): Promise<LocalFile | null> {
    try {
      const files = this.getStoredFiles();
      return files.find(file => file.id === id) || null;
    } catch (error) {
      console.error('Error getting file:', error);
      return null;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const files = this.getStoredFiles();
      const filteredFiles = files.filter(file => file.id !== id);
      
      if (files.length === filteredFiles.length) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      this.saveFiles(filteredFiles);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * Get file as blob for download
   */
  async getFileBlob(id: string): Promise<Blob | null> {
    try {
      const file = await this.getFile(id);
      if (!file) return null;

      // Convert base64 back to blob
      const byteCharacters = atob(file.data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: file.type });
    } catch (error) {
      console.error('Error creating blob:', error);
      return null;
    }
  }

  /**
   * Download file
   */
  async downloadFile(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const file = await this.getFile(id);
      if (!file) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      const blob = await this.getFileBlob(id);
      if (!blob) {
        return {
          success: false,
          error: 'Failed to create file blob'
        };
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): { totalFiles: number; totalSize: number; usedSpace: string } {
    try {
      const files = this.getStoredFiles();
      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      return {
        totalFiles,
        totalSize,
        usedSpace: this.formatFileSize(totalSize)
      };
    } catch {
      return {
        totalFiles: 0,
        totalSize: 0,
        usedSpace: '0 B'
      };
    }
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Clear all files
   */
  clearAllFiles(): { success: boolean; error?: string } {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Failed to clear files'
      };
    }
  }
}

export const localFileService = new LocalFileService();
export default localFileService;