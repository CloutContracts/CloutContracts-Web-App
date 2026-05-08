import { NextResponse } from "next/server"

interface MainnetStats {
  blockNumber: number
  totalTransactions: number
  gasPrice: string
  chainId: number
  networkName: string
  rpcUrl: string
  explorerUrl: string
  recentBlocks: {
    number: number
    hash: string
    timestamp: number
    transactionCount: number
    miner: string
    gasUsed: string
    gasLimit: string
  }[]
  lastUpdated: string
  error?: string
}

// Helper to make JSON-RPC calls with timeout
async function rpcCall(method: string, params: any[] = []) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    const response = await fetch("https://evm.cloutcontracts.net", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: 1,
      }),
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    if (data.error) {
      throw new Error(data.error.message || "RPC Error")
    }
    return data.result
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === "AbortError") {
      throw new Error("RPC request timeout")
    }
    throw error
  }
}

export async function GET() {
  try {
    // Fetch current block number
    const blockNumberHex = await rpcCall("eth_blockNumber")
    const blockNumber = parseInt(blockNumberHex, 16)

    // Fetch chain ID
    const chainIdHex = await rpcCall("eth_chainId")
    const chainId = parseInt(chainIdHex, 16)

    // Fetch gas price
    const gasPriceHex = await rpcCall("eth_gasPrice")
    const gasPriceGwei = (parseInt(gasPriceHex, 16) / 1e9).toFixed(2)

    // Fetch recent blocks (last 5)
    const recentBlocks = []
    let totalTransactions = 0

    for (let i = 0; i < 5; i++) {
      const blockNum = blockNumber - i
      if (blockNum < 0) break

      try {
        const block = await rpcCall("eth_getBlockByNumber", [`0x${blockNum.toString(16)}`, false])
        
        if (block) {
          const txCount = block.transactions?.length || 0
          totalTransactions += txCount

          recentBlocks.push({
            number: parseInt(block.number, 16),
            hash: block.hash,
            timestamp: parseInt(block.timestamp, 16),
            transactionCount: txCount,
            miner: block.miner,
            gasUsed: (parseInt(block.gasUsed, 16) / 1e6).toFixed(2) + "M",
            gasLimit: (parseInt(block.gasLimit, 16) / 1e6).toFixed(2) + "M",
          })
        }
      } catch (blockError) {
        // Skip this block if there's an error
      }
    }

    // Get total transaction count estimate by looking at recent blocks average
    const avgTxPerBlock = recentBlocks.length > 0 
      ? totalTransactions / recentBlocks.length 
      : 0
    const estimatedTotalTx = Math.round(avgTxPerBlock * blockNumber)

    const stats: MainnetStats = {
      blockNumber,
      totalTransactions: estimatedTotalTx,
      gasPrice: gasPriceGwei + " Gwei",
      chainId,
      networkName: "CloutContracts Mainnet",
      rpcUrl: "https://evm.cloutcontracts.net",
      explorerUrl: "https://blocks.cloutcontracts.net",
      recentBlocks,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    // Return fallback data with error flag - don't return 500 status
    // to allow the client to render something
    return NextResponse.json({
      blockNumber: 0,
      totalTransactions: 0,
      gasPrice: "-- Gwei",
      chainId: 12,
      networkName: "CloutContracts Mainnet",
      rpcUrl: "https://evm.cloutcontracts.net",
      explorerUrl: "https://blocks.cloutcontracts.net",
      recentBlocks: [],
      lastUpdated: new Date().toISOString(),
      error: "Unable to connect to RPC",
    })
  }
}
