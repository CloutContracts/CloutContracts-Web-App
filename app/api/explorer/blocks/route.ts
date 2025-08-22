import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Fetch latest blocks from RPC
    const rpcUrl = process.env.CLOUT_CONTRACTS_RPC_URL
    if (!rpcUrl) {
      return NextResponse.json({ error: "RPC URL not configured" }, { status: 500 })
    }

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
    })

    const { result: latestBlockHex } = await response.json()
    const latestBlock = Number.parseInt(latestBlockHex, 16)

    // Fetch multiple blocks
    const blocks = []
    const startBlock = Math.max(0, latestBlock - (page - 1) * limit)

    for (let i = 0; i < limit && startBlock - i >= 0; i++) {
      const blockNumber = startBlock - i
      const blockResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBlockByNumber",
          params: [`0x${blockNumber.toString(16)}`, true],
          id: blockNumber,
        }),
      })

      const { result: block } = await blockResponse.json()
      if (block) {
        blocks.push({
          number: Number.parseInt(block.number, 16),
          hash: block.hash,
          timestamp: Number.parseInt(block.timestamp, 16),
          transactions: block.transactions.length,
          gasUsed: Number.parseInt(block.gasUsed, 16),
          gasLimit: Number.parseInt(block.gasLimit, 16),
          miner: block.miner,
          size: Number.parseInt(block.size, 16),
        })
      }
    }

    return NextResponse.json({
      blocks,
      pagination: {
        page,
        limit,
        total: latestBlock + 1,
        hasNext: startBlock - limit >= 0,
      },
    })
  } catch (error) {
    console.error("Block explorer error:", error)
    return NextResponse.json({ error: "Failed to fetch blocks" }, { status: 500 })
  }
}
