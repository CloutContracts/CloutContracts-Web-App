"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Hash, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"

interface Block {
  number: number
  hash: string
  timestamp: number
  transactions: number
  gasUsed: number
  gasLimit: number
  miner: string
  size: number
}

interface Transaction {
  hash: string
  from: string
  to: string
  value: number
  gas: number
  gasPrice: number
  gasUsed?: number
  status?: number
  blockNumber?: number
  nonce?: number
  input?: string
}

export function BlockExplorer() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("blocks")

  useEffect(() => {
    fetchBlocks()
  }, [currentPage])

  const fetchBlocks = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/explorer/blocks?page=${currentPage}&limit=10`)
      const data = await response.json()
      if (data.blocks) {
        setBlocks(data.blocks)
      }
    } catch (error) {
      console.error("Failed to fetch blocks:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async (blockNumber: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/explorer/transactions?block=${blockNumber}`)
      const data = await response.json()
      if (data.transactions) {
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactionDetails = async (hash: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/explorer/transactions?hash=${hash}`)
      const data = await response.json()
      if (data.hash) {
        setSelectedTransaction(data)
      }
    } catch (error) {
      console.error("Failed to fetch transaction details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      if (searchQuery.startsWith("0x") && searchQuery.length === 66) {
        // Transaction hash
        await fetchTransactionDetails(searchQuery)
        setActiveTab("transaction-details")
      } else if (/^\d+$/.test(searchQuery)) {
        // Block number
        const blockNum = Number.parseInt(searchQuery)
        const block = blocks.find((b) => b.number === blockNum)
        if (block) {
          setSelectedBlock(block)
          await fetchTransactions(blockNum)
          setActiveTab("block-details")
        }
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  const formatValue = (value: number) => {
    return (value / 1e18).toFixed(6)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground neon-text font-[var(--font-heading)]">Block Explorer</h3>
          <p className="text-muted-foreground">
            Explore blocks, transactions, and addresses on the CloutContracts network
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by block number, tx hash, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 bg-card/50 border-primary/30"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-primary/20 hover:bg-primary/30 border border-primary/50 neon-glow"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card/60 border border-border/50 p-2 rounded-xl backdrop-blur-sm">
          <TabsTrigger
            value="blocks"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:neon-glow rounded-lg transition-all duration-300"
          >
            Latest Blocks
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:neon-glow rounded-lg transition-all duration-300"
          >
            Recent Transactions
          </TabsTrigger>
          <TabsTrigger
            value="block-details"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:neon-glow rounded-lg transition-all duration-300"
          >
            Block Details
          </TabsTrigger>
          <TabsTrigger
            value="transaction-details"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:neon-glow rounded-lg transition-all duration-300"
          >
            Transaction Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blocks" className="space-y-6">
          <Card className="border-primary/20 bg-card/40 holographic glow-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary font-[var(--font-heading)]">
                <Hash className="w-5 h-5" />
                Latest Blocks
              </CardTitle>
              <CardDescription>Most recent blocks on the CloutContracts network</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Block</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Gas Used</TableHead>
                    <TableHead>Miner</TableHead>
                    <TableHead>Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.map((block) => (
                    <TableRow
                      key={block.number}
                      className="hover:bg-primary/5 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedBlock(block)
                        fetchTransactions(block.number)
                        setActiveTab("block-details")
                      }}
                    >
                      <TableCell className="font-mono text-primary">#{block.number}</TableCell>
                      <TableCell className="text-muted-foreground">{formatTimestamp(block.timestamp)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-accent/20 text-accent">
                          {block.transactions}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${(block.gasUsed / block.gasLimit) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {((block.gasUsed / block.gasLimit) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{formatHash(block.miner)}</TableCell>
                      <TableCell className="text-muted-foreground">{(block.size / 1024).toFixed(1)} KB</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className="border-primary/30"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <span className="text-muted-foreground">Page {currentPage}</span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={loading}
                  className="border-primary/30"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="block-details" className="space-y-6">
          {selectedBlock && (
            <Card className="border-primary/20 bg-card/40 holographic glow-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary font-[var(--font-heading)]">
                  <Hash className="w-5 h-5" />
                  Block #{selectedBlock.number}
                </CardTitle>
                <CardDescription>Block details and transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Block Hash</p>
                      <p className="font-mono text-sm bg-muted/20 p-2 rounded">{selectedBlock.hash}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Timestamp</p>
                      <p className="font-mono">{formatTimestamp(selectedBlock.timestamp)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Miner</p>
                      <p className="font-mono text-sm bg-muted/20 p-2 rounded">{selectedBlock.miner}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Transactions</p>
                      <p className="text-2xl font-bold text-accent">{selectedBlock.transactions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Gas Used / Limit</p>
                      <p className="font-mono">
                        {selectedBlock.gasUsed.toLocaleString()} / {selectedBlock.gasLimit.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Size</p>
                      <p className="font-mono">{(selectedBlock.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                </div>

                {transactions.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-accent">Transactions in this Block</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hash</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Value (CCS)</TableHead>
                          <TableHead>Gas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow
                            key={tx.hash}
                            className="hover:bg-primary/5 cursor-pointer transition-colors"
                            onClick={() => {
                              fetchTransactionDetails(tx.hash)
                              setActiveTab("transaction-details")
                            }}
                          >
                            <TableCell className="font-mono text-primary">{formatHash(tx.hash)}</TableCell>
                            <TableCell className="font-mono text-sm">{formatHash(tx.from)}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {tx.to ? formatHash(tx.to) : "Contract Creation"}
                            </TableCell>
                            <TableCell className="font-mono">{formatValue(tx.value)}</TableCell>
                            <TableCell className="text-muted-foreground">{tx.gas.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transaction-details" className="space-y-6">
          {selectedTransaction && (
            <Card className="border-primary/20 bg-card/40 holographic glow-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary font-[var(--font-heading)]">
                  <ExternalLink className="w-5 h-5" />
                  Transaction Details
                </CardTitle>
                <CardDescription>Complete transaction information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Transaction Hash</p>
                      <p className="font-mono text-sm bg-muted/20 p-2 rounded break-all">{selectedTransaction.hash}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">From</p>
                      <p className="font-mono text-sm bg-muted/20 p-2 rounded">{selectedTransaction.from}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">To</p>
                      <p className="font-mono text-sm bg-muted/20 p-2 rounded">
                        {selectedTransaction.to || "Contract Creation"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Value</p>
                      <p className="text-2xl font-bold text-accent">{formatValue(selectedTransaction.value)} CCS</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Status</p>
                      <Badge
                        variant={selectedTransaction.status === 1 ? "default" : "destructive"}
                        className={selectedTransaction.status === 1 ? "bg-green-500/20 text-green-400" : ""}
                      >
                        {selectedTransaction.status === 1 ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Block Number</p>
                      <p className="font-mono text-primary">#{selectedTransaction.blockNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Gas Used / Limit</p>
                      <p className="font-mono">
                        {selectedTransaction.gasUsed?.toLocaleString()} / {selectedTransaction.gas.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Gas Price</p>
                      <p className="font-mono">{(selectedTransaction.gasPrice / 1e9).toFixed(2)} Gwei</p>
                    </div>
                  </div>
                </div>

                {selectedTransaction.input && selectedTransaction.input !== "0x" && (
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Input Data</p>
                    <div className="bg-muted/20 p-4 rounded-lg font-mono text-sm break-all">
                      {selectedTransaction.input}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
