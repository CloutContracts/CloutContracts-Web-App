import { type NextRequest, NextResponse } from "next/server"

// CloutContracts RPC Configuration
const CLOUT_CONTRACTS_RPC_URL = process.env.CLOUT_CONTRACTS_RPC_URL || "https://evm.cloutcontracts.net"
const CHAIN_ID = 1337 // CloutContracts chain ID

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(CLOUT_CONTRACTS_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CLOUT_CONTRACTS_API_KEY}`,
      },
      body: JSON.stringify({
        ...body,
        chainId: CHAIN_ID,
      }),
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("RPC Error:", error)
    return NextResponse.json({ error: "RPC request failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    chainId: CHAIN_ID,
    networkName: "CloutContracts",
    rpcUrl: CLOUT_CONTRACTS_RPC_URL,
    blockExplorer: "https://explorer.cloutcontracts.net",
    nativeCurrency: {
      name: "CloutContracts",
      symbol: "CCS",
      decimals: 18,
    },
  })
}
