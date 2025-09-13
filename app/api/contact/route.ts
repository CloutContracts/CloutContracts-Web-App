import { type NextRequest, NextResponse } from "next/server"
import { sendEmail, createContactEmailTemplate } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { name, email, message, ethereumAddress } = await request.json()

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    if (ethereumAddress && ethereumAddress.trim()) {
      const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
      if (!ethAddressRegex.test(ethereumAddress.trim())) {
        return NextResponse.json({ error: "Invalid Ethereum address format" }, { status: 400 })
      }
    }

    const { html, text } = createContactEmailTemplate(name, email, message, ethereumAddress)

    // Send email to admin
    const result = await sendEmail({
      to: "andrew@decentralized-internet.org",
      subject: `New Contact Form Submission from ${name}`,
      text,
      html,
    })

    if (result.success) {
      return NextResponse.json({
        message: "Email sent successfully",
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json({ error: "Failed to send email", details: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Contact form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
