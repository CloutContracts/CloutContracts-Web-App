"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MetaMaskAuthProps {
  onConnect: (account: string) => void
  onDisconnect: () => void
  account: string | null
  isConnected: boolean
}

export function MetaMaskAuth({ onConnect, onDisconnect, account, isConnected }: MetaMaskAuthProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to continue",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length > 0) {
        onConnect(accounts[0])
        toast({
          title: "Wallet connected",
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        })
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    onDisconnect()
    toast({
      title: "Wallet disconnected",
      description: "Successfully disconnected from MetaMask",
    })
  }

  if (isConnected && account) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-accent/10 text-accent">
          <Wallet className="w-3 h-3 mr-1" />
          {account.slice(0, 6)}...{account.slice(-4)}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnectWallet}
          className="text-muted-foreground hover:text-foreground bg-transparent"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isConnecting ? "Connecting..." : "Connect MetaMask"}
    </Button>
  )
}
