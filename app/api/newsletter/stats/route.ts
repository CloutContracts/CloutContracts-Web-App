import { NextResponse } from "next/server"
import { NewsletterDB } from "@/lib/newsletter-db"

export async function GET() {
  try {
    const totalSubscribers = await NewsletterDB.getSubscriberCount()
    const allSubscribers = await NewsletterDB.getAllSubscribers()

    // Calculate some basic stats
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recentSubscribers = allSubscribers.filter((sub) => new Date(sub.subscribedAt) >= thirtyDaysAgo).length

    return NextResponse.json({
      totalSubscribers,
      recentSubscribers,
      lastUpdated: new Date().toISOString(),
      growthRate: allSubscribers.length > 0 ? Math.round((recentSubscribers / totalSubscribers) * 100) : 0,
    })
  } catch (error) {
    console.error("[v0] Error fetching newsletter stats:", error)
    return NextResponse.json({ error: "Failed to fetch newsletter statistics" }, { status: 500 })
  }
}
