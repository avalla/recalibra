import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry?: number; // Expiry time in milliseconds
}

export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheItem<any>> = new Map();
  
  private constructor() {}
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
  
  // Memory cache methods
  setMemoryCache<T>(key: string, data: T, expiry?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: expiry ? Date.now() + expiry : undefined,
    };
    
    this.memoryCache.set(key, item);
    logger.debug(`Set memory cache for key: ${key}`, 'CacheManager');
  }
  
  getMemoryCache<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if item has expired
    if (item.expiry && Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      logger.debug(`Memory cache expired for key: ${key}`, 'CacheManager');
      return null;
    }
    
    logger.debug(`Retrieved from memory cache: ${key}`, 'CacheManager');
    return item.data;
  }
  
  removeMemoryCache(key: string): boolean {
    const result = this.memoryCache.delete(key);
    if (result) {
      logger.debug(`Removed memory cache for key: ${key}`, 'CacheManager');
    }
    return result;
  }
  
  clearMemoryCache(): void {
    this.memoryCache.clear();
    logger.debug('Cleared memory cache', 'CacheManager');
  }
  
  // Persistent cache methods (using AsyncStorage)
  async setPersistentCache<T>(key: string, data: T, expiry?: number): Promise<void> {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: expiry ? Date.now() + expiry : undefined,
      };
      
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(item));
      logger.debug(`Set persistent cache for key: ${key}`, 'CacheManager');
    } catch (error) {
      logger.error(`Error setting persistent cache for key: ${key}`, error as Error, 'CacheManager');
    }
  }
  
  async getPersistentCache<T>(key: string): Promise<T | null> {
    try {
      const itemString = await AsyncStorage.getItem(`cache_${key}`);
      
      if (!itemString) {
        return null;
      }
      
      const item: CacheItem<T> = JSON.parse(itemString);
      
      // Check if item has expired
      if (item.expiry && Date.now() > item.expiry) {
        await this.removePersistentCache(key);
        logger.debug(`Persistent cache expired for key: ${key}`, 'CacheManager');
        return null;
      }
      
      logger.debug(`Retrieved from persistent cache: ${key}`, 'CacheManager');
      return item.data;
    } catch (error) {
      logger.error(`Error getting persistent cache for key: ${key}`, error as Error, 'CacheManager');
      return null;
    }
  }
  
  async removePersistentCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
      logger.debug(`Removed persistent cache for key: ${key}`, 'CacheManager');
    } catch (error) {
      logger.error(`Error removing persistent cache for key: ${key}`, error as Error, 'CacheManager');
    }
  }
  
  async clearPersistentCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      logger.debug('Cleared persistent cache', 'CacheManager');
    } catch (error) {
      logger.error('Error clearing persistent cache', error as Error, 'CacheManager');
    }
  }
  
  // Hybrid cache methods (memory first, then persistent)
  async setCache<T>(key: string, data: T, expiry?: number): Promise<void> {
    // Set in memory cache
    this.setMemoryCache(key, data, expiry);
    
    // Set in persistent cache
    await this.setPersistentCache(key, data, expiry);
  }
  
  async getCache<T>(key: string): Promise<T | null> {
    // Try memory cache first
    let data = this.getMemoryCache<T>(key);
    
    if (data !== null) {
      return data;
    }
    
    // If not in memory, try persistent cache
    data = await this.getPersistentCache<T>(key);
    
    // If found in persistent cache, also set in memory cache for faster access next time
    if (data !== null) {
      this.setMemoryCache(key, data);
    }
    
    return data;
  }
  
  async removeCache(key: string): Promise<void> {
    this.removeMemoryCache(key);
    await this.removePersistentCache(key);
  }
  
  async clearAllCache(): Promise<void> {
    this.clearMemoryCache();
    await this.clearPersistentCache();
  }
  
  // Utility methods
  getMemoryCacheSize(): number {
    return this.memoryCache.size;
  }
  
  async getPersistentCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => key.startsWith('cache_')).length;
    } catch (error) {
      logger.error('Error getting persistent cache size', error as Error, 'CacheManager');
      return 0;
    }
  }
}

export const cacheManager = CacheManager.getInstance();

// Helper functions
export const setCache = async <T>(key: string, data: T, expiry?: number): Promise<void> => {
  await cacheManager.setCache(key, data, expiry);
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  return await cacheManager.getCache<T>(key);
};

export const removeCache = async (key: string): Promise<void> => {
  await cacheManager.removeCache(key);
};
