import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { badgeId, address } = await request.json()

    if (!badgeId || !address) {
      return NextResponse.json({ error: "Missing badge ID or address" }, { status: 400 })
    }

    const bitbadgesResponse = await fetch(`https://api.bitbadges.io/api/v0/badges/${badgeId}/owners`, {
      headers: {
        Authorization: `Bearer ${process.env.BITBADGES_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!bitbadgesResponse.ok) {
      return NextResponse.json({ error: "BitBadges verification failed" }, { status: 401 })
    }

    const badgeData = await bitbadgesResponse.json()
    const isOwner = badgeData.owners?.includes(address.toLowerCase())

    if (!isOwner) {
      return NextResponse.json({ error: "Address does not own required badge" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      address,
      badgeId,
      verified: true,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("BitBadges auth error:", error)
    return NextResponse.json({ error: "BitBadges authentication failed" }, { status: 500 })
  }
}
