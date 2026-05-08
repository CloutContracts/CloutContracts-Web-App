import { type NextRequest, NextResponse } from "next/server"
import { NewsletterDB } from "@/lib/newsletter-db"
import crypto from "crypto"

// Hash IP address for privacy-preserving duplicate detection
function hashIpAddress(ip: string): string {
  // Use SHA-256 with a salt to create a one-way hash
  // The salt prevents rainbow table attacks while still allowing duplicate detection
  const salt = process.env.IP_HASH_SALT || "cloutcontracts-newsletter-2024"
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, ethereumAddress, phoneNumber, countryCode } = await request.json()

    // Get IP address from request headers and hash it for privacy
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const rawIp = forwardedFor?.split(",")[0]?.trim() || realIp || ""
    const ipHash = rawIp ? hashIpAddress(rawIp) : ""

    if (!name || !email || !ethereumAddress || !phoneNumber || !countryCode) {
      return NextResponse.json({ error: "Name, email, Ethereum address, and phone number are required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
    if (!ethAddressRegex.test(ethereumAddress)) {
      return NextResponse.json({ error: "Please enter a valid Ethereum address" }, { status: 400 })
    }

    // Validate phone number (basic validation - digits only after country code)
    const phoneDigits = phoneNumber.replace(/\D/g, "")
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return NextResponse.json({ error: "Please enter a valid phone number" }, { status: 400 })
    }

    try {
      // Check if IP hash has already subscribed (privacy-preserving duplicate detection)
      if (ipHash) {
        const existingByIp = await NewsletterDB.getSubscriberByIpHash(ipHash)
        if (existingByIp) {
          return NextResponse.json({ error: "A subscription from this network already exists" }, { status: 409 })
        }
      }

      const subscriber = await NewsletterDB.addSubscriber({
        name,
        email,
        ethereumAddress,
        phoneNumber,
        countryCode,
        ipHash,
      })

      console.log("[v0] Newsletter subscription stored:", subscriber)

      // Email functionality (mocked for now)
      const emailData = {
        to: email,
        subject: "Welcome to CloutContracts Newsletter!",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">Welcome to CloutContracts!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for subscribing to our newsletter! You'll receive updates about:</p>
          <ul>
            <li>Latest smart contract templates</li>
            <li>Web3 development insights</li>
            <li>Platform updates and new features</li>
            <li>Community highlights</li>
          </ul>
          <p>Your registered Ethereum address: <code>${ethereumAddress}</code></p>
          <p>Stay tuned for exciting updates!</p>
          <p>Best regards,<br>The CloutContracts Team</p>
        </div>
      `,
      }

      console.log("[v0] Email would be sent:", emailData)

      return NextResponse.json({
        success: true,
        message: "Successfully subscribed to newsletter!",
        subscriberId: subscriber.id,
      })
    } catch (dbError: any) {
      if (dbError.message === "Email already subscribed") {
        return NextResponse.json({ error: "This email is already subscribed to our newsletter" }, { status: 409 })
      }
      throw dbError
    }
  } catch (error) {
    console.error("[v0] Newsletter subscription error:", error)
    return NextResponse.json({ error: "Failed to process subscription. Please try again." }, { status: 500 })
  }
}

export async function GET() {
  try {
    const count = await NewsletterDB.getSubscriberCount()
    const subscribers = await NewsletterDB.getAllSubscribers()

    return NextResponse.json({
      totalSubscribers: count,
      subscribers: subscribers.map((sub) => ({
        id: sub.id,
        name: sub.name,
        email: sub.email,
        subscribedAt: sub.subscribedAt,
        // Don't expose Ethereum addresses in public API
      })),
    })
  } catch (error) {
    console.error("[v0] Error fetching subscribers:", error)
    return NextResponse.json({ error: "Failed to fetch subscriber data" }, { status: 500 })
  }
}
