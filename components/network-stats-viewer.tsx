"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Network, 
  Activity, 
  Fuel, 
  Boxes, 
  RefreshCw, 
  ExternalLink, 
  Clock,
  Hash,
  Cpu,
  ArrowDownUp
} from "lucide-react"
import Image from "next/image"

// Bridge operator address - derived from BRIDGE_OPERATOR_PRIVATE_KEY
const BRIDGE_OPERATOR_ADDRESS = "0x1e34d105862e909b390465e71e599e99d7e80e72"

// Network contracts (external chains only, not CloutContracts)
const NETWORK_CONTRACTS = [
  {
    name: "Ethereum",
    symbol: "ETH",
    contract: "0x1da4858ad385cc377165A298CC2CE3fce0C5fD31",
    explorerUrl: "https://etherscan.io/token/0x1da4858ad385cc377165A298CC2CE3fce0C5fD31",
    icon: "/bridge/ETH.png",
  },
  {
    name: "BNB Chain",
    symbol: "BNB",
    contract: "0x3e3B357061103DC040759aC7DceEaba9901043aD",
    explorerUrl: "https://bscscan.com/token/0x3e3B357061103DC040759aC7DceEaba9901043aD",
    icon: "/bridge/BNB.png",
  },
  {
    name: "Ethereum Classic",
    symbol: "ETC",
    contract: "0x9186ff77866DfD1007429F552e48C6d1A927297A",
    explorerUrl: "https://blockscout.com/etc/mainnet/token/0x9186ff77866DfD1007429F552e48C6d1A927297A",
    icon: "/bridge/ETC.png",
  },
]

interface RecentBlock {
  number: number
  hash: string
  timestamp: number
  transactionCount: number
  miner: string
  gasUsed: string
  gasLimit: string
}

interface MainnetStats {
  blockNumber: number
  totalTransactions: number
  gasPrice: string
  chainId: number
  networkName: string
  rpcUrl: string
  explorerUrl: string
  recentBlocks: RecentBlock[]
  lastUpdated: string
  error?: string
}

export function NetworkStatsViewer() {
  const [stats, setStats] = useState<MainnetStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [bridgeTransactions, setBridgeTransactions] = useState<number>(0)
  const [totalTransactions, setTotalTransactions] = useState<number>(0)
  const [fetchingBridgeTx, setFetchingBridgeTx] = useState(true)
  const [fetchingTotalTx, setFetchingTotalTx] = useState(true)

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats/networks")
      if (!response.ok) throw new Error("Failed to fetch mainnet stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching mainnet stats:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchBridgeTransactions = async () => {
    setFetchingBridgeTx(true)
    try {
      // Fetch transaction count from CloutContracts RPC for the bridge operator
      const response = await fetch("https://evm.cloutcontracts.net", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getTransactionCount",
          params: [BRIDGE_OPERATOR_ADDRESS, "latest"],
          id: 1,
        }),
      })

      const result = await response.json()
      if (result.result) {
        const txCount = parseInt(result.result, 16)
        setBridgeTransactions(txCount)
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setFetchingBridgeTx(false)
    }
  }

  const fetchTotalTransactions = async () => {
    setFetchingTotalTx(true)
    try {
      // Get latest block number first
      const blockResponse = await fetch("https://evm.cloutcontracts.net", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      })

      const blockResult = await blockResponse.json()
      if (blockResult.result) {
        const latestBlock = parseInt(blockResult.result, 16)
        
        // Estimate total transactions by sampling recent blocks
        // and calculating average transactions per block
        let totalTxEstimate = 0
        const samplesToCheck = Math.min(10, latestBlock)
        
        for (let i = 0; i < samplesToCheck; i++) {
          const blockNum = latestBlock - i
          const txCountResponse = await fetch("https://evm.cloutcontracts.net", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_getBlockTransactionCountByNumber",
              params: [`0x${blockNum.toString(16)}`],
              id: 1,
            }),
          })
          
          const txCountResult = await txCountResponse.json()
          if (txCountResult.result) {
            totalTxEstimate += parseInt(txCountResult.result, 16)
          }
        }
        
        // Average tx per block * total blocks = estimated total
        const avgTxPerBlock = totalTxEstimate / samplesToCheck
        setTotalTransactions(Math.round(avgTxPerBlock * latestBlock))
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setFetchingTotalTx(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchStats(), fetchBridgeTransactions(), fetchTotalTransactions()])
  }

  useEffect(() => {
    fetchStats()
    fetchBridgeTransactions()
    fetchTotalTransactions()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats()
      fetchBridgeTransactions()
      fetchTotalTransactions()
    }, 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString()
  }

  const formatBlockTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const truncateHash = (hash: string) => {
    if (!hash) return ""
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  const truncateAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  if (loading) {
    return (
      <Card className="border-primary/20 bg-card/40 holographic glow-effect">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Network className="h-5 w-5 text-primary animate-pulse" />
            Network Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-primary/10 rounded animate-pulse"></div>
            <div className="grid md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted/20 rounded animate-pulse"></div>
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
    <div className="space-y-6">
      {/* Header with Network Info */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{stats.networkName}</h2>
            <p className="text-sm text-muted-foreground">Chain ID: {stats.chainId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(stats.explorerUrl, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Explorer
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {stats.error && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-3">
            <p className="text-amber-500 text-sm">{stats.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-card/40 holographic glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Block Height</CardTitle>
            <Boxes className="h-5 w-5 text-primary neon-glow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold text-primary font-[var(--font-heading)]">
              {formatNumber(stats.blockNumber)}
            </div>
            <p className="text-xs text-muted-foreground">Latest block</p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-card/40 holographic glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Bridge Transactions</CardTitle>
            <ArrowDownUp className="h-5 w-5 text-accent neon-glow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold text-accent font-[var(--font-heading)]">
              {fetchingBridgeTx ? "..." : formatNumber(bridgeTransactions)}
            </div>
            <p className="text-xs text-muted-foreground">Total bridge operations</p>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20 bg-card/40 holographic glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Gas Price</CardTitle>
            <Fuel className="h-5 w-5 text-cyan-500 neon-glow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold text-cyan-500 font-[var(--font-heading)]">
              {stats.gasPrice}
            </div>
            <p className="text-xs text-muted-foreground">Current gas price</p>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 bg-card/40 holographic glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Total Transactions</CardTitle>
            <Activity className="h-5 w-5 text-secondary neon-glow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold text-secondary font-[var(--font-heading)]">
              {fetchingTotalTx ? "..." : formatNumber(totalTransactions)}
            </div>
            <p className="text-xs text-muted-foreground">Estimated network activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Network Breakdown - Contracts Only */}
      <Card className="border-primary/20 bg-card/40 holographic glow-effect">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Network Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {NETWORK_CONTRACTS.map((network) => (
              <div
                key={network.symbol}
                className="flex flex-col items-center p-4 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <Image
                  src={network.icon}
                  alt={network.name}
                  width={40}
                  height={40}
                  className="rounded-full mb-3"
                />
                <h4 className="font-semibold text-sm mb-1">{network.name}</h4>
                <p className="text-xs text-muted-foreground font-mono mb-3">
                  {network.contract.slice(0, 8)}...{network.contract.slice(-6)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(network.explorerUrl, "_blank")}
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  View Contract
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Blocks */}
      <Card className="border-primary/20 bg-card/40 holographic glow-effect">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            Recent Blocks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentBlocks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No blocks available</p>
            ) : (
              stats.recentBlocks.map((block) => (
                <div
                  key={block.number}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-primary/10">
                      <Boxes className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">#{formatNumber(block.number)}</span>
                        <Badge variant="outline" className="text-xs">
                          {block.transactionCount} txns
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        <span className="font-mono">{truncateHash(block.hash)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Cpu className="h-3 w-3" />
                      <span className="font-mono text-xs">{truncateAddress(block.miner)}</span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Gas: {block.gasUsed} / {block.gasLimit}
                    </div>
                    <div className="text-muted-foreground text-xs min-w-[60px] text-right">
                      {formatBlockTime(block.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {stats.recentBlocks.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`${stats.explorerUrl}/blocks`, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View All Blocks
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Info */}
      <Card className="border-muted/20 bg-card/40">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>RPC:</span>
              <code className="px-2 py-1 rounded bg-muted/20 font-mono text-xs">{stats.rpcUrl}</code>
            </div>
            <div className="flex items-center gap-2">
              <span>Chain ID:</span>
              <code className="px-2 py-1 rounded bg-muted/20 font-mono text-xs">{stats.chainId}</code>
            </div>
            <div className="flex items-center gap-2">
              <span>Currency:</span>
              <code className="px-2 py-1 rounded bg-muted/20 font-mono text-xs">CCS</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
