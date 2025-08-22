import { type NextRequest, NextResponse } from "next/server"

const CONTRACT_ADDRESS = "0x1da4858ad385cc377165a298cc2ce3fce0c5fd31"
const ADMIN_ADDRESS = "0x0d81d9e21bd7c5bb095535624dcb0759e64b3899"

// Official contract ABI from CloutContracts repository
const CONTRACT_ABI = [
  { inputs: [], payable: false, stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "address", name: "spender", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    constant: true,
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
]

export async function GET(request: NextRequest) {
  try {
    const rpcEndpoints = [
      "https://eth.llamarpc.com",
      "https://rpc.ankr.com/eth",
      "https://ethereum.publicnode.com",
      "https://cloudflare-eth.com",
      "https://eth-mainnet.public.blastapi.io",
    ]

    let lastError = null

    for (const rpcUrl of rpcEndpoints) {
      try {
        console.log(`[v0] Trying RPC endpoint: ${rpcUrl}`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        // Get admin balance using balanceOf function
        const balanceRequest = {
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: CONTRACT_ADDRESS,
              data: `0x70a08231000000000000000000000000${ADMIN_ADDRESS.slice(2).toLowerCase()}`,
            },
            "latest",
          ],
          id: 1,
        }

        // Get total supply
        const totalSupplyRequest = {
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: CONTRACT_ADDRESS,
              data: "0x18160ddd",
            },
            "latest",
          ],
          id: 2,
        }

        const [balanceResponse, totalSupplyResponse] = await Promise.all([
          fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(balanceRequest),
            signal: controller.signal,
          }),
          fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(totalSupplyRequest),
            signal: controller.signal,
          }),
        ])

        clearTimeout(timeoutId)

        if (!balanceResponse.ok || !totalSupplyResponse.ok) {
          console.log(`[v0] HTTP error for ${rpcUrl}: ${balanceResponse.status}, ${totalSupplyResponse.status}`)
          continue
        }

        const balanceResult = await balanceResponse.json()
        const totalSupplyResult = await totalSupplyResponse.json()

        console.log(`[v0] Balance result:`, balanceResult)
        console.log(`[v0] Total supply result:`, totalSupplyResult)

        if (balanceResult.error || totalSupplyResult.error) {
          console.log(`[v0] RPC error for ${rpcUrl}:`, balanceResult.error || totalSupplyResult.error)
          continue
        }

        const adminBalanceWei = BigInt(balanceResult.result || "0x0")
        const totalSupplyWei = BigInt(totalSupplyResult.result || "0x0")

        // Convert directly to numbers - these are token amounts, not wei
        const adminBalance = Number(adminBalanceWei)
        const totalSupply = Number(totalSupplyWei)

        console.log(`[v0] Calculated values - Total: ${totalSupply}, Admin: ${adminBalance}`)

        // Calculate circulating supply
        const circulatingSupply = Math.max(0, totalSupply - adminBalance)

        return NextResponse.json({
          success: true,
          totalSupply: totalSupply,
          adminBalance: adminBalance,
          circulatingSupply: circulatingSupply,
          adminAddress: ADMIN_ADDRESS,
          contractAddress: CONTRACT_ADDRESS,
          status: "Live data from blockchain",
          rpcEndpoint: rpcUrl,
        })
      } catch (error: any) {
        console.log(`[v0] Error with ${rpcUrl}:`, error.message)
        lastError = error
        continue
      }
    }

    throw new Error(`All RPC endpoints failed. Last error: ${lastError?.message}`)
  } catch (error: any) {
    console.error("[v0] Error calculating circulating supply:", error)

    const estimatedCirculating = 50000000 // Estimate 50M tokens circulating as fallback

    return NextResponse.json({
      success: false,
      error: error.message,
      totalSupply: 111000000,
      adminBalance: 61000000, // Estimated admin holdings
      circulatingSupply: estimatedCirculating,
      adminAddress: ADMIN_ADDRESS,
      contractAddress: CONTRACT_ADDRESS,
      status: "Using estimated fallback data - RPC unavailable",
    })
  }
}
