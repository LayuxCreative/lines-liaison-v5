import { createClient } from 'redis';

type RedisClientType = ReturnType<typeof createClient>;

interface CacheConfig {
  host?: string;
  port?: number;
  password?: string;
  database?: number;
  ttl?: number; // Default TTL in seconds
}

interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  isRedisConnected: boolean;
  fallbackCacheSize: number;
  redisInfo?: string;
}

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private fallbackCache = new Map<string, CacheItem>();
  private config: CacheConfig;

  constructor(config: CacheConfig = {}) {
    // Use import.meta.env for Vite compatibility
    const env = typeof window !== 'undefined' ? import.meta.env : (process?.env || {});
    
    this.config = {
      host: config.host || env.REDIS_HOST || 'localhost',
      port: config.port || parseInt(env.REDIS_PORT || '6379'),
      password: config.password || env.REDIS_PASSWORD,
      database: config.database || parseInt(env.REDIS_DB || '0'),
      ttl: config.ttl || 3600 // 1 hour default
    };
  }

  /**
   * Initialize Redis connection (only in Node.js environment)
   */
  async initialize(): Promise<void> {
    // Skip Redis initialization in browser environment
    if (typeof window !== 'undefined') {
      console.log('Cache service: Using fallback cache in browser environment');
      return;
    }

    try {
      // Dynamic import Redis only in Node.js environment
      const { createClient } = await import('redis');
      
      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port
        },
        password: this.config.password,
        database: this.config.database
      });

      this.client.on('error', (err) => {
        console.warn('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('Failed to connect to Redis, using fallback cache:', error);
      this.isConnected = false;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const actualTtl = ttl || this.config.ttl!;
    
    if (this.isConnected && this.client) {
      try {
        await this.client.setEx(key, actualTtl, JSON.stringify(value));
        return;
      } catch (error) {
        console.warn('Redis set error, falling back to memory cache:', error);
      }
    }

    // Fallback to memory cache
    this.fallbackCache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: actualTtl * 1000 // Convert to milliseconds
    });

    // Clean up expired items periodically
    this.cleanupFallbackCache();
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.warn('Redis get error, falling back to memory cache:', error);
      }
    }

    // Fallback to memory cache
    const item = this.fallbackCache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.fallbackCache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (error) {
        console.warn('Redis delete error:', error);
      }
    }

    // Fallback to memory cache
    this.fallbackCache.delete(key);
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (this.isConnected && this.client) {
      try {
        const result = await this.client.exists(key);
        return result === 1;
      } catch (error) {
        console.warn('Redis exists error:', error);
      }
    }

    // Fallback to memory cache
    const item = this.fallbackCache.get(key);
    if (!item) return false;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.fallbackCache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.flushDb();
        return;
      } catch (error) {
        console.warn('Redis clear error:', error);
      }
    }

    // Fallback to memory cache
    this.fallbackCache.clear();
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const stats: CacheStats = {
      isRedisConnected: this.isConnected,
      fallbackCacheSize: this.fallbackCache.size,
      redisInfo: undefined
    };

    if (this.isConnected && this.client) {
      try {
        stats.redisInfo = await this.client.info();
      } catch (error) {
        console.warn('Redis info error:', error);
      }
    }

    return stats;
  }

  /**
   * Cache with automatic refresh
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, ttl);
    return fresh;
  }

  /**
   * Batch operations
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (this.isConnected && this.client) {
      try {
        const values = await this.client.mGet(keys);
        return values.map(value => value ? JSON.parse(value) : null);
      } catch (error) {
        console.warn('Redis mget error:', error);
      }
    }

    // Fallback to memory cache
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  async mset(items: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        const pipeline = this.client.multi();
        items.forEach(({ key, value, ttl }) => {
          const actualTtl = ttl || this.config.ttl!;
          pipeline.setEx(key, actualTtl, JSON.stringify(value));
        });
        await pipeline.exec();
        return;
      } catch (error) {
        console.warn('Redis mset error:', error);
      }
    }

    // Fallback to memory cache
    items.forEach(({ key, value, ttl }) => {
      this.set(key, value, ttl);
    });
  }

  /**
   * Clean up expired items from fallback cache
   */
  private cleanupFallbackCache(): void {
    const now = Date.now();
    for (const [key, item] of this.fallbackCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.fallbackCache.delete(key);
      }
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
      } catch (error) {
        console.warn('Redis disconnect error:', error);
      }
    }
    this.isConnected = false;
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Cache key generators
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  userSettings: (id: string) => `user:settings:${id}`,
  userNotifications: (id: string) => `user:notifications:${id}`,
  userActivity: (id: string) => `user:activity:${id}`,
  apiResponse: (endpoint: string, params?: string) => 
    `api:${endpoint}${params ? `:${params}` : ''}`,
  search: (query: string) => `search:${btoa(encodeURIComponent(query))}`,
  dashboard: (userId: string, type: string) => `dashboard:${userId}:${type}`,
  performance: (metric: string, timeframe: string) => `perf:${metric}:${timeframe}`
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
};

export default cacheService;