"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Network, Activity, TrendingUp, Database, RefreshCw, ExternalLink, Zap, Globe } from "lucide-react"

interface NetworkStats {
  name: string
  chainId: string
  totalTransactions: number | "N/A"
  recentTransactions: any[]
  tokenAddress: string
  rollupAddress: string
  lastUpdated: string
  error?: string
}

interface MultiChainStats {
  networks: NetworkStats[]
  summary: {
    totalTransactions: number | "N/A"
    totalNetworks: number
    lastUpdated: string
  }
}

export function NetworkStatsViewer() {
  const [stats, setStats] = useState<MultiChainStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async () => {
    try {
      console.log("[v0] Fetching network stats")
      const response = await fetch("/api/stats/networks")
      if (!response.ok) throw new Error("Failed to fetch network stats")
      const data = await response.json()
      setStats(data)
      console.log("[v0] Network stats loaded:", data.summary)
    } catch (error) {
      console.error("Error fetching network stats:", error)
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
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchStats, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number | "N/A") => {
    if (num === "N/A") return "N/A"
    return new Intl.NumberFormat().format(num)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString()
  }

  const getChainIcon = (chainId: string) => {
    switch (chainId) {
      case "1":
        return <Network className="h-5 w-5 text-blue-500" />
      case "61":
        return <Zap className="h-5 w-5 text-green-500" />
      case "56":
        return <Globe className="h-5 w-5 text-yellow-500" />
      default:
        return <Network className="h-5 w-5 text-primary" />
    }
  }

  const getExplorerUrl = (chainId: string, address: string) => {
    switch (chainId) {
      case "1":
        return `https://etherscan.io/address/${address}`
      case "61":
        return `https://blockscout.com/etc/mainnet/address/${address}`
      case "56":
        return `https://bscscan.com/address/${address}`
      default:
        return "#"
    }
  }

  if (loading) {
    return (
      <Card className="border-primary/20 bg-card/40 holographic glow-effect">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Network className="h-5 w-5 text-primary animate-pulse" />
            Multi-Chain Network Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-primary/10 rounded animate-pulse"></div>
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted/20 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="border-destructive/20 bg-card/40">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Network Stats</CardTitle>
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-primary/20 bg-card/40 holographic glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Total Networks</CardTitle>
            <Network className="h-5 w-5 text-primary neon-glow" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary font-[var(--font-heading)]">
              {stats.summary.totalNetworks}
            </div>
            <p className="text-xs text-muted-foreground">Active blockchain networks</p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-card/40 holographic glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Cross-Chain Transactions</CardTitle>
            <Activity className="h-5 w-5 text-accent neon-glow" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent font-[var(--font-heading)]">
              {formatNumber(stats.summary.totalTransactions)}
            </div>
            <p className="text-xs text-muted-foreground">Across all networks</p>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 bg-card/40 holographic glow-effect sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Last Updated</CardTitle>
            <RefreshCw className={`h-5 w-5 text-secondary neon-glow ${refreshing ? "animate-spin" : ""}`} />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-secondary font-[var(--font-heading)]">
              {formatTime(stats.summary.lastUpdated)}
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="ghost"
              size="sm"
              className="mt-2 h-6 text-xs"
            >
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Network Details */}
      <Card className="border-primary/20 bg-card/40 holographic glow-effect">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Network Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="mainnet" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/20 h-auto">
              <TabsTrigger value="mainnet" className="data-[state=active]:bg-primary/20 text-xs sm:text-sm py-2">
                Main Net
              </TabsTrigger>
              <TabsTrigger value="etc" className="data-[state=active]:bg-primary/20 text-xs sm:text-sm py-2">
                ETC Peg
              </TabsTrigger>
              <TabsTrigger value="bnb" className="data-[state=active]:bg-primary/20 text-xs sm:text-sm py-2">
                BNB Peg
              </TabsTrigger>
            </TabsList>

            {stats.networks.map((network, index) => (
              <TabsContent
                key={network.chainId}
                value={index === 0 ? "mainnet" : index === 1 ? "etc" : "bnb"}
                className="space-y-4 mt-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getChainIcon(network.chainId)}
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg">{network.name}</h3>
                      <p className="text-sm text-muted-foreground">Chain ID: {network.chainId}</p>
                    </div>
                  </div>
                  {network.error && (
                    <div className="w-full max-w-full overflow-hidden">
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 border-amber-500/30 text-amber-500 text-xs w-full max-w-full"
                      >
                        <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">
                          {network.error}
                        </span>
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="border-muted/20 bg-muted/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        Token Contract
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => window.open(getExplorerUrl(network.chainId, network.tokenAddress), "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs font-mono text-muted-foreground break-all overflow-hidden text-ellipsis">
                        {network.tokenAddress}
                      </p>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Activity className="w-3 h-3 mr-1" />
                          {formatNumber(network.totalTransactions)} transactions
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-muted/20 bg-muted/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        Rollup Contract
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => window.open(getExplorerUrl(network.chainId, network.rollupAddress), "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs font-mono text-muted-foreground break-all overflow-hidden text-ellipsis">
                        {network.rollupAddress}
                      </p>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Layer 2 Scaling
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
