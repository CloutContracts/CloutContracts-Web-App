import { type NextRequest, NextResponse } from "next/server"

const CCS_TOKEN_CONTRACT = process.env.CCS_TOKEN_CONTRACT || "0x..."

export async function POST(request: NextRequest) {
  try {
    const { from, to, amount, signature } = await request.json()

    if (!from || !to || !amount || !signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const transferData = `0xa9059cbb000000000000000000000000${to.slice(2)}${amount.toString(16).padStart(64, "0")}`

    const transferResponse = await fetch(`${process.env.CLOUT_CONTRACTS_RPC_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CLOUT_CONTRACTS_API_KEY}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [
          {
            from,
            to: CCS_TOKEN_CONTRACT,
            data: transferData,
            gas: "0x5208", // 21000 gas
          },
        ],
        id: 1,
      }),
    })

    const transferResult = await transferResponse.json()

    if (transferResult.error) {
      return NextResponse.json({ error: transferResult.error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      transactionHash: transferResult.result,
      from,
      to,
      amount,
    })
  } catch (error) {
    console.error("Transfer error:", error)
    return NextResponse.json({ error: "Token transfer failed" }, { status: 500 })
  }
}
