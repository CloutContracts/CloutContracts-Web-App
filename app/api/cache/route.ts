import { type NextRequest, NextResponse } from "next/server"
import { cacheDB } from "@/lib/cache-db"

interface CacheRequest {
  key: string
  value?: any
  ttl?: number
  metadata?: Record<string, any>
}

interface CacheStats {
  totalEntries: number
  memoryUsage: number
  hitRate: number
  missRate: number
}

// Get cache entry or stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    const action = searchParams.get("action")

    if (action === "stats") {
      const stats = cacheDB.getStats()
      return NextResponse.json({
        success: true,
        stats,
        cacheEnabled: true,
        offlineMode: !navigator.onLine,
      })
    }

    if (!key) {
      return NextResponse.json({ error: "Key parameter required" }, { status: 400 })
    }

    const value = cacheDB.get(key)
    const exists = cacheDB.has(key)

    return NextResponse.json({
      success: true,
      exists,
      value,
      key,
    })
  } catch (error: any) {
    console.error("[v0] Cache GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Set cache entry
export async function POST(request: NextRequest) {
  try {
    const { key, value, ttl, metadata }: CacheRequest = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 })
    }

    console.log(`[v0] Caching entry: ${key}`)
    cacheDB.set(key, value, ttl, metadata)

    // Also store in offline storage for persistence
    cacheDB.setOfflineData(key, { value, ttl, metadata, timestamp: Date.now() })

    return NextResponse.json({
      success: true,
      key,
      cached: true,
      offlineStored: true,
    })
  } catch (error: any) {
    console.error("[v0] Cache POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Delete cache entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    const action = searchParams.get("action")

    if (action === "clear") {
      console.log("[v0] Clearing all cache entries")
      cacheDB.clear()

      // Clear offline storage
      if (typeof localStorage !== "undefined") {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith("cachedb:"))
        keys.forEach((k) => localStorage.removeItem(k))
      }

      return NextResponse.json({
        success: true,
        cleared: true,
        offlineCleared: true,
      })
    }

    if (!key) {
      return NextResponse.json({ error: "Key parameter required" }, { status: 400 })
    }

    const deleted = cacheDB.delete(key)

    // Remove from offline storage
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(`cachedb:${key}`)
    }

    return NextResponse.json({
      success: true,
      deleted,
      key,
    })
  } catch (error: any) {
    console.error("[v0] Cache DELETE error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
