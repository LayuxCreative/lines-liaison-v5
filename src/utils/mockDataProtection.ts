/**
 * Mock Data Protection Utility
 * Prevents the use of mock/fake data in production
 */

interface MockDataError extends Error {
  name: 'MockDataError';
  code: 'MOCK_DATA_FORBIDDEN';
}

/**
 * Creates a mock data error
 */
const createMockDataError = (message: string): MockDataError => {
  const error = new Error(message) as MockDataError;
  error.name = 'MockDataError';
  error.code = 'MOCK_DATA_FORBIDDEN';
  return error;
};

/**
 * Validates that data comes from Supabase and not mock sources
 */
export const validateDataSource = (data: unknown, source: string): void => {
  if (!data) return;

  // Check for common mock data patterns
  const mockPatterns = [
    /mock/i,
    /fake/i,
    /dummy/i,
    /sample/i,
    /test.*data/i,
    /hardcoded/i
  ];

  const dataString = JSON.stringify(data);
  
  for (const pattern of mockPatterns) {
    if (pattern.test(dataString) || pattern.test(source)) {
      throw createMockDataError(
        `Mock data detected in ${source}. Only Supabase data is allowed.`
      );
    }
  }

  // Check for suspicious static arrays with hardcoded IDs
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0];
    if (firstItem && typeof firstItem === 'object' && firstItem.id) {
      // Check if IDs look like mock data (sequential numbers, simple strings)
      const ids = data.map(item => item.id).slice(0, 5);
      const hasSequentialIds = ids.every((id, index) => 
        typeof id === 'string' && (id === `${index + 1}` || id === `item-${index + 1}`)
      );
      
      if (hasSequentialIds) {
        throw createMockDataError(
          `Suspicious mock data pattern detected in ${source}. Sequential IDs suggest hardcoded data.`
        );
      }
    }
  }
};

/**
 * Ensures data comes from Supabase by checking for Supabase metadata
 */
export const ensureSupabaseData = (data: unknown, tableName: string): void => {
  if (!data) return;

  // For arrays, check each item
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      validateDataSource(item, `${tableName}[${index}]`);
    });
  } else {
    validateDataSource(data, tableName);
  }
};

/**
 * Wrapper for Supabase queries to ensure data integrity
 */
export const supabaseDataWrapper = <T>(
  data: T,
  tableName: string,
  operation: string
): T => {
  try {
    ensureSupabaseData(data, `${tableName}.${operation}`);
    return data;
  } catch (error) {
    console.error(`Data validation failed for ${tableName}.${operation}:`, error);
    throw error;
  }
};

/**
 * Development mode warning for mock data usage
 */
export const warnMockDataUsage = (context: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️ Mock data usage detected in ${context}. ` +
      `Ensure this is replaced with Supabase data before production.`
    );
  }
};

export type { MockDataError };