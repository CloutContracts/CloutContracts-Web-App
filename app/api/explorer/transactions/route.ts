import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const blockNumber = searchParams.get("block")
    const txHash = searchParams.get("hash")

    const rpcUrl = process.env.CLOUT_CONTRACTS_RPC_URL
    if (!rpcUrl) {
      return NextResponse.json({ error: "RPC URL not configured" }, { status: 500 })
    }

    if (txHash) {
      // Get specific transaction
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getTransactionByHash",
          params: [txHash],
          id: 1,
        }),
      })

      const { result: tx } = await response.json()
      if (!tx) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
      }

      // Get transaction receipt
      const receiptResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getTransactionReceipt",
          params: [txHash],
          id: 2,
        }),
      })

      const { result: receipt } = await receiptResponse.json()

      return NextResponse.json({
        hash: tx.hash,
        blockNumber: Number.parseInt(tx.blockNumber, 16),
        from: tx.from,
        to: tx.to,
        value: Number.parseInt(tx.value, 16),
        gas: Number.parseInt(tx.gas, 16),
        gasPrice: Number.parseInt(tx.gasPrice, 16),
        gasUsed: receipt ? Number.parseInt(receipt.gasUsed, 16) : null,
        status: receipt ? Number.parseInt(receipt.status, 16) : null,
        nonce: Number.parseInt(tx.nonce, 16),
        input: tx.input,
      })
    }

    if (blockNumber) {
      // Get transactions for a specific block
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBlockByNumber",
          params: [`0x${Number.parseInt(blockNumber).toString(16)}`, true],
          id: 1,
        }),
      })

      const { result: block } = await response.json()
      if (!block) {
        return NextResponse.json({ error: "Block not found" }, { status: 404 })
      }

      const transactions = block.transactions.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: Number.parseInt(tx.value, 16),
        gas: Number.parseInt(tx.gas, 16),
        gasPrice: Number.parseInt(tx.gasPrice, 16),
      }))

      return NextResponse.json({ transactions })
    }

    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  } catch (error) {
    console.error("Transaction explorer error:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
