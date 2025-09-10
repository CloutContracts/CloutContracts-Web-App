"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, LogOut, Shield, Zap, WifiOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cacheDB } from "@/lib/cache-db"

const ADMIN_ADDRESS = "0x0D81d9E21BD7C5bB095535624DcB0759E64B3899"
const TOKEN_OWNER_ADDRESS = "0x0D81d9E21BD7C5bB095535624DcB0759E64B3899"

const CLOUT_CONTRACTS_NETWORK = {
  chainId: "0x539", // 1337 in hex
  chainName: "CloutContracts Network",
  nativeCurrency: {
    name: "CloutContracts",
    symbol: "CCS",
    decimals: 18,
  },
  rpcUrls: ["https://evm.cloutcontracts.net"],
  blockExplorerUrls: ["https://explorer.cloutcontracts.net"],
}

interface AuthContextType {
  account: string | null
  isConnected: boolean
  isAdmin: boolean
  authMethod: "metamask" | "bitbadges" | null
  isOffline: boolean
  connectMetaMask: () => Promise<void>
  connectBitBadges: () => Promise<void>
  disconnect: () => void
  deployContract: (bytecode: string, constructorArgs?: any[]) => Promise<string>
  sendTransaction: (to: string, data: string, value?: string) => Promise<string>
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
  const [isOffline, setIsOffline] = useState(false)
  const { toast } = useToast()

  const isAdmin = account?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()

  useEffect(() => {
    checkConnection()

    const handleOnline = () => {
      setIsOffline(false)
      // Restore cached auth state when coming back online
      const cachedAuth = cacheDB.getOfflineData("auth-state")
      if (cachedAuth && cachedAuth.account) {
        setAccount(cachedAuth.account)
        setIsConnected(cachedAuth.isConnected)
        setAuthMethod(cachedAuth.authMethod)
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
      // Cache current auth state for offline use
      if (account) {
        cacheDB.setOfflineData("auth-state", {
          account,
          isConnected,
          authMethod,
        })
      }
    }

    // Set initial offline state
    setIsOffline(!navigator.onLine)

    // Listen for online/offline events
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Listen for account changes
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [account, isConnected, authMethod])

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect()
    } else if (accounts[0] !== account) {
      setAccount(accounts[0])
      cacheDB.setOfflineData("auth-state", {
        account: accounts[0],
        isConnected: true,
        authMethod,
      })
      toast({
        title: "Account changed",
        description: `Switched to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      })
    }
  }

  const handleChainChanged = (chainId: string) => {
    // Reload the page when chain changes to avoid state issues
    window.location.reload()
  }

  const checkConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: "eth_chainId" })
          if (chainId === CLOUT_CONTRACTS_NETWORK.chainId) {
            setAccount(accounts[0])
            setIsConnected(true)
            setAuthMethod("metamask")
          }
        }
      } catch (error) {
        console.error("Error checking connection:", error)
        const cachedAuth = cacheDB.getOfflineData("auth-state")
        if (cachedAuth && cachedAuth.account) {
          setAccount(cachedAuth.account)
          setIsConnected(cachedAuth.isConnected)
          setAuthMethod(cachedAuth.authMethod)
        }
      }
    }
  }

  const connectMetaMask = async () => {
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
      console.log("[v0] Adding CloutContracts network to MetaMask")

      // Add CloutContracts network to MetaMask
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [CLOUT_CONTRACTS_NETWORK],
        })
      } catch (addError: any) {
        // Network might already exist, try to switch to it
        if (addError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: CLOUT_CONTRACTS_NETWORK.chainId }],
          })
        } else {
          throw addError
        }
      }

      console.log("[v0] Requesting MetaMask accounts")
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      console.log("[v0] Accounts received:", accounts)

      if (accounts.length > 0) {
        setAccount(accounts[0])
        setIsConnected(true)
        setAuthMethod("metamask")

        cacheDB.setOfflineData("auth-state", {
          account: accounts[0],
          isConnected: true,
          authMethod: "metamask",
        })

        const isAdminUser = accounts[0].toLowerCase() === ADMIN_ADDRESS.toLowerCase()
        console.log("[v0] Connection successful, isAdmin:", isAdminUser)

        toast({
          title: "Wallet connected",
          description: `Connected to CloutContracts Network: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        })
      }
    } catch (error: any) {
      console.error("[v0] Error connecting wallet:", error)
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to CloutContracts Network",
        variant: "destructive",
      })
    }
  }

  const connectBitBadges = async () => {
    console.log("[v0] BitBadges button clicked - showing coming soon message")
    setShowComingSoon(true)
    console.log("[v0] Coming soon modal should now be visible")
    return
  }

  const deployContract = async (bytecode: string, constructorArgs: any[] = []): Promise<string> => {
    if (!account || authMethod !== "metamask") {
      throw new Error("MetaMask not connected")
    }

    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask not available")
    }

    try {
      console.log("[v0] Deploying contract via MetaMask")

      // Ensure we're on the correct network
      const chainId = await window.ethereum.request({ method: "eth_chainId" })
      if (chainId !== CLOUT_CONTRACTS_NETWORK.chainId) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CLOUT_CONTRACTS_NETWORK.chainId }],
        })
      }

      // Estimate gas for deployment
      const gasEstimate = await window.ethereum.request({
        method: "eth_estimateGas",
        params: [
          {
            from: account,
            data: bytecode,
          },
        ],
      })

      // Send deployment transaction
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: account,
            data: bytecode,
            gas: gasEstimate,
          },
        ],
      })

      console.log("[v0] Deployment transaction sent:", txHash)

      // Wait for transaction receipt to get contract address
      let receipt = null
      let attempts = 0
      const maxAttempts = 30

      while (!receipt && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        try {
          receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          })
        } catch (error) {
          console.log("[v0] Waiting for transaction receipt...")
        }
        attempts++
      }

      if (!receipt) {
        throw new Error("Transaction receipt not found after 60 seconds")
      }

      if (receipt.status === "0x0") {
        throw new Error("Transaction failed")
      }

      console.log("[v0] Contract deployed at:", receipt.contractAddress)

      cacheDB.cacheDeployment(
        bytecode.slice(0, 32), // Use first 32 chars as hash
        receipt.contractAddress,
        txHash,
      )

      return receipt.contractAddress
    } catch (error: any) {
      console.error("[v0] Contract deployment error:", error)
      throw new Error(`Deployment failed: ${error.message}`)
    }
  }

  const sendTransaction = async (to: string, data: string, value = "0x0"): Promise<string> => {
    if (!account || authMethod !== "metamask") {
      throw new Error("MetaMask not connected")
    }

    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask not available")
    }

    try {
      console.log("[v0] Sending transaction via MetaMask")

      // Ensure we're on the correct network
      const chainId = await window.ethereum.request({ method: "eth_chainId" })
      if (chainId !== CLOUT_CONTRACTS_NETWORK.chainId) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CLOUT_CONTRACTS_NETWORK.chainId }],
        })
      }

      // Estimate gas
      const gasEstimate = await window.ethereum.request({
        method: "eth_estimateGas",
        params: [
          {
            from: account,
            to,
            data,
            value,
          },
        ],
      })

      // Send transaction
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: account,
            to,
            data,
            value,
            gas: gasEstimate,
          },
        ],
      })

      console.log("[v0] Transaction sent:", txHash)
      return txHash
    } catch (error: any) {
      console.error("[v0] Transaction error:", error)
      throw new Error(`Transaction failed: ${error.message}`)
    }
  }

  const disconnect = () => {
    setAccount(null)
    setIsConnected(false)
    setAuthMethod(null)

    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("cachedb:auth-state")
    }

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
        isOffline,
        connectMetaMask,
        connectBitBadges,
        disconnect,
        deployContract,
        sendTransaction,
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
  const { account, isConnected, isAdmin, authMethod, isOffline, connectMetaMask, connectBitBadges, disconnect } =
    useAuth()

  if (isConnected && account) {
    return (
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {isOffline && (
          <Badge
            variant="secondary"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 px-2 sm:px-3 py-1 text-xs"
          >
            <WifiOff className="w-3 h-3 mr-1 sm:mr-1.5" />
            Offline
          </Badge>
        )}
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
