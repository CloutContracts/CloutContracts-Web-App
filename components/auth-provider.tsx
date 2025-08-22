"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, LogOut, Shield, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const ADMIN_ADDRESS = "0x0D81d9E21BD7C5bB095535624DcB0759E64B3899"
const TOKEN_OWNER_ADDRESS = "0x0D81d9E21BD7C5bB095535624DcB0759E64B3899"

interface AuthContextType {
  account: string | null
  isConnected: boolean
  isAdmin: boolean
  authMethod: "metamask" | "bitbadges" | null
  connectMetaMask: () => Promise<void>
  connectBitBadges: () => Promise<void>
  disconnect: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [authMethod, setAuthMethod] = useState<"metamask" | "bitbadges" | null>(null)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const { toast } = useToast()

  const isAdmin = account?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          await verifyAuthentication(accounts[0], "metamask")
        }
      } catch (error) {
        console.error("Error checking connection:", error)
      }
    }
  }

  const verifyAuthentication = async (address: string, method: "metamask" | "bitbadges") => {
    try {
      console.log("[v0] Starting authentication verification for:", address, method)
      const message = `Sign this message to authenticate with CloutContracts: ${Date.now()}`
      let signature = ""

      if (method === "metamask" && window.ethereum) {
        console.log("[v0] Requesting signature from MetaMask")
        signature = await window.ethereum.request({
          method: "personal_sign",
          params: [message, address],
        })
        console.log("[v0] Signature received:", signature.slice(0, 10) + "...")
      }

      console.log("[v0] Sending verification request to API")
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          signature,
          message,
        }),
      })

      const result = await response.json()
      console.log("[v0] API response:", result)

      if (response.ok && result.success) {
        console.log("[v0] Authentication successful")
        setAccount(address)
        setIsConnected(true)
        setAuthMethod(method)
        return true
      } else {
        throw new Error(result.error || "Authentication failed")
      }
    } catch (error: any) {
      console.error("[v0] Authentication error:", error)
      return false
    }
  }

  const connectMetaMask = async () => {
    console.log("[v0] MetaMask button clicked - showing coming soon message")

    setShowComingSoon(true)

    console.log("[v0] Coming soon modal should now be visible")
    return

    // Original connection code commented out for demo
    /*
    if (typeof window.ethereum === "undefined") {
      console.log("[v0] MetaMask not detected")
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to continue",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("[v0] Requesting MetaMask accounts")
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      console.log("[v0] Accounts received:", accounts)

      if (accounts.length > 0) {
        console.log("[v0] Attempting to verify authentication")
        const success = await verifyAuthentication(accounts[0], "metamask")

        if (success) {
          const isAdminUser = accounts[0].toLowerCase() === ADMIN_ADDRESS.toLowerCase()
          console.log("[v0] Connection successful, isAdmin:", isAdminUser)

          toast({
            title: "Wallet connected",
            description: `Connected as ${isAdminUser ? "Admin" : "User"}: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          })
        } else {
          console.log("[v0] Authentication verification failed")
          toast({
            title: "Authentication failed",
            description: "Failed to verify wallet signature",
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      console.error("[v0] Error connecting wallet:", error)
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    }
    */
  }

  const connectBitBadges = async () => {
    console.log("[v0] BitBadges button clicked - showing coming soon message")

    setShowComingSoon(true)

    console.log("[v0] Coming soon modal should now be visible")
    return

    // Original connection code commented out for demo
    /*
    try {
      const badgeId = "clout-contracts-access" // This would be configured

      const response = await fetch("/api/auth/bitbadges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          badgeId,
          address: account, // This would come from BitBadges SDK
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setAccount(result.address)
        setIsConnected(true)
        setAuthMethod("bitbadges")

        toast({
          title: "BitBadges connected",
          description: `Connected via BitBadges: ${result.address.slice(0, 6)}...${result.address.slice(-4)}`,
        })
      } else {
        throw new Error(result.error || "BitBadges authentication failed")
      }
    } catch (error: any) {
      toast({
        title: "BitBadges connection failed",
        description: error.message || "Failed to connect with BitBadges",
        variant: "destructive",
      })
    }
    */
  }

  const disconnect = () => {
    setAccount(null)
    setIsConnected(false)
    setAuthMethod(null)
    toast({
      title: "Disconnected",
      description: "Successfully disconnected from wallet",
    })
  }

  return (
    <AuthContext.Provider
      value={{
        account,
        isConnected,
        isAdmin,
        authMethod,
        connectMetaMask,
        connectBitBadges,
        disconnect,
      }}
    >
      {children}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center space-y-4">
              <div className="text-4xl">🚀</div>
              <h3 className="text-xl font-semibold text-foreground">Coming Soon</h3>
              <p className="text-muted-foreground">
                This is a demo launch page, but the actual deployment is a work in progress for the new CloutContracts
                website and web app. Stay tuned by subscribing to the Newsletter!
              </p>
              <Button onClick={() => setShowComingSoon(false)} className="w-full">
                Got it!
              </Button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}

export function AuthButtons() {
  const { account, isConnected, isAdmin, authMethod, connectMetaMask, connectBitBadges, disconnect } = useAuth()

  if (isConnected && account) {
    return (
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {isAdmin && (
          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 px-2 sm:px-3 py-1 text-xs">
            <Shield className="w-3 h-3 mr-1 sm:mr-1.5" />
            Admin
          </Badge>
        )}
        <Badge variant="outline" className="bg-card/30 border-border/30 px-2 sm:px-3 py-1 text-xs">
          <Wallet className="w-3 h-3 mr-1 sm:mr-1.5" />
          {account.slice(0, 6)}...{account.slice(-4)}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnect}
          className="text-muted-foreground hover:text-foreground h-8 px-2 sm:px-3"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      <Button
        onClick={connectMetaMask}
        className="bg-foreground text-background hover:bg-foreground/90 border-0 px-4 sm:px-6 py-2 h-9 sm:h-10 font-medium text-sm"
      >
        <Wallet className="w-4 h-4 mr-1 sm:mr-2" />
        MetaMask
      </Button>
      <Button
        onClick={connectBitBadges}
        variant="outline"
        className="border-border/50 text-foreground hover:bg-muted/50 bg-transparent px-4 sm:px-6 py-2 h-9 sm:h-10 font-medium text-sm"
      >
        <Zap className="w-4 h-4 mr-1 sm:mr-2" />
        BitBadges
      </Button>
    </div>
  )
}
