// Media Components - Image, video, and file handling
import React from 'react';

// Image Component Types
export interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
}

// Video Component Types
export interface VideoProps {
  src: string;
  poster?: string;
  width?: number;
  height?: number;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

// Audio Component Types
export interface AudioProps {
  src: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

// File Preview Types
export interface FilePreviewProps {
  file: File | FileInfo;
  showDetails?: boolean;
  showActions?: boolean;
  onDownload?: () => void;
  onDelete?: () => void;
  className?: string;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  url: string;
  lastModified?: number;
}

// Gallery Types
export interface GalleryProps {
  items: GalleryItem[];
  columns?: number;
  gap?: 'sm' | 'md' | 'lg';
  showThumbnails?: boolean;
  onItemClick?: (item: GalleryItem, index: number) => void;
  className?: string;
}

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  thumbnail?: string;
  alt?: string;
  title?: string;
  description?: string;
}

// Media Player Types
export interface MediaPlayerProps {
  src: string;
  type: 'video' | 'audio';
  poster?: string;
  title?: string;
  controls?: MediaControls;
  className?: string;
}

export interface MediaControls {
  play?: boolean;
  pause?: boolean;
  volume?: boolean;
  progress?: boolean;
  fullscreen?: boolean;
  download?: boolean;
}

// Thumbnail Types
export interface ThumbnailProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'square' | 'circle' | 'rounded';
  className?: string;
  onClick?: () => void;
}

// Media utilities
export const getImageClasses = (className?: string) => {
  return `max-w-full h-auto ${className || ''}`;
};

export const getVideoClasses = (className?: string) => {
  return `w-full h-auto ${className || ''}`;
};

export const getAudioClasses = (className?: string) => {
  return `w-full ${className || ''}`;
};

export const getThumbnailClasses = (size: string, shape: string) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const shapeClasses = {
    square: 'rounded-none',
    circle: 'rounded-full',
    rounded: 'rounded-lg'
  };

  return `${sizeClasses[size as keyof typeof sizeClasses]} ${shapeClasses[shape as keyof typeof shapeClasses]} object-cover`;
};

export const getGalleryClasses = (columns: number, gap: string) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return `grid ${columnClasses[columns as keyof typeof columnClasses]} ${gapClasses[gap as keyof typeof gapClasses]}`;
};

// File type detection
export const getFileType = (filename: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'];

  if (extension) {
    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    if (audioExtensions.includes(extension)) return 'audio';
    if (documentExtensions.includes(extension)) return 'document';
  }

  return 'other';
};

export const getFileIcon = (fileType: string): string => {
  const icons = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    document: '📄',
    other: '📁'
  };

  return icons[fileType as keyof typeof icons] || icons.other;
};

// Media format utilities
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Image optimization
export const generateSrcSet = (src: string, sizes: number[]): string => {
  return sizes.map(size => `${src}?w=${size} ${size}w`).join(', ');
};

export const generateSizes = (breakpoints: Record<string, number>): string => {
  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => `(max-width: ${breakpoint}) ${size}px`)
    .join(', ');
};

// Media constants
export const MEDIA_CONSTANTS = {
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_VIDEO_FORMATS: ['video/mp4', 'video/webm', 'video/ogg'],
  SUPPORTED_AUDIO_FORMATS: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'],
  MAX_FILE_SIZE: {
    IMAGE: 10 * 1024 * 1024, // 10MB
    VIDEO: 100 * 1024 * 1024, // 100MB
    AUDIO: 50 * 1024 * 1024, // 50MB
    DOCUMENT: 25 * 1024 * 1024 // 25MB
  },
  THUMBNAIL_SIZES: [150, 300, 600, 1200],
  DEFAULT_QUALITY: 80
};