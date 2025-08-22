import { type NextRequest, NextResponse } from "next/server"
import { verifyMessage } from "ethers"

const ADMIN_ADDRESS = "0x0D81d9E21BD7C5bB095535624DcB0759E64B3899"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Auth verification API called")
    const { address, signature, message } = await request.json()
    console.log("[v0] Received data:", { address, signature: signature?.slice(0, 10) + "...", message })

    if (!address || !signature || !message) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Attempting to verify message signature")
    const recoveredAddress = verifyMessage(message, signature)
    console.log("[v0] Recovered address:", recoveredAddress)
    console.log("[v0] Expected address:", address)

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      console.log("[v0] Address mismatch - signature invalid")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const isAdmin = address.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
    console.log("[v0] Verification successful, isAdmin:", isAdmin)

    return NextResponse.json({
      success: true,
      address,
      isAdmin,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("[v0] Auth verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
