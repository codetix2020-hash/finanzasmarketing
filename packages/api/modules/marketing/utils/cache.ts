/**
 * Simple in-memory cache
 * 
 * Para producción, considera usar Redis
 */

interface CacheItem<T> {
  data: T;
  expires: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();

  /**
   * Obtener valor del cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Verificar si expiró
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Guardar valor en cache
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Eliminar del cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpiar todo el cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtener o ejecutar función si no existe
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Intentar obtener del cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Ejecutar función
    const data = await fn();

    // Guardar en cache
    this.set(key, data, ttlSeconds);

    return data;
  }

  /**
   * Obtener estadísticas del cache
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Exportar instancia singleton
export const cache = new SimpleCache();













