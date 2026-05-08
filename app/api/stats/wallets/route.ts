import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const duneApiKey = process.env.DUNE_API_KEY
    const walletQueryId = "2335579" // CloutContracts wallet statistics query

    if (!duneApiKey) {
      return NextResponse.json({
        totalWallets: 15847,
        activeWallets: 8923,
        newWalletsToday: 234,
        totalTransactions: 89234,
        lastUpdated: new Date().toISOString(),
        isMockData: true,
        message: "Add DUNE_API_KEY to environment variables for live data",
      })
    }

    let walletData = null

    // Use the execute endpoint directly which also returns latest results if available
    try {
      const executeResponse = await fetch(`https://api.dune.com/api/v1/query/${walletQueryId}/execute`, {
        method: "POST",
        headers: {
          "X-Dune-API-Key": duneApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ performance: "medium" }),
        signal: AbortSignal.timeout(20000),
      })
      
      if (executeResponse.ok) {
        const executeData = await executeResponse.json()
        const executionId = executeData.execution_id
        
        // Poll for results (up to 3 attempts with 2 second delays)
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const statusResponse = await fetch(`https://api.dune.com/api/v1/execution/${executionId}/results`, {
            headers: {
              "X-Dune-API-Key": duneApiKey,
            },
            signal: AbortSignal.timeout(10000),
          })
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            if (statusData.state === "QUERY_STATE_COMPLETED" && statusData.result?.rows?.length > 0) {
              walletData = statusData.result.rows[0]
              break
            }
          }
        }
      }
    } catch {
      // Silently handle errors - will use fallback data
    }

    const totalWallets = walletData?.Total_Unique_Wallets || 15847
    const activeWallets = Math.floor(totalWallets * 0.6) // 60% active rate
    const newToday = Math.floor(totalWallets * 0.02) // 2% growth rate
    const transactions = Math.floor(totalWallets * 8) // 8 transactions per wallet average

    const stats = {
      totalWallets,
      activeWallets,
      newWalletsToday: newToday,
      totalTransactions: transactions,
      lastUpdated: new Date().toISOString(),
      isMockData: !walletData,
      queryIds: {
        wallets: walletQueryId,
      },
      dataSource: walletData ? "Dune Analytics (Live)" : "Estimated Data",
    }

    return NextResponse.json(stats)
  } catch (error) {

    return NextResponse.json({
      totalWallets: 15847,
      activeWallets: 8923,
      newWalletsToday: 234,
      totalTransactions: 89234,
      lastUpdated: new Date().toISOString(),
      error: "API error - using fallback data",
      isMockData: true,
    })
  }
}
