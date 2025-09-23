// Layout Components - Page structure and navigation
import React from 'react';

// Header Component Types
export interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  onSearchChange?: (query: string) => void;
  className?: string;
}

// Sidebar Component Types
export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  navigation: NavigationItem[];
  className?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  onClick?: () => void;
  children?: NavigationItem[];
  active?: boolean;
}

// Footer Component Types
export interface FooterProps {
  showLinks?: boolean;
  showSocial?: boolean;
  className?: string;
}

// Layout Container Types
export interface LayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

// Page Container Types
export interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

// Grid Layout Types
export interface GridLayoutProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Layout utilities
export const getHeaderClasses = (className?: string) => {
  return `bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between ${className || ''}`;
};

export const getSidebarClasses = (isOpen: boolean, className?: string) => {
  return `fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
    isOpen ? 'translate-x-0' : '-translate-x-full'
  } lg:translate-x-0 lg:static lg:inset-0 ${className || ''}`;
};

export const getFooterClasses = (className?: string) => {
  return `bg-gray-50 border-t border-gray-200 px-4 py-6 ${className || ''}`;
};

export const getLayoutClasses = (className?: string) => {
  return `min-h-screen bg-gray-50 ${className || ''}`;
};

export const getPageContainerClasses = (className?: string) => {
  return `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className || ''}`;
};

export const getGridClasses = (columns: number, gap: string) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    12: 'grid-cols-12'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return `grid ${columnClasses[columns as keyof typeof columnClasses]} ${gapClasses[gap as keyof typeof gapClasses]}`;
};

// Navigation utilities
export const isActiveNavItem = (item: NavigationItem, currentPath: string): boolean => {
  if (item.href === currentPath) return true;
  if (item.children) {
    return item.children.some(child => isActiveNavItem(child, currentPath));
  }
  return false;
};

export const getNavItemClasses = (isActive: boolean) => {
  return `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
    isActive
      ? 'bg-blue-100 text-blue-700'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`;
};

// Responsive utilities
export const getResponsiveClasses = (mobile: string, tablet?: string, desktop?: string) => {
  let classes = mobile;
  if (tablet) classes += ` md:${tablet}`;
  if (desktop) classes += ` lg:${desktop}`;
  return classes;
};

// Layout constants
export const LAYOUT_CONSTANTS = {
  HEADER_HEIGHT: '64px',
  SIDEBAR_WIDTH: '256px',
  FOOTER_HEIGHT: '80px',
  CONTAINER_MAX_WIDTH: '1280px',
  BREAKPOINTS: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};