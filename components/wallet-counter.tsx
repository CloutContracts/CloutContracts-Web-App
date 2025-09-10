"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Activity, TrendingUp, Database, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WalletStats {
  totalWallets: number
  activeWallets: number
  newWalletsToday: number
  totalTransactions: number
  lastUpdated: string
  error?: string
  isMockData?: boolean
}

export function WalletCounter() {
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isMockData, setIsMockData] = useState(false)

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats/wallets")
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      setStats(data)
      setIsMockData(data.isMockData || false)
    } catch (error) {
      console.error("Error fetching wallet stats:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
  }

  useEffect(() => {
    fetchStats()

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString()
  }

  if (loading) {
    return (
      <Card className="border-primary/20 bg-card/40 holographic glow-effect">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">Network Stats</CardTitle>
          <Users className="h-5 w-5 text-primary neon-glow animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-primary/10 rounded animate-pulse"></div>
            <div className="h-4 bg-muted/20 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="border-destructive/20 bg-card/40">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {isMockData && (
        <div className="md:col-span-2 lg:col-span-4 mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 dark:bg-amber-950/50 dark:border-amber-800">
            <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">
              *Dune API Missing, this is MOCK data
            </p>
          </div>
        </div>
      )}

      <Card className="border-primary/20 bg-card/40 holographic glow-effect">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">Total Wallets</CardTitle>
          <Users className="h-5 w-5 text-primary neon-glow" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary font-[var(--font-heading)]">
            {formatNumber(stats.totalWallets)}
          </div>
          <p className="text-xs text-muted-foreground">Unique wallet addresses</p>
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-card/40 holographic glow-effect">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">Active Wallets</CardTitle>
          <Activity className="h-5 w-5 text-accent neon-glow" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-accent font-[var(--font-heading)]">
            {formatNumber(stats.activeWallets)}
          </div>
          <p className="text-xs text-muted-foreground">Active in last 30 days</p>
        </CardContent>
      </Card>

      <Card className="border-secondary/20 bg-card/40 holographic glow-effect">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">New Today</CardTitle>
          <TrendingUp className="h-5 w-5 text-secondary neon-glow" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-secondary font-[var(--font-heading)]">
            {formatNumber(stats.newWalletsToday)}
          </div>
          <p className="text-xs text-muted-foreground">New wallets created</p>
        </CardContent>
      </Card>

      <Card className="border-emerald-500/20 bg-card/40 holographic glow-effect">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">Transactions</CardTitle>
          <Database className="h-5 w-5 text-emerald-500 neon-glow" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-emerald-500 font-[var(--font-heading)]">
            {formatNumber(stats.totalTransactions)}
          </div>
          <p className="text-xs text-muted-foreground">Total network activity</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4 border-primary/10 bg-card/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className="bg-primary/10 border-primary/30 text-primary dark:text-primary-foreground"
              >
                <Activity className="w-3 h-3 mr-1" />
                {isMockData ? "Mock Data (Dune API Missing)" : "Live Data from Dune Analytics"}
              </Badge>
              {stats.error && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400"
                >
                  {stats.error}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Last updated: {formatTime(stats.lastUpdated)}</span>
              <Button onClick={handleRefresh} disabled={refreshing} variant="ghost" size="sm" className="h-8 w-8 p-0">
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            These stats are currently experimental. Information is provided "as is".
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
