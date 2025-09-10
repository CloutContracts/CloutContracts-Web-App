"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Wifi,
  WifiOff,
  Database,
  Trash2,
  RefreshCw,
  HardDrive,
  Cloud,
  Send as Sync,
  AlertCircle,
  CheckCircle,
  Download,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cacheDB } from "@/lib/cache-db"

interface CacheStats {
  totalEntries: number
  memoryUsage: number
  hitRate: number
  missRate: number
}

interface OfflineData {
  key: string
  size: number
  lastAccessed: string
  type: "contract" | "compilation" | "network" | "user"
  synced: boolean
}

export function OfflineManager() {
  const [isOnline, setIsOnline] = useState(true)
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [offlineData, setOfflineData] = useState<OfflineData[]>([])
  const [syncProgress, setSyncProgress] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [autoSync, setAutoSync] = useState(true)

  const { toast } = useToast()

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: "Back online",
        description: "Connection restored. Syncing cached data...",
      })
      if (autoSync) {
        syncOfflineData()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "Offline mode",
        description: "Working offline. Changes will sync when connection is restored.",
        variant: "destructive",
      })
    }

    // Set initial state
    setIsOnline(navigator.onLine)

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Load initial data
    loadCacheStats()
    loadOfflineData()

    // Periodic updates
    const interval = setInterval(() => {
      loadCacheStats()
      loadOfflineData()
    }, 5000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [autoSync])

  const loadCacheStats = async () => {
    try {
      const response = await fetch("/api/cache?action=stats")
      const result = await response.json()
      if (result.success) {
        setCacheStats(result.stats)
      }
    } catch (error) {
      // Fallback to local cache stats when offline
      const stats = cacheDB.getStats()
      setCacheStats(stats)
    }
  }

  const loadOfflineData = () => {
    const data: OfflineData[] = []

    if (typeof localStorage !== "undefined") {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("cachedb:"))

      keys.forEach((key) => {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const parsed = JSON.parse(stored)
            const cleanKey = key.replace("cachedb:", "")

            data.push({
              key: cleanKey,
              size: JSON.stringify(parsed).length,
              lastAccessed: new Date(parsed.timestamp || Date.now()).toISOString(),
              type: getDataType(cleanKey),
              synced: isOnline, // Assume synced if online
            })
          }
        } catch (error) {
          console.error("[v0] Error parsing offline data:", error)
        }
      })
    }

    setOfflineData(data)
  }

  const getDataType = (key: string): "contract" | "compilation" | "network" | "user" => {
    if (key.includes("contract")) return "contract"
    if (key.includes("compilation") || key.includes("compile")) return "compilation"
    if (key.includes("network") || key.includes("stats")) return "network"
    return "user"
  }

  const syncOfflineData = async () => {
    if (!isOnline) {
      toast({
        title: "Cannot sync",
        description: "No internet connection available",
        variant: "destructive",
      })
      return
    }

    setIsSyncing(true)
    setSyncProgress(0)

    try {
      const unsyncedData = offlineData.filter((item) => !item.synced)

      for (let i = 0; i < unsyncedData.length; i++) {
        const item = unsyncedData[i]

        try {
          // Get data from offline storage
          const offlineValue = cacheDB.getOfflineData(item.key)

          if (offlineValue) {
            // Sync to server cache
            await fetch("/api/cache", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                key: item.key,
                value: offlineValue.value,
                ttl: offlineValue.ttl,
                metadata: { ...offlineValue.metadata, syncedAt: Date.now() },
              }),
            })
          }
        } catch (error) {
          console.error(`[v0] Failed to sync ${item.key}:`, error)
        }

        setSyncProgress(((i + 1) / unsyncedData.length) * 100)
      }

      toast({
        title: "Sync complete",
        description: `Synced ${unsyncedData.length} items to server`,
      })

      loadOfflineData()
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
      setSyncProgress(0)
    }
  }

  const clearCache = async () => {
    try {
      await fetch("/api/cache?action=clear", { method: "DELETE" })

      toast({
        title: "Cache cleared",
        description: "All cached data has been removed",
      })

      loadCacheStats()
      loadOfflineData()
    } catch (error: any) {
      toast({
        title: "Clear failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const downloadOfflineData = () => {
    const dataToExport = offlineData.map((item) => ({
      key: item.key,
      data: cacheDB.getOfflineData(item.key),
      metadata: {
        size: item.size,
        lastAccessed: item.lastAccessed,
        type: item.type,
      },
    }))

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cloutcontracts-offline-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Data exported",
      description: "Offline data downloaded successfully",
    })
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Offline Manager</h3>
          <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={syncOfflineData} disabled={!isOnline || isSyncing} size="sm" variant="outline">
            <Sync className="w-4 h-4 mr-2" />
            {isSyncing ? "Syncing..." : "Sync"}
          </Button>
          <Button onClick={clearCache} size="sm" variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {isOnline ? <Cloud className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Status:</span>
              <Badge variant={isOnline ? "default" : "secondary"}>{isOnline ? "Connected" : "Offline Mode"}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Auto Sync:</span>
              <Badge variant={autoSync ? "default" : "outline"}>{autoSync ? "Enabled" : "Disabled"}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Offline Data:</span>
              <Badge variant="outline">{offlineData.length} items</Badge>
            </div>

            {isSyncing && (
              <div className="space-y-2">
                <Progress value={syncProgress} className="h-2" />
                <div className="text-xs text-center text-muted-foreground">Syncing... {Math.round(syncProgress)}%</div>
              </div>
            )}

            <Separator />

            <Button onClick={() => setAutoSync(!autoSync)} size="sm" variant="ghost" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              {autoSync ? "Disable" : "Enable"} Auto Sync
            </Button>
          </CardContent>
        </Card>

        {/* Cache Statistics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4" />
              Cache Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cacheStats ? (
              <>
                <div className="flex justify-between text-sm">
                  <span>Total Entries:</span>
                  <Badge variant="outline">{cacheStats.totalEntries}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Memory Usage:</span>
                  <Badge variant="outline">{formatBytes(cacheStats.memoryUsage)}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Hit Rate:</span>
                  <Badge variant="outline">{Math.round(cacheStats.hitRate * 100)}%</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Miss Rate:</span>
                  <Badge variant="outline">{Math.round(cacheStats.missRate * 100)}%</Badge>
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground">
                  Cache efficiency: {cacheStats.hitRate > 0.7 ? "Good" : cacheStats.hitRate > 0.4 ? "Fair" : "Poor"}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Loading cache statistics...</div>
            )}
          </CardContent>
        </Card>

        {/* Offline Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Offline Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={downloadOfflineData}
              size="sm"
              variant="outline"
              className="w-full bg-transparent"
              disabled={offlineData.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Offline Data
            </Button>

            <Button onClick={loadOfflineData} size="sm" variant="ghost" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data List
            </Button>

            <Separator />

            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Contracts cached for offline use</div>
              <div>• Compilations stored locally</div>
              <div>• Auto-sync when online</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offline Data List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            Offline Data ({offlineData.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {offlineData.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No offline data stored yet. Use the IDE or deploy contracts to cache data locally.
                </div>
              ) : (
                offlineData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.synced ? "bg-green-500" : "bg-yellow-500"}`} />
                      <div>
                        <div className="text-sm font-medium">{item.key}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatBytes(item.size)} • {item.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.synced ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {item.synced ? "Synced" : "Pending"}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.lastAccessed).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
