import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // Create transporter using environment variables
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "25"),
      secure: false, // Port 25 typically doesn't use TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Additional options for port 25
      requireTLS: false,
      tls: {
        rejectUnauthorized: false,
      },
    })

    console.log("[v0] SMTP Configuration:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      hasPassword: !!process.env.SMTP_PASS,
    })

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || "andrew@decentralized-internet.org",
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    console.log("[v0] Email sent successfully:", info.messageId)

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("[v0] Email sending failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export function createContactEmailTemplate(
  name: string,
  email: string,
  message: string,
  ethereumAddress?: string,
): { html: string; text: string } {
  const text = `
New Contact Form Submission

Name: ${name}
Email: ${email}
${ethereumAddress ? `Ethereum Address: ${ethereumAddress}` : ""}

Message:
${message}

---
Sent from CloutContracts Contact Form
  `.trim()

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Form Submission</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #475569; }
        .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e2e8f0; }
        .message { min-height: 100px; }
        .footer { background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">New Contact Form Submission</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">CloutContracts Platform</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Name:</div>
            <div class="value">${name}</div>
          </div>
          <div class="field">
            <div class="label">Email:</div>
            <div class="value">${email}</div>
          </div>
          ${
            ethereumAddress
              ? `
          <div class="field">
            <div class="label">Ethereum Address:</div>
            <div class="value" style="font-family: monospace; font-size: 14px;">${ethereumAddress}</div>
          </div>
          `
              : ""
          }
          <div class="field">
            <div class="label">Message:</div>
            <div class="value message">${message.replace(/\n/g, "<br>")}</div>
          </div>
        </div>
        <div class="footer">
          Sent from CloutContracts Contact Form<br>
          <a href="https://cloutcontracts.net" style="color: #06b6d4;">cloutcontracts.net</a>
        </div>
      </div>
    </body>
    </html>
  `

  return { html, text }
}
