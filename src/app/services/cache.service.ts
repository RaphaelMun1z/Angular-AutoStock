import { Injectable, signal } from '@angular/core';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  // TTL padrão: 5 minutos (em ms). Após isso, o cache expira automaticamente.
  private readonly TTL = 5 * 60 * 1000;
  private store = new Map<string, CacheEntry<unknown>>();

  /** Verifica se existe cache válido para a chave */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    const expired = Date.now() - entry.cachedAt > this.TTL;
    if (expired) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /** Retorna o dado em cache ou null */
  get<T>(key: string): T | null {
    if (!this.has(key)) return null;
    return (this.store.get(key) as CacheEntry<T>).data;
  }

  /** Salva dado no cache */
  set<T>(key: string, data: T): void {
    this.store.set(key, { data, cachedAt: Date.now() });
  }

  /** Remove uma entrada específica (força refresh) */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Limpa todo o cache */
  clear(): void {
    this.store.clear();
  }
}
