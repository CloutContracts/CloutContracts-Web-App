interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  ttl?: number
  metadata?: Record<string, any>
}

interface CacheStats {
  totalEntries: number
  memoryUsage: number
  hitRate: number
  missRate: number
}

class CacheDB {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private hits = 0
  private misses = 0
  private maxSize = 1000 // Maximum cache entries
  private defaultTTL = 3600000 // 1 hour in milliseconds

  constructor(maxSize = 1000, defaultTTL = 3600000) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 300000)

    console.log("[v0] CacheDB initialized")
  }

  // Store data in cache
  set<T>(key: string, value: T, ttl?: number, metadata?: Record<string, any>): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      metadata,
    }

    this.cache.set(key, entry)
    console.log(`[v0] Cached entry: ${key}`)
  }

  // Retrieve data from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.misses++
      return null
    }

    // Check if entry has expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    this.hits++
    return entry.value as T
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Check expiration
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  // Remove entry from cache
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
    console.log("[v0] Cache cleared")
  }

  // Get cache statistics
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses
    return {
      totalEntries: this.cache.size,
      memoryUsage: this.estimateMemoryUsage(),
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.misses / totalRequests : 0,
    }
  }

  // Cache compiled contracts
  cacheCompiledContract(sourceCode: string, bytecode: string, abi: any[]): void {
    const key = `contract:${this.hashString(sourceCode)}`
    this.set(key, { bytecode, abi }, 7200000) // 2 hours TTL
  }

  // Get cached compiled contract
  getCachedContract(sourceCode: string): { bytecode: string; abi: any[] } | null {
    const key = `contract:${this.hashString(sourceCode)}`
    return this.get(key)
  }

  // Cache deployment result
  cacheDeployment(contractHash: string, address: string, transactionHash: string): void {
    const key = `deployment:${contractHash}`
    this.set(key, { address, transactionHash }, 86400000) // 24 hours TTL
  }

  // Get cached deployment
  getCachedDeployment(contractHash: string): { address: string; transactionHash: string } | null {
    const key = `deployment:${contractHash}`
    return this.get(key)
  }

  // Cache network data
  cacheNetworkData(endpoint: string, data: any): void {
    const key = `network:${endpoint}`
    this.set(key, data, 300000) // 5 minutes TTL for network data
  }

  // Get cached network data
  getCachedNetworkData(endpoint: string): any | null {
    const key = `network:${endpoint}`
    return this.get(key)
  }

  // Offline storage for critical data
  setOfflineData<T>(key: string, value: T): void {
    try {
      localStorage.setItem(
        `cachedb:${key}`,
        JSON.stringify({
          value,
          timestamp: Date.now(),
        }),
      )
      console.log(`[v0] Stored offline data: ${key}`)
    } catch (error) {
      console.error("[v0] Failed to store offline data:", error)
    }
  }

  // Retrieve offline data
  getOfflineData<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(`cachedb:${key}`)
      if (!stored) return null

      const parsed = JSON.parse(stored)
      return parsed.value as T
    } catch (error) {
      console.error("[v0] Failed to retrieve offline data:", error)
      return null
    }
  }

  private evictOldest(): void {
    let oldestKey = ""
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[v0] Cleaned ${cleaned} expired cache entries`)
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let size = 0
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry).length * 2 // Rough UTF-16 estimation
    }
    return size
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }
}

// Singleton instance
export const cacheDB = new CacheDB()
export type { CacheEntry, CacheStats }
