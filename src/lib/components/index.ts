// Components Library - Organized component exports
export * from './ui';
export * from './layout';
export * from './forms';
export type { 
  ImageProps,
  VideoProps,
  AudioProps,
  FilePreviewProps,
  FileInfo,
  GalleryProps,
  GalleryItem,
  MediaPlayerProps,
  MediaControls,
  ThumbnailProps
} from './media';

export {
  getImageClasses,
  getVideoClasses,
  getAudioClasses,
  getThumbnailClasses,
  getGalleryClasses,
  getFileType,
  getFileIcon,
  formatDuration,
  generateSrcSet,
  generateSizes,
  MEDIA_CONSTANTS
} from './media';

// Component categories
export type ComponentCategory = 'ui' | 'layout' | 'forms' | 'media';

// Component registry for dynamic imports
export const COMPONENT_REGISTRY = {
  ui: {
    Button: () => import('./ui'),
    Input: () => import('./ui'),
    Modal: () => import('./ui'),
    Card: () => import('./ui'),
    Badge: () => import('./ui')
  },
  layout: {
    Header: () => import('./layout'),
    Sidebar: () => import('./layout'),
    Footer: () => import('./layout'),
    Layout: () => import('./layout'),
    PageContainer: () => import('./layout'),
    GridLayout: () => import('./layout')
  },
  forms: {
    Form: () => import('./forms'),
    Field: () => import('./forms'),
    Textarea: () => import('./forms'),
    Select: () => import('./forms'),
    Checkbox: () => import('./forms'),
    Radio: () => import('./forms'),
    FileUpload: () => import('./forms'),
    FormGroup: () => import('./forms')
  },
  media: {
    Image: () => import('./media'),
    Video: () => import('./media'),
    Audio: () => import('./media'),
    FilePreview: () => import('./media'),
    Gallery: () => import('./media'),
    MediaPlayer: () => import('./media'),
    Thumbnail: () => import('./media')
  }
};

// Component utilities
export const getComponentsByCategory = (category: ComponentCategory) => {
  return COMPONENT_REGISTRY[category];
};

export const getAllComponents = () => {
  return Object.values(COMPONENT_REGISTRY).reduce((acc, category) => {
    return { ...acc, ...category };
  }, {});
};

// Component loading utilities
export const loadComponent = async (category: ComponentCategory, name: string) => {
  const categoryComponents = COMPONENT_REGISTRY[category];
  if (categoryComponents && name in categoryComponents) {
    const componentLoader = categoryComponents[name as keyof typeof categoryComponents];
    return await componentLoader();
  }
  throw new Error(`Component ${name} not found in category ${category}`);
};

// Component metadata
export interface ComponentMetadata {
  name: string;
  category: ComponentCategory;
  description: string;
  props: Record<string, unknown>;
  examples?: string[];
}

export const COMPONENT_METADATA: Record<string, ComponentMetadata> = {
  Button: {
    name: 'Button',
    category: 'ui',
    description: 'Interactive button component with multiple variants',
    props: {
      variant: 'primary | secondary | danger | ghost',
      size: 'sm | md | lg',
      disabled: 'boolean',
      loading: 'boolean'
    }
  },
  Input: {
    name: 'Input',
    category: 'ui',
    description: 'Text input field with validation support',
    props: {
      type: 'text | email | password | number',
      placeholder: 'string',
      value: 'string',
      error: 'string'
    }
  },
  Modal: {
    name: 'Modal',
    category: 'ui',
    description: 'Overlay dialog component',
    props: {
      isOpen: 'boolean',
      onClose: 'function',
      title: 'string',
      size: 'sm | md | lg | xl'
    }
  },
  Header: {
    name: 'Header',
    category: 'layout',
    description: 'Page header with navigation and actions',
    props: {
      title: 'string',
      showSearch: 'boolean',
      showNotifications: 'boolean',
      showProfile: 'boolean'
    }
  },
  Form: {
    name: 'Form',
    category: 'forms',
    description: 'Form container with validation',
    props: {
      onSubmit: 'function',
      validation: 'ValidationSchema'
    }
  },
  Image: {
    name: 'Image',
    category: 'media',
    description: 'Optimized image component with lazy loading',
    props: {
      src: 'string',
      alt: 'string',
      loading: 'lazy | eager',
      fallback: 'string'
    }
  }
};