import { NextResponse } from "next/server"

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

export async function GET() {
  console.log("[v0] Multi-chain network stats API called")

  try {
    const networks: NetworkStats[] = []

    const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "YourApiKeyToken"
    const bscscanApiKey = process.env.BSCSCAN_API_KEY || "YourApiKeyToken"

    console.log("[v0] Etherscan API Key present:", !!etherscanApiKey)
    console.log("[v0] BSCScan API Key present:", !!bscscanApiKey)

    // Main Net (Ethereum) - Using Etherscan API only
    try {
      console.log("[v0] Fetching Main Net stats using Etherscan API")

      const tokenResponse = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=0x1da4858ad385cc377165a298cc2ce3fce0c5fd31&startblock=0&endblock=99999999&sort=asc&apikey=${etherscanApiKey}`,
      )
      const tokenData = await tokenResponse.json()
      console.log("[v0] Main Net Token API Response:", tokenData.status || tokenData.message)

      const rollupResponse = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=0x2C7716BDf98e181df4CF1b40aD7648A40EE813b9&startblock=0&endblock=99999999&sort=asc&apikey=${etherscanApiKey}`,
      )
      const rollupData = await rollupResponse.json()
      console.log("[v0] Main Net Rollup API Response:", rollupData.status || rollupData.message)

      const tokenApiKeyInvalid = tokenData.status === "0" || tokenData.message === "NOTOK"
      const rollupApiKeyInvalid = rollupData.status === "0" || rollupData.message === "NOTOK"

      if (tokenApiKeyInvalid) {
        console.log("[v0] Main Net Token API failed - likely invalid API key")
      }
      if (rollupApiKeyInvalid) {
        console.log("[v0] Main Net Rollup API failed - likely invalid API key")
      }

      const totalTxCount =
        tokenApiKeyInvalid || rollupApiKeyInvalid
          ? "N/A"
          : (tokenData.status === "1" && tokenData.result ? tokenData.result.length : 0) +
            (rollupData.status === "1" && rollupData.result ? rollupData.result.length : 0)

      networks.push({
        name: "Main Net (Ethereum)",
        chainId: "1",
        totalTransactions: totalTxCount,
        recentTransactions: tokenData.result?.slice(-5) || [],
        tokenAddress: "0x1da4858ad385cc377165a298cc2ce3fce0c5fd31",
        rollupAddress: "0x2C7716BDf98e181df4CF1b40aD7648A40EE813b9",
        lastUpdated: new Date().toISOString(),
        error: totalTxCount === "N/A" ? "Etherscan API key required for live data" : undefined,
      })
      console.log("[v0] Main Net stats - Total:", totalTxCount)
    } catch (error) {
      console.log("[v0] Main Net stats failed:", error)
      networks.push({
        name: "Main Net (Ethereum)",
        chainId: "1",
        totalTransactions: "N/A",
        recentTransactions: [],
        tokenAddress: "0x1da4858ad385cc377165a298cc2ce3fce0c5fd31",
        rollupAddress: "0x2C7716BDf98e181df4CF1b40aD7648A40EE813b9",
        lastUpdated: new Date().toISOString(),
        error: "Etherscan API key required for live data",
      })
    }

    // ETC Peg - Using exact Blockscout URLs provided
    try {
      console.log("[v0] Fetching ETC Peg stats")

      // Get token transactions
      const tokenResponse = await fetch(
        "https://blockscout.com/etc/mainnet/api?module=account&action=txlist&address=0x9186ff77866DfD1007429F552e48C6d1A927297A",
      )
      const tokenData = await tokenResponse.json()
      console.log("[v0] ETC Token API Response:", tokenData.status || tokenData.message)

      // Get rollup transactions
      const rollupResponse = await fetch(
        "https://blockscout.com/etc/mainnet/api?module=account&action=txlist&address=0x6f6ed4820E44128794D22eB0b8B5c035a8Eac4E6",
      )
      const rollupData = await rollupResponse.json()
      console.log("[v0] ETC Rollup API Response:", rollupData.status || rollupData.message)

      const tokenTxCount = tokenData.status === "1" && tokenData.result ? tokenData.result.length : 0
      const rollupTxCount = rollupData.status === "1" && rollupData.result ? rollupData.result.length : 0
      const totalTxCount = tokenTxCount + rollupTxCount

      const finalTxCount = totalTxCount === 0 ? "N/A" : totalTxCount

      networks.push({
        name: "The ETC Peg",
        chainId: "61",
        totalTransactions: finalTxCount,
        recentTransactions: tokenData.result?.slice(-5) || [],
        tokenAddress: "0x9186ff77866DfD1007429F552e48C6d1A927297A",
        rollupAddress: "0x6f6ed4820E44128794D22eB0b8B5c035a8Eac4E6",
        lastUpdated: new Date().toISOString(),
        error: finalTxCount === "N/A" ? "Blockscout API may be unavailable" : undefined,
      })
      console.log("[v0] ETC Peg stats - Total:", finalTxCount)
    } catch (error) {
      console.log("[v0] ETC Peg stats failed:", error)
      networks.push({
        name: "The ETC Peg",
        chainId: "61",
        totalTransactions: "N/A",
        recentTransactions: [],
        tokenAddress: "0x9186ff77866DfD1007429F552e48C6d1A927297A",
        rollupAddress: "0x6f6ed4820E44128794D22eB0b8B5c035a8Eac4E6",
        lastUpdated: new Date().toISOString(),
        error: "Failed to fetch data from Blockscout",
      })
    }

    // BNB Peg - Using exact BSCScan URLs provided
    try {
      console.log("[v0] Fetching BNB Peg stats")

      // Get token transactions
      const tokenResponse = await fetch(
        `https://api.bscscan.com/api?module=account&action=txlist&address=0x3e3B357061103DC040759aC7DceEaba9901043aD&startblock=1&endblock=99999999&sort=asc&apikey=${bscscanApiKey}`,
      )
      const tokenData = await tokenResponse.json()
      console.log("[v0] BNB Token API Response:", tokenData.status || tokenData.message)

      const tokenApiKeyInvalid = tokenData.status === "0" || tokenData.message === "NOTOK"
      if (tokenApiKeyInvalid) {
        console.log("[v0] BNB Token API failed - likely invalid API key")
      }

      // Get rollup transactions
      const rollupResponse = await fetch(
        `https://api.bscscan.com/api?module=account&action=txlist&address=0xABa46894aCaB62A47Ff28c0a69e6333B80425dA5&startblock=1&endblock=99999999&sort=asc&apikey=${bscscanApiKey}`,
      )
      const rollupData = await rollupResponse.json()
      console.log("[v0] BNB Rollup API Response:", rollupData.status || rollupData.message)

      const rollupApiKeyInvalid = rollupData.status === "0" || rollupData.message === "NOTOK"
      if (rollupApiKeyInvalid) {
        console.log("[v0] BNB Rollup API failed - likely invalid API key")
      }

      const totalTxCount =
        tokenApiKeyInvalid || rollupApiKeyInvalid
          ? "N/A"
          : (tokenData.status === "1" && tokenData.result ? tokenData.result.length : 0) +
            (rollupData.status === "1" && rollupData.result ? rollupData.result.length : 0)

      networks.push({
        name: "The BNB Peg",
        chainId: "56",
        totalTransactions: totalTxCount,
        recentTransactions: tokenData.result?.slice(-5) || [],
        tokenAddress: "0x3e3B357061103DC040759aC7DceEaba9901043aD",
        rollupAddress: "0xABa46894aCaB62A47Ff28c0a69e6333B80425dA5",
        lastUpdated: new Date().toISOString(),
        error: totalTxCount === "N/A" ? "API key required for BSCScan" : undefined,
      })
      console.log("[v0] BNB Peg stats - Total:", totalTxCount)
    } catch (error) {
      console.log("[v0] BNB Peg stats failed:", error)
      networks.push({
        name: "The BNB Peg",
        chainId: "56",
        totalTransactions: "N/A",
        recentTransactions: [],
        tokenAddress: "0x3e3B357061103DC040759aC7DceEaba9901043aD",
        rollupAddress: "0xABa46894aCaB62A47Ff28c0a69e6333B80425dA5",
        lastUpdated: new Date().toISOString(),
        error: "Failed to fetch data - API key required",
      })
    }

    const validTransactions = networks
      .map((n) => n.totalTransactions)
      .filter((tx): tx is number => typeof tx === "number")

    const totalTransactions =
      validTransactions.length === 0 ? "N/A" : validTransactions.reduce((sum, tx) => sum + tx, 0)

    const response: MultiChainStats = {
      networks,
      summary: {
        totalTransactions,
        totalNetworks: networks.length,
        lastUpdated: new Date().toISOString(),
      },
    }

    console.log("[v0] Multi-chain stats compiled successfully:", response.summary)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Error fetching multi-chain stats:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch network statistics",
        networks: [],
        summary: {
          totalTransactions: "N/A",
          totalNetworks: 0,
          lastUpdated: new Date().toISOString(),
        },
      },
      { status: 500 },
    )
  }
}
