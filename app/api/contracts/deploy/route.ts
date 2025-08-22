import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { contractCode, constructorArgs, address } = await request.json()

    if (!contractCode || !address) {
      return NextResponse.json({ error: "Missing contract code or deployer address" }, { status: 400 })
    }

    const deploymentResponse = await fetch(`${process.env.CLOUT_CONTRACTS_RPC_URL}`, {
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
            from: address,
            data: contractCode,
            gas: "0x76c0", // 30400 gas
          },
        ],
        id: 1,
      }),
    })

    const deploymentResult = await deploymentResponse.json()

    if (deploymentResult.error) {
      return NextResponse.json({ error: deploymentResult.error.message }, { status: 400 })
    }

    // Get transaction receipt to get contract address
    const receiptResponse = await fetch(`${process.env.CLOUT_CONTRACTS_RPC_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CLOUT_CONTRACTS_API_KEY}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionReceipt",
        params: [deploymentResult.result],
        id: 2,
      }),
    })

    const receipt = await receiptResponse.json()

    return NextResponse.json({
      success: true,
      contractAddress: receipt.result?.contractAddress,
      transactionHash: deploymentResult.result,
      gasUsed: receipt.result?.gasUsed,
    })
  } catch (error) {
    console.error("Contract deployment error:", error)
    return NextResponse.json({ error: "Contract deployment failed" }, { status: 500 })
  }
}
