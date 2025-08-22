"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, Send, ArrowUpDown, TrendingUp, Crown, Shield, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

const TOKEN_OWNER_ADDRESS = "0x0D81d9E21BD7C5bB095535624DcB0759E64B3899"
const TOTAL_SUPPLY = "111,000,000"

export function TokenManagement() {
  const [sendAmount, setSendAmount] = useState("")
  const [sendAddress, setSendAddress] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [balance, setBalance] = useState("0")
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [circulatingSupply, setCirculatingSupply] = useState<number>(0)
  const [supplyLoading, setSupplyLoading] = useState(true)
  const { toast } = useToast()
  const { isAdmin, account } = useAuth()

  useEffect(() => {
    if (account) {
      fetchBalance()
      fetchTransactions()
    }
    fetchCirculatingSupply()
  }, [account])

  const fetchCirculatingSupply = async () => {
    try {
      const response = await fetch("/api/tokens/circulating-supply")
      const result = await response.json()

      if (result.success) {
        setCirculatingSupply(result.circulatingSupply)
      } else {
        console.error("Failed to fetch circulating supply:", result.error)
        setCirculatingSupply(0)
      }
    } catch (error) {
      console.error("Error fetching circulating supply:", error)
      setCirculatingSupply(0)
    } finally {
      setSupplyLoading(false)
    }
  }

  const fetchBalance = async () => {
    if (!account) return

    try {
      const response = await fetch(`/api/tokens/balance?address=${account}`)
      const result = await response.json()

      if (response.ok) {
        setBalance(result.balance)
      }
    } catch (error) {
      console.error("Error fetching balance:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTransactions = async () => {
    if (!account) return

    try {
      const response = await fetch(`/api/tokens/transactions?address=${account}`)
      const result = await response.json()

      if (response.ok) {
        setTransactions(result.transactions || [])
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
      setTransactions([])
    }
  }

  const handleSend = async () => {
    if (!sendAmount || !sendAddress) {
      toast({
        title: "Missing information",
        description: "Please enter amount and recipient address",
        variant: "destructive",
      })
      return
    }

    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to send tokens",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/tokens/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: account,
          to: sendAddress,
          amount: Number.parseFloat(sendAmount) * Math.pow(10, 18),
          signature: "",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Transaction failed")
      }

      toast({
        title: "Transaction sent",
        description: `Sent ${sendAmount} CCS to ${sendAddress.slice(0, 10)}...`,
      })

      setSendAmount("")
      setSendAddress("")

      await fetchBalance()
      await fetchTransactions()
    } catch (error: any) {
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to send tokens",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Coins className="w-5 h-5 text-primary glow-effect" />
        <h3 className="text-lg font-semibold neon-text">Token Management</h3>
        <Badge variant="secondary" className="bg-accent/10 text-accent">
          CCS Token
        </Badge>
        {isAdmin && (
          <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/50 glow-effect">
            <Crown className="w-3 h-3 mr-1" />
            Token Owner
          </Badge>
        )}
      </div>

      <Card className="border-primary/30 bg-card/50 cyber-grid">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            CCS Token Information
          </CardTitle>
          <CardDescription>CloutContracts token details and ownership</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Supply</p>
              <p className="text-xl font-bold text-primary">{TOTAL_SUPPLY} CCS</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Circulating Supply
              </p>
              <p className="text-xl font-bold text-accent">
                {supplyLoading ? "Loading..." : `${circulatingSupply.toLocaleString()} CCS`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Token Owner</p>
              <p className="text-sm font-mono text-accent">
                {TOKEN_OWNER_ADDRESS.slice(0, 10)}...{TOKEN_OWNER_ADDRESS.slice(-8)}
              </p>
            </div>
          </div>
          {account?.toLowerCase() === TOKEN_OWNER_ADDRESS.toLowerCase() && (
            <div className="p-3 bg-accent/10 rounded-lg border border-accent/30">
              <p className="text-sm text-accent font-semibold">You are the owner of the entire CCS token supply!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-card/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Coins className="h-4 w-4 text-primary glow-effect" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {isLoading ? "Loading..." : `${Number.parseFloat(balance).toFixed(2)} CCS`}
            </div>
            <p className="text-xs text-muted-foreground">≈ ${(Number.parseFloat(balance) * 12.5).toFixed(2)} USD</p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-card/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staked Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">0.0 CCS</div>
            <p className="text-xs text-muted-foreground">5.2% APY rewards</p>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 bg-card/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Loading..." : `${Number.parseFloat(balance).toFixed(2)} CCS`}
            </div>
            <p className="text-xs text-muted-foreground">Ready to transfer</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList className="bg-card/50 border border-border/50">
          <TabsTrigger value="send" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            Send
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            History
          </TabsTrigger>
          <TabsTrigger value="stake" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            Stake
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <Card className="border-primary/20 bg-card/30 pulse-border">
            <CardHeader>
              <CardTitle className="text-primary">Send CCS Tokens</CardTitle>
              <CardDescription>Transfer CCS tokens to another wallet address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="send-address">Recipient Address</Label>
                <Input
                  id="send-address"
                  placeholder="0x..."
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  className="bg-background/50 border-primary/30 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="send-amount">Amount (CCS)</Label>
                <Input
                  id="send-amount"
                  type="number"
                  placeholder="0.00"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="bg-background/50 border-primary/30 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">Available: {Number.parseFloat(balance).toFixed(2)} CCS</p>
              </div>

              <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                <div className="flex justify-between text-sm">
                  <span>Amount:</span>
                  <span className="text-primary">{sendAmount || "0"} CCS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Network Fee:</span>
                  <span>0.001 CCS</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-primary/20 pt-2 mt-2">
                  <span>Total:</span>
                  <span className="text-primary">
                    {sendAmount ? (Number.parseFloat(sendAmount) + 0.001).toFixed(3) : "0.001"} CCS
                  </span>
                </div>
              </div>

              <Button
                onClick={handleSend}
                disabled={isSending || !sendAmount || !sendAddress || !account}
                className="w-full bg-primary/90 hover:bg-primary text-primary-foreground glow-effect"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSending ? "Sending..." : "Send Tokens"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="border-accent/20 bg-card/30">
            <CardHeader>
              <CardTitle className="text-accent">Transaction History</CardTitle>
              <CardDescription>Recent CCS token transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions found</p>
                ) : (
                  transactions.map((tx, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-primary/20 rounded-lg bg-background/30"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.type === "received"
                              ? "bg-accent/20 text-accent"
                              : tx.type === "sent"
                                ? "bg-destructive/20 text-destructive"
                                : "bg-primary/20 text-primary"
                          }`}
                        >
                          {tx.type === "received" ? "↓" : tx.type === "sent" ? "↑" : "⚡"}
                        </div>
                        <div>
                          <p className="font-semibold capitalize">{tx.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {tx.from && `From ${tx.from}`}
                            {tx.to && `To ${tx.to}`}
                            {tx.type === "mined" && "Mining reward"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${tx.amount.startsWith("+") ? "text-accent" : "text-foreground"}`}>
                          {tx.amount} CCS
                        </p>
                        <p className="text-xs text-muted-foreground">{tx.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stake" className="space-y-4">
          <Card className="border-accent/20 bg-card/30">
            <CardHeader>
              <CardTitle className="text-accent">Stake CCS Tokens</CardTitle>
              <CardDescription>Earn rewards by staking your CCS tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-accent/10 rounded-lg border border-accent/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Current Staking</span>
                  <span className="text-accent font-bold">0.0 CCS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>APY:</span>
                  <span className="text-accent">5.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Rewards Earned:</span>
                  <span className="text-accent">0.0 CCS</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="border-accent/50 text-accent hover:bg-accent/10 bg-transparent">
                  Stake More
                </Button>
                <Button variant="outline" className="border-accent/50 text-accent hover:bg-accent/10 bg-transparent">
                  Unstake
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Minimum stake: 10 CCS</p>
                <p>Unstaking period: 7 days</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
