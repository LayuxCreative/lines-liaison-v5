/**
 * Safe storage utilities to prevent SSR/CSR hydration mismatches
 */

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get localStorage item "${key}":`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set localStorage item "${key}":`, error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove localStorage item "${key}":`, error);
      return false;
    }
  },

  clear: (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  },

  getAllKeys: (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.warn('Failed to get localStorage keys:', error);
      return [];
    }
  }
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get sessionStorage item "${key}":`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set sessionStorage item "${key}":`, error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove sessionStorage item "${key}":`, error);
      return false;
    }
  }
};

/**
 * Hook to safely use localStorage with SSR support
 */
export const useSafeLocalStorage = <T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] => {
  const [value, setValue] = React.useState<T>(defaultValue);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const stored = safeLocalStorage.getItem(key);
    if (stored) {
      try {
        setValue(JSON.parse(stored));
      } catch {
        setValue(defaultValue);
      }
    }
  }, [key, defaultValue]);

  const setStoredValue = React.useCallback((newValue: T) => {
    setValue(newValue);
    if (isClient) {
      safeLocalStorage.setItem(key, JSON.stringify(newValue));
    }
  }, [key, isClient]);

  return [value, setStoredValue];
};

// Import React for the hook
import React from 'react';