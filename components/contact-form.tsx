"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Send, CheckCircle, AlertCircle, Shield } from "lucide-react"

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    ethereumAddress: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [captchaValue, setCaptchaValue] = useState("")
  const [captchaQuestion, setCaptchaQuestion] = useState({ a: 0, b: 0, answer: 0 })

  useEffect(() => {
    generateCaptcha()
  }, [])

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 10) + 1
    const b = Math.floor(Math.random() * 10) + 1
    setCaptchaQuestion({ a, b, answer: a + b })
    setCaptchaValue("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus("idle")

    if (Number.parseInt(captchaValue) !== captchaQuestion.answer) {
      setStatus("error")
      setStatusMessage("Please solve the math problem correctly.")
      setIsSubmitting(false)
      generateCaptcha()
      return
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setStatusMessage("Message sent successfully! We'll get back to you soon.")
        setFormData({ name: "", email: "", ethereumAddress: "", message: "" })
        generateCaptcha()
      } else {
        setStatus("error")
        setStatusMessage(data.error || "Failed to send message. Please try again.")
      }
    } catch (error) {
      setStatus("error")
      setStatusMessage("Network error. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>Contact & Subscribe</CardTitle>
        <CardDescription>Join our newsletter or send us a message. We'd love to connect with you!</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Input
              name="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Input
              name="ethereumAddress"
              placeholder="Your Ethereum Address (optional)"
              value={formData.ethereumAddress}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Textarea
              name="message"
              placeholder="Your message or subscription preferences..."
              value={formData.message}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Security Check: What is {captchaQuestion.a} + {captchaQuestion.b}?
              </span>
            </div>
            <Input
              type="number"
              placeholder="Enter the answer"
              value={captchaValue}
              onChange={(e) => setCaptchaValue(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {status !== "idle" && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                status === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {status === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {statusMessage}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
