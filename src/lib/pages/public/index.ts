// Public Pages - Organized public page types and utilities

// Public page types
export interface HomePageProps {
  features: Feature[];
  testimonials: Testimonial[];
  stats: SiteStats;
  onGetStarted: () => void;
  onLearnMore: () => void;
}

export interface AboutPageProps {
  team: TeamMember[];
  company: CompanyInfo;
  timeline: TimelineEvent[];
  values: CompanyValue[];
}

export interface ServicesPageProps {
  services: Service[];
  packages: ServicePackage[];
  onContactUs: (service: string) => void;
  onRequestQuote: (serviceId: string) => void;
}

export interface ContactPageProps {
  onSubmitContact: (data: ContactFormData) => Promise<void>;
  loading?: boolean;
  success?: boolean;
  error?: string;
  contactInfo: ContactInfo;
}

export interface PricingPageProps {
  plans: PricingPlan[];
  features: PlanFeature[];
  onSelectPlan: (planId: string) => void;
  onContactSales: () => void;
}

export interface BlogPageProps {
  posts: BlogPost[];
  categories: BlogCategory[];
  onReadMore: (postId: string) => void;
  pagination: PaginationInfo;
}

export interface BlogPostPageProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
  onShare: (platform: string) => void;
  onSubscribe: (email: string) => Promise<void>;
}

// Public data types
export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: FeatureCategory;
  highlighted?: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
}

export interface SiteStats {
  users: number;
  projects: number;
  countries: number;
  satisfaction: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  social: SocialLinks;
}

export interface CompanyInfo {
  name: string;
  founded: string;
  mission: string;
  vision: string;
  description: string;
  headquarters: string;
  employees: string;
}

export interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  milestone: boolean;
}

export interface CompanyValue {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  features: string[];
  icon: string;
  category: ServiceCategory;
  popular?: boolean;
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
  serviceIds: string[];
  recommended?: boolean;
}

export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  message: string;
  service?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: Address;
  hours: BusinessHours;
  social: SocialLinks;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface BusinessHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  facebook?: string;
  instagram?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing: 'monthly' | 'yearly';
  features: string[];
  limitations?: string[];
  popular?: boolean;
  enterprise?: boolean;
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  plans: string[]; // Plan IDs that include this feature
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: BlogAuthor;
  category: BlogCategory;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  featured?: boolean;
  readTime: number;
  coverImage?: string;
}

export interface BlogAuthor {
  id: string;
  name: string;
  bio: string;
  avatar?: string;
  social: SocialLinks;
}

export interface BlogCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  color: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Enums
export type FeatureCategory = 'core' | 'advanced' | 'integration' | 'security';
export type ServiceCategory = 'development' | 'design' | 'consulting' | 'support';

// Public page utilities
export const getPublicPageClasses = (page: string) => {
  const baseClasses = 'min-h-screen bg-white dark:bg-gray-900';
  
  const pageClasses: Record<string, string> = {
    home: '',
    about: 'py-16',
    services: 'py-16',
    contact: 'py-16',
    pricing: 'py-16',
    blog: 'py-16',
    'blog-post': 'py-16'
  };
  
  return `${baseClasses} ${pageClasses[page] || 'py-16'}`;
};

export const getHeroSectionClasses = () => {
  return 'relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white py-20 lg:py-32 overflow-hidden';
};

export const getHeroContentClasses = () => {
  return 'relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center';
};

export const getHeroTitleClasses = () => {
  return 'text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent';
};

export const getHeroSubtitleClasses = () => {
  return 'text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto';
};

export const getSectionClasses = (variant: 'default' | 'gray' | 'dark' = 'default') => {
  const baseClasses = 'py-16 lg:py-24';
  
  const variants = {
    default: 'bg-white dark:bg-gray-900',
    gray: 'bg-gray-50 dark:bg-gray-800',
    dark: 'bg-gray-900 text-white'
  };
  
  return `${baseClasses} ${variants[variant]}`;
};

export const getContainerClasses = () => {
  return 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
};

export const getSectionTitleClasses = () => {
  return 'text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white';
};

export const getSectionSubtitleClasses = () => {
  return 'text-lg text-gray-600 dark:text-gray-300 text-center mb-12 max-w-3xl mx-auto';
};

export const getFeatureCardClasses = () => {
  return 'bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 dark:border-gray-700';
};

export const getTestimonialCardClasses = () => {
  return 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700';
};

export const getServiceCardClasses = (popular: boolean = false) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border';
  const borderClasses = popular 
    ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' 
    : 'border-gray-100 dark:border-gray-700';
  
  return `${baseClasses} ${borderClasses}`;
};

export const getPricingCardClasses = (popular: boolean = false) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border relative';
  const borderClasses = popular 
    ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50 transform scale-105' 
    : 'border-gray-100 dark:border-gray-700';
  
  return `${baseClasses} ${borderClasses}`;
};

export const getBlogCardClasses = () => {
  return 'bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700';
};

// Utility functions
export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(price);
};

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

export const calculateReadTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

export const generateExcerpt = (content: string, maxLength: number = 150): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
};

export const formatStats = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
};

export const getCategoryColor = (category: FeatureCategory | ServiceCategory): string => {
  const colors: Record<string, string> = {
    // Feature categories
    core: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    advanced: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    integration: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    security: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    
    // Service categories
    development: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    design: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    consulting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    support: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  };
  
  return colors[category] || 'bg-gray-100 text-gray-800';
};

// Public page constants
export const PUBLIC_CONSTANTS = {
  HERO_ANIMATION_DURATION: 1000,
  SCROLL_OFFSET: 80,
  ITEMS_PER_PAGE: {
    BLOG: 9,
    SERVICES: 6,
    TESTIMONIALS: 3
  },
  CONTACT_FORM_MAX_LENGTH: {
    NAME: 100,
    EMAIL: 255,
    COMPANY: 100,
    PHONE: 20,
    SUBJECT: 200,
    MESSAGE: 1000
  },
  SOCIAL_PLATFORMS: ['linkedin', 'twitter', 'facebook', 'email'] as const,
  BLOG_CATEGORIES: ['Technology', 'Business', 'Design', 'Development'] as const
};

// SEO metadata
export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
}

export const PUBLIC_PAGE_SEO: Record<string, SEOMetadata> = {
  home: {
    title: 'Lines Liaison - Project Management & Communication Platform',
    description: 'Streamline your projects with our comprehensive management and communication platform. Collaborate effectively, track progress, and deliver results.',
    keywords: ['project management', 'team collaboration', 'communication platform', 'productivity'],
    ogTitle: 'Lines Liaison - Transform Your Project Management',
    ogDescription: 'The all-in-one platform for project management and team collaboration'
  },
  about: {
    title: 'About Us - Lines Liaison',
    description: 'Learn about our mission, team, and commitment to revolutionizing project management and team collaboration.',
    keywords: ['about', 'company', 'team', 'mission', 'values']
  },
  services: {
    title: 'Our Services - Lines Liaison',
    description: 'Discover our comprehensive range of project management and collaboration services designed to boost your team\'s productivity.',
    keywords: ['services', 'project management', 'consulting', 'support']
  },
  contact: {
    title: 'Contact Us - Lines Liaison',
    description: 'Get in touch with our team. We\'re here to help you succeed with your projects and answer any questions.',
    keywords: ['contact', 'support', 'help', 'get in touch']
  },
  pricing: {
    title: 'Pricing Plans - Lines Liaison',
    description: 'Choose the perfect plan for your team. Flexible pricing options for businesses of all sizes.',
    keywords: ['pricing', 'plans', 'subscription', 'cost']
  },
  blog: {
    title: 'Blog - Lines Liaison',
    description: 'Stay updated with the latest insights, tips, and trends in project management and team collaboration.',
    keywords: ['blog', 'articles', 'insights', 'tips', 'project management']
  }
};