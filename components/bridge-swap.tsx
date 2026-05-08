"use client"

import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, AlertCircle, CheckCircle2, X, ArrowDownUp, Loader2 } from "lucide-react"
import {
  BNB_Swap_Contract,
  ETH_Swap_Contract,
  ETC_Swap_Contract,
  BRIDGE_RECIPIENT_ADDRESS,
  BRIDGE_API_URL,
  CCS_Bridge_Contract,
} from "@/lib/bridge-contracts"

interface Token {
  name: string
  symbol: string
  icon: string
  chainId: number
  contract: string
  networkName: string
  decimals: number
}

interface BridgeResult {
  success: boolean
  hash?: string
  message: string
}

const TOKENS: Token[] = [
  {
    name: "CCS on Ethereum",
    symbol: "ETH",
    icon: "/bridge/ETH.png",
    chainId: 1,
    contract: ETH_Swap_Contract,
    networkName: "Ethereum Mainnet",
    decimals: 0,
  },
  {
    name: "CCS on BNB Chain",
    symbol: "BNB",
    icon: "/bridge/BNB.png",
    chainId: 56,
    contract: BNB_Swap_Contract,
    networkName: "BNB Smart Chain",
    decimals: 0,
  },
  {
    name: "CCS on ETC",
    symbol: "ETC",
    icon: "/bridge/ETC.png",
    chainId: 61,
    contract: ETC_Swap_Contract,
    networkName: "Ethereum Classic",
    decimals: 0,
  },
]

// Defined outside component to avoid re-creation on every render
const NETWORK_CONFIGS: Record<number, any> = {
  1: {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://ethereum-rpc.publicnode.com"],
    blockExplorerUrls: ["https://etherscan.io"],
  },
  12: {
    chainId: "0xC",
    chainName: "CloutContracts Network",
    nativeCurrency: { name: "CCS", symbol: "CCS", decimals: 18 },
    rpcUrls: ["https://evm.cloutcontracts.net"],
    blockExplorerUrls: ["https://blocks.cloutcontracts.net"],
  },
  56: {
    chainId: "0x38",
    chainName: "BNB Smart Chain",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com"],
  },
  61: {
  chainId: "0x3d",
  chainName: "Ethereum Classic",
  nativeCurrency: { name: "ETC", symbol: "ETC", decimals: 18 },
  rpcUrls: ["https://etc.rivet.link", "https://besu-at.etc-network.info", "https://geth-at.etc-network.info", "https://0xrpc.io/etc"],
  blockExplorerUrls: ["https://blockscout.com/etc/mainnet"],
  },
}

const LIQUIDITY_RPCS: Record<number, { rpc: string[]; contract: string }> = {
  1: { rpc: ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org", "https://cloudflare-eth.com"], contract: ETH_Swap_Contract },
  56: { rpc: ["https://bsc-dataseed.binance.org", "https://bsc-dataseed1.defibit.io"], contract: BNB_Swap_Contract },
  61: { rpc: ["https://etc.rivet.link", "https://besu-at.etc-network.info", "https://geth-at.etc-network.info", "https://0xrpc.io/etc"], contract: ETC_Swap_Contract },
  12: { rpc: ["https://evm.cloutcontracts.net"], contract: CCS_Bridge_Contract },
}

const BALANCE_RPCS: Record<number, string[]> = {
  1: ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org", "https://cloudflare-eth.com"],
  56: ["https://bsc-dataseed.binance.org", "https://bsc-dataseed1.defibit.io"],
  61: ["https://etc.rivet.link", "https://besu-at.etc-network.info", "https://geth-at.etc-network.info", "https://0xrpc.io/etc"],
}

async function fetchNetworkLiquidity(chainId: number): Promise<string> {
  const config = LIQUIDITY_RPCS[chainId]
  if (!config) return "0"

  const balanceOfData = `0x70a08231${BRIDGE_RECIPIENT_ADDRESS.slice(2).toLowerCase().padStart(64, "0")}`

  for (const rpcUrl of config.rpc) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [{ to: config.contract, data: balanceOfData }, "latest"],
          id: 1,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const result = await response.json()

      // If ERC20 call fails on CCS mainnet, try native balance
      if (result.error && chainId === 12) {
        const nativeResponse = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getBalance",
            params: [BRIDGE_RECIPIENT_ADDRESS, "latest"],
            id: 1,
          }),
        })
        const nativeResult = await nativeResponse.json()
        if (nativeResult.result) {
          const balanceWei = BigInt(nativeResult.result || "0x0")
          const balanceTokens = balanceWei / BigInt(10 ** 18)
          return balanceTokens.toString()
        }
      }

      if (result.result && result.result !== "0x") {
        return BigInt(result.result || "0x0").toString()
      }
      return "0"
    } catch (err) {
      continue
    }
  }
  return "0"
}

async function fetchERC20Balance(userAddress: string, token: Token): Promise<string> {
  const rpcList = BALANCE_RPCS[token.chainId]
  if (!rpcList || rpcList.length === 0) return "0"

  const addressPadded = userAddress.slice(2).toLowerCase().padStart(64, "0")
  const balanceOfData = `0x70a08231${addressPadded}`

  for (const rpcUrl of rpcList) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [{ to: token.contract, data: balanceOfData }, "latest"],
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const result = await response.json()

      if (result.result && result.result !== "0x") {
        const balanceBigInt = BigInt(result.result || "0x0")
        if (token.decimals === 0) return balanceBigInt.toString()
        const divisor = BigInt(10 ** token.decimals)
        return (Number(balanceBigInt) / Number(divisor)).toFixed(2)
      }
    } catch (err) {
      continue
    }
  }
  return "0"
}

export function BridgeSwap() {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [selectedToken, setSelectedToken] = useState<Token>(TOKENS[0])
  const [inputValue, setInputValue] = useState("")
  const [tokenBalance, setTokenBalance] = useState("0")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingBalance, setIsFetchingBalance] = useState(false)
  const [isBridgeLoading, setIsBridgeLoading] = useState(false)
  const [showBridgePopup, setShowBridgePopup] = useState(false)
  const [bridgeResult, setBridgeResult] = useState<BridgeResult | null>(null)
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [currentChainId, setCurrentChainId] = useState<number | null>(null)
  const [operatorBalance, setOperatorBalance] = useState<string>("0")
  const [isFetchingOperatorBalance, setIsFetchingOperatorBalance] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isDropdownOpen])
  const [liquidityByNetwork, setLiquidityByNetwork] = useState<Record<number, string>>({
    1: "0",
    56: "0",
    61: "0",
    12: "0",
  })

  useEffect(() => {
    checkWalletConnection()
    loadLiquidity()

    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          setIsConnected(true)
        } else {
          setAccount(null)
          setIsConnected(false)
          setTokenBalance("0")
        }
      }

      const handleChainChanged = (chainId: string) => {
        const numericChainId = parseInt(chainId, 16)
        setCurrentChainId(numericChainId)
        // Sync the selected token to the new chain so the button doesn't ask to switch back
        const matchingToken = TOKENS.find((t) => t.chainId === numericChainId)
        if (matchingToken) setSelectedToken(matchingToken)
      }

      ethereum.on("accountsChanged", handleAccountsChanged)
      ethereum.on("chainChanged", handleChainChanged)

      return () => {
        ethereum.removeListener("accountsChanged", handleAccountsChanged)
        ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  useEffect(() => {
    if (account && isConnected) {
      loadTokenBalance(account, selectedToken)
    }
  }, [selectedToken, account, isConnected])

  const checkWalletConnection = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return
    try {
      const ethereum = (window as any).ethereum
      const accounts = await ethereum.request({ method: "eth_accounts" })
      const chainId = await ethereum.request({ method: "eth_chainId" })
      if (accounts.length > 0) {
        setAccount(accounts[0])
        setIsConnected(true)
        const numericChainId = parseInt(chainId, 16)
        setCurrentChainId(numericChainId)
        const matchingToken = TOKENS.find((t) => t.chainId === numericChainId)
        if (matchingToken) setSelectedToken(matchingToken)
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error)
    }
  }

  const loadLiquidity = async () => {
    setIsFetchingOperatorBalance(true)
    try {
      const [ethLiq, bnbLiq, etcLiq, ccsLiq] = await Promise.all([
        fetchNetworkLiquidity(1),
        fetchNetworkLiquidity(56),
        fetchNetworkLiquidity(61),
        fetchNetworkLiquidity(12),
      ])
      setLiquidityByNetwork({ 1: ethLiq, 56: bnbLiq, 61: etcLiq, 12: ccsLiq })
      setOperatorBalance(ccsLiq)
    } catch (err) {
      setOperatorBalance("0")
    } finally {
      setIsFetchingOperatorBalance(false)
    }
  }

  const loadTokenBalance = async (userAddress: string, token: Token) => {
    setIsFetchingBalance(true)
    try {
      const balance = await fetchERC20Balance(userAddress, token)
      setTokenBalance(balance)
    } catch (err) {
      setTokenBalance("0")
    } finally {
      setIsFetchingBalance(false)
    }
  }

  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setErrorMessage("No Web3 wallet detected. Please install MetaMask or another compatible wallet.")
      setShowErrorPopup(true)
      return
    }
    try {
      const ethereum = (window as any).ethereum
      const accounts = await ethereum.request({ method: "eth_requestAccounts" })
      const chainId = await ethereum.request({ method: "eth_chainId" })
      if (accounts.length > 0) {
        setAccount(accounts[0])
        setIsConnected(true)
        const numericChainId = parseInt(chainId, 16)
        setCurrentChainId(numericChainId)
        const matchingToken = TOKENS.find((t) => t.chainId === numericChainId) ?? selectedToken
        setSelectedToken(matchingToken)
        loadTokenBalance(accounts[0], matchingToken)
      }
    } catch (error: any) {
      if (error.code === 4001) {
        setErrorMessage("Connection rejected. Please approve the connection request in your wallet.")
      } else {
        setErrorMessage("Failed to connect wallet: " + (error.message || "Unknown error"))
      }
      setShowErrorPopup(true)
    }
  }

  const switchToNetwork = async (chainId: number): Promise<boolean> => {
    const ethereum = (window as any).ethereum
    if (!ethereum) throw new Error("No wallet detected")

    const targetChainId = `0x${chainId.toString(16)}`

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainId }],
      })
      const current = await ethereum.request({ method: "eth_chainId" })
      const currentNum = parseInt(current, 16)
      setCurrentChainId(currentNum)
      return currentNum === chainId
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.code === -32603 ||
        switchError.message?.includes("Unrecognized chain ID") ||
        switchError.message?.includes("wallet_addEthereumChain")) {
        const networkConfig = NETWORK_CONFIGS[chainId]
        if (networkConfig) {
          try {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [networkConfig],
            })
            setCurrentChainId(chainId)
            return true
          } catch (addError: any) {
            if (addError.code === 4001) throw new Error("User rejected adding network")
            if (addError.message?.includes("already exists") || addError.message?.includes("same RPC")) return true
            throw addError
          }
        }
        throw new Error(`Network configuration not found for chain ${chainId}`)
      }
      if (switchError.code === 4001) throw new Error("Network switch rejected by user")
      throw switchError
    }
  }

  const callBridgeAPI = async (txHash: string) => {
    try {
      setIsBridgeLoading(true)
      const requestBody = {
        To: account,
        Amount: inputValue,
        originChainId: selectedToken.chainId,
        txHash: txHash,
      }
      const response = await fetch(BRIDGE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
      const result = await response.json()

      if (result.success) {
        setBridgeResult({
          success: true,
          hash: result.hash || txHash,
          message: "Bridge transaction successful! Your CCS tokens will be transferred to the CloutContracts network. This may take a few minutes.",
        })
      } else {
        setBridgeResult({
          success: false,
          hash: txHash,
          message: `Bridge error: ${result.msg || result.error || "Unknown error"}. Your tokens were sent (tx: ${txHash.slice(0, 10)}...). Please contact support.`,
        })
      }
      setShowBridgePopup(true)
    } catch (apiError: any) {
      setBridgeResult({
        success: false,
        hash: txHash,
        message: `Bridge API error: ${apiError?.message || "Unknown error"}. Your tokens were sent (tx: ${txHash.slice(0, 10)}...). Please contact support with your transaction hash.`,
      })
      setShowBridgePopup(true)
    } finally {
      setIsBridgeLoading(false)
    }
  }

  const handleSwap = async () => {
    if (!inputValue || parseFloat(inputValue) <= 0) {
      setErrorMessage("Please enter a valid amount.")
      setShowErrorPopup(true)
      return
    }
    const amount = parseFloat(inputValue)
    if (amount > parseFloat(tokenBalance)) {
      setErrorMessage("Insufficient CCS balance on this network.")
      setShowErrorPopup(true)
      return
    }

    setIsLoading(true)
    try {
      const ethereum = (window as any).ethereum
      if (!ethereum) throw new Error("No wallet detected. Please install MetaMask.")

      const currentChain = await ethereum.request({ method: "eth_chainId" })
      const currentChainNum = parseInt(currentChain, 16)
      if (currentChainNum !== selectedToken.chainId) {
        throw new Error(`Please switch to ${selectedToken.networkName} first`)
      }

      const amountRaw = BigInt(Math.floor(amount))
      const amountHex = amountRaw.toString(16).padStart(64, "0")
      const recipientPadded = BRIDGE_RECIPIENT_ADDRESS.slice(2).toLowerCase().padStart(64, "0")
      const transferData = `0xa9059cbb${recipientPadded}${amountHex}`

      const txHash = await ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: account, to: selectedToken.contract, data: transferData }],
      })

      // Poll for receipt via direct RPC (not through MetaMask) so chain switches
      // in the wallet don't break receipt fetching for slow chains like ETC
      const isSlowChain = selectedToken.chainId === 61 // ETC
      const maxAttempts = isSlowChain ? 60 : 40
      const pollInterval = isSlowChain ? 5000 : 2000
      const chainRpcMap: Record<number, string[]> = {
        1:  ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org"],
        56: ["https://bsc-dataseed.binance.org", "https://bsc-dataseed1.defibit.io"],
        61: ["https://etc.rivet.link", "https://besu-at.etc-network.info", "https://geth-at.etc-network.info", "https://0xrpc.io/etc"],
      }
      const rpcList = chainRpcMap[selectedToken.chainId] || []

      const fetchReceipt = async (): Promise<any> => {
        // Try direct RPC first
        for (const rpcUrl of rpcList) {
          try {
            const res = await fetch(rpcUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [txHash] }),
            })
            const data = await res.json()
            if (data.result) return data.result
          } catch (e) {
            continue
          }
        }
        // Fallback to MetaMask
        return await ethereum.request({ method: "eth_getTransactionReceipt", params: [txHash] })
      }

      let receipt = null
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          receipt = await fetchReceipt()
          if (receipt) {
            if (receipt.status === "0x1") break
            else throw new Error("Transaction failed on source chain")
          }
        } catch (err) {
          if (receipt !== null) throw err
        }
        await new Promise((resolve) => setTimeout(resolve, pollInterval))
      }

      if (!receipt) {
        // Transaction is taking too long — still notify the bridge API so it can be processed manually
        await callBridgeAPI(txHash).catch(() => {})
        setBridgeResult({
          success: false,
          hash: txHash,
          message: `Transaction submitted but taking longer than expected. TX: ${txHash.slice(0, 10)}... — please contact support with this TX hash.`,
        })
        setShowBridgePopup(true)
        return
      }

      await callBridgeAPI(txHash)

      if (account) {
        setTimeout(() => loadTokenBalance(account, selectedToken), 3000)
      }
      setInputValue("")
    } catch (error: any) {
      let msg = "Transaction failed. Please try again."
      if (error.code === 4001 || error.message?.includes("rejected")) msg = "Transaction rejected by user."
      else if (error.message?.toLowerCase().includes("insufficient")) msg = "Insufficient balance."
      else if (error.message?.toLowerCase().includes("gas")) msg = "Transaction failed due to gas issues."
      else if (error.message) msg = error.message
      setErrorMessage(msg)
      setShowErrorPopup(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectOrSwap = async () => {
    if (!isConnected) {
      await connectWallet()
      return
    }
    if (currentChainId !== selectedToken.chainId) {
      setIsLoading(true)
      try {
        await switchToNetwork(selectedToken.chainId)
        if (typeof window !== "undefined" && (window as any).ethereum) {
          const chainId = await (window as any).ethereum.request({ method: "eth_chainId" })
          const numericChainId = parseInt(chainId, 16)
          setCurrentChainId(numericChainId)
          // Sync selectedToken to match the chain the user actually ended up on
          const matchingToken = TOKENS.find((t) => t.chainId === numericChainId)
          if (matchingToken) setSelectedToken(matchingToken)
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to switch network")
        setShowErrorPopup(true)
      } finally {
        setIsLoading(false)
      }
      return
    }
    await handleSwap()
  }

  const handleTokenSelect = (token: Token) => {
    setIsDropdownOpen(false)
    setSelectedToken(token)
    setTokenBalance("0")
    if (account) {
      loadTokenBalance(account, token)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d+$/.test(value)) {
      setInputValue(value)
    }
  }

  const needsNetworkSwitch = isConnected && currentChainId !== null && currentChainId !== selectedToken.chainId
  const onCorrectNetwork = isConnected && currentChainId === selectedToken.chainId
  const hasLiquidity = parseInt(operatorBalance) > 0
  const exceedsLiquidity = onCorrectNetwork && parseInt(inputValue || "0") > parseInt(operatorBalance)
  const isDisabled = isLoading || isBridgeLoading || (onCorrectNetwork && !hasLiquidity) || exceedsLiquidity

  const buttonLabel = isLoading
    ? "Processing..."
    : isBridgeLoading
    ? "Bridging to CloutContracts..."
    : !isConnected
    ? "Connect Wallet"
    : needsNetworkSwitch
    ? `Switch to ${selectedToken.networkName}`
    : !hasLiquidity
    ? "Bridge Unavailable (No Liquidity)"
    : exceedsLiquidity
    ? `Exceeds Liquidity (Max: ${parseInt(operatorBalance).toLocaleString()} CCS)`
    : "Bridge CCS Tokens"

  return (
    <>
      <Card className="w-full max-w-md mx-auto bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ArrowDownUp className="w-5 h-5 text-cyan-400" />
              Bridge CCS
            </CardTitle>
            <div className="text-right">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                Balance: {isFetchingBalance ? <Loader2 className="w-3 h-3 animate-spin" /> : tokenBalance}
              </div>
              <div className="text-xs text-right">
                {isFetchingOperatorBalance ? (
                  <span className="flex items-center justify-end gap-1 text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading liquidity...
                  </span>
                ) : (
                  <span className={hasLiquidity ? "text-green-500" : "text-red-500"}>
                    Mainnet Liquidity: {parseInt(operatorBalance).toLocaleString()} CCS
                  </span>
                )}
              </div>
              {isConnected && currentChainId && (
                <div className="text-xs">
                  {currentChainId === selectedToken.chainId ? (
                    <span className="text-green-500">Connected to {selectedToken.networkName}</span>
                  ) : (
                    <span className="text-amber-500">Switch to {selectedToken.networkName}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* From Input */}
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Input
                type="text"
                placeholder="0"
                value={inputValue}
                onChange={handleInputChange}
                className="flex-1 border-0 bg-transparent text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
              />
              {/* Custom dropdown — avoids CSP/eval issues from Radix animations */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-md border border-cyan-500/30 bg-background/50 px-3 py-2 text-sm font-medium hover:border-cyan-500/60 transition-colors"
                >
                  <Image
                    src={selectedToken.icon}
                    alt={selectedToken.symbol}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span>{selectedToken.symbol}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-md border border-border bg-popover shadow-lg py-1">
                    {TOKENS.map((token) => (
                      <button
                        key={token.symbol}
                        type="button"
                        onClick={() => handleTokenSelect(token)}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${selectedToken.symbol === token.symbol ? "bg-accent/50" : ""}`}
                      >
                        <Image
                          src={token.icon}
                          alt={token.symbol}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <span>{token.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center">
              <ArrowDownUp className="w-5 h-5 text-cyan-400" />
            </div>
          </div>

          {/* To Input (CCS Token) */}
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Input
                type="text"
                placeholder="0"
                value={inputValue}
                disabled
                className="flex-1 border-0 bg-transparent text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 p-0 disabled:opacity-70"
              />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-500/30 bg-background/50">
                <Image src="/bridge/cc.png" alt="CCS" width={24} height={24} className="rounded-full" />
                <span className="font-medium">CCS</span>
              </div>
            </div>
          </div>

          {/* Main Button */}
          <Button
            onClick={handleConnectOrSwap}
            disabled={isDisabled}
            className="w-full py-6 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 disabled:opacity-50"
          >
            {buttonLabel}
          </Button>

          {/* Liquidity Overview */}
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Bridge Liquidity by Network</p>
            {isFetchingOperatorBalance ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading liquidity...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {([
                  { label: "ETH", chainId: 1 },
                  { label: "BNB", chainId: 56 },
                  { label: "ETC", chainId: 61 },
                  { label: "Mainnet", chainId: 12 },
                ] as { label: string; chainId: number }[]).map(({ label, chainId }) => (
                  <div key={chainId} className="flex items-center justify-between px-2 py-1 rounded bg-background/50">
                    <span className="text-muted-foreground">{label}:</span>
                    <span className={parseInt(liquidityByNetwork[chainId]) > 0 ? "text-green-500" : "text-red-500"}>
                      {parseInt(liquidityByNetwork[chainId]).toLocaleString()} CCS
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* No Liquidity Warning */}
          {!hasLiquidity && !isFetchingOperatorBalance && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-sm text-red-400 font-medium mb-1">Bridge Currently Unavailable</p>
              <p className="text-xs text-red-400/80">
                The bridge has no mainnet liquidity. Send native CCS to the bridge operator on CloutContracts network:
              </p>
              <p className="text-xs text-red-400/80 font-mono mt-1 break-all">{BRIDGE_RECIPIENT_ADDRESS}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Or contact support on{" "}
                <a href="https://discord.gg/nuNTfQXBN6" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                  Discord
                </a>{" "}
                for assistance.
              </p>
            </div>
          )}

          {/* Info */}
          <div className="space-y-2">
            <p className="text-xs text-center text-muted-foreground">
              Bridge CCS tokens across Ethereum, BNB Chain, and Ethereum Classic networks
            </p>
            <p className="text-xs text-center text-amber-500/80">
              Use at your own risk. Always verify transactions before confirming.
            </p>
            <p className="text-xs text-center text-muted-foreground/70 italic">
              Note: MetaMask may display a very small number instead of the actual amount. This is a display issue only — the correct amount will be transferred.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bridge Result Popup */}
      {showBridgePopup && bridgeResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm bg-card border-border">
            <CardContent className="pt-6 text-center">
              <div className="mb-4">
                {bridgeResult.success ? (
                  <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
                ) : (
                  <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
                )}
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${bridgeResult.success ? "text-green-500" : "text-red-500"}`}>
                {bridgeResult.success ? "Bridge Successful!" : "Bridge Failed"}
              </h3>
              <p className="text-muted-foreground mb-4">{bridgeResult.message}</p>
              {bridgeResult.success && bridgeResult.hash && (
                <div className="bg-muted rounded-lg p-3 mb-4 text-xs break-all text-muted-foreground">
                  <strong>Transaction Hash:</strong>
                  <br />
                  {bridgeResult.hash}
                </div>
              )}
              <Button
                onClick={() => setShowBridgePopup(false)}
                className={`w-full ${bridgeResult.success ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm bg-card border-red-500/30">
            <CardContent className="pt-6 text-center">
              <div className="mb-4">
                <X className="w-16 h-16 mx-auto text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-red-500">Swap Failed</h3>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <div className="bg-muted rounded-lg p-3 mb-4 text-sm text-muted-foreground">
                <strong>Tip:</strong> Make sure you have enough tokens and gas fees to complete the transaction.
              </div>
              <Button onClick={() => setShowErrorPopup(false)} className="w-full bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
