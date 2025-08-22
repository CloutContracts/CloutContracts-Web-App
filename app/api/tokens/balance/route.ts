import { type NextRequest, NextResponse } from "next/server"

const CCS_TOKEN_CONTRACT = process.env.CCS_TOKEN_CONTRACT || "0x..." // Real CCS token contract address
const TOKEN_OWNER_ADDRESS = "0x0D81d9E21BD7C5bB095535624DcB0759E64B3899"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "Address parameter required" }, { status: 400 })
    }

    const balanceResponse = await fetch(`${process.env.CLOUT_CONTRACTS_RPC_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CLOUT_CONTRACTS_API_KEY}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            to: CCS_TOKEN_CONTRACT,
            data: `0x70a08231000000000000000000000000${address.slice(2)}`, // balanceOf(address)
          },
          "latest",
        ],
        id: 1,
      }),
    })

    const balanceResult = await balanceResponse.json()
    const balance = Number.parseInt(balanceResult.result, 16) / Math.pow(10, 18) // Convert from wei

    const isOwner = address.toLowerCase() === TOKEN_OWNER_ADDRESS.toLowerCase()

    return NextResponse.json({
      address,
      balance: balance.toString(),
      isOwner,
      tokenContract: CCS_TOKEN_CONTRACT,
    })
  } catch (error) {
    console.error("Balance query error:", error)
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}
