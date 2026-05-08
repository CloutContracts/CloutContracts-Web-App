import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const TABLE_NAME = "cloutcontracts_newsletter_subscribers"

interface Subscriber {
  id: string
  name: string
  email: string
  ethereumAddress: string
  phoneNumber?: string
  countryCode?: string
  ipHash?: string
  subscribedAt: string
  status: "active" | "unsubscribed"
}

export class NewsletterDB {
  static async addSubscriber(data: Omit<Subscriber, "id" | "subscribedAt" | "status">): Promise<Subscriber> {
    // Check if email already exists
    const { data: existing } = await supabase
      .from(TABLE_NAME)
      .select("email")
      .eq("email", data.email.toLowerCase())
      .maybeSingle()

    if (existing) {
      throw new Error("Email already subscribed")
    }

    const { data: newSubscriber, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        name: data.name,
        email: data.email.toLowerCase(),
        ethereum_address: data.ethereumAddress,
        phone_number: data.phoneNumber,
        country_code: data.countryCode,
        ip_hash: data.ipHash,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Supabase insert error:", error)
      throw new Error("Failed to add subscriber")
    }

    const subscriber: Subscriber = {
      id: newSubscriber.id,
      name: newSubscriber.name,
      email: newSubscriber.email,
      ethereumAddress: newSubscriber.ethereum_address || "",
      subscribedAt: newSubscriber.subscribed_at,
      status: newSubscriber.is_active ? "active" : "unsubscribed",
    }

    console.log("[v0] Subscriber added to Supabase:", subscriber)
    return subscriber
  }

  static async getSubscriberCount(): Promise<number> {
    const { count, error } = await supabase
      .from(TABLE_NAME)
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    if (error) {
      console.error("[v0] Supabase count error:", error)
      return 0
    }

    return count || 0
  }

  static async getAllSubscribers(): Promise<Subscriber[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("is_active", true)
      .order("subscribed_at", { ascending: false })

    if (error) {
      console.error("[v0] Supabase fetch error:", error)
      return []
    }

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      ethereumAddress: row.ethereum_address || "",
      subscribedAt: row.subscribed_at,
      status: row.is_active ? "active" : "unsubscribed",
    }))
  }

  static async getSubscriberByEmail(email: string): Promise<Subscriber | null> {
    const { data, error } = await supabase.from(TABLE_NAME).select("*").eq("email", email.toLowerCase()).maybeSingle()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      ethereumAddress: data.ethereum_address || "",
      subscribedAt: data.subscribed_at,
      status: data.is_active ? "active" : "unsubscribed",
    }
  }

  static async unsubscribeByEmail(email: string): Promise<boolean> {
    const { error } = await supabase.from(TABLE_NAME).update({ is_active: false }).eq("email", email.toLowerCase())

    if (error) {
      console.error("[v0] Supabase unsubscribe error:", error)
      return false
    }

    return true
  }

  static async getSubscriberByIpHash(ipHash: string): Promise<Subscriber | null> {
    if (!ipHash) {
      return null
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("ip_hash", ipHash)
      .eq("is_active", true)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      ethereumAddress: data.ethereum_address || "",
      phoneNumber: data.phone_number,
      countryCode: data.country_code,
      subscribedAt: data.subscribed_at,
      status: data.is_active ? "active" : "unsubscribed",
    }
  }
}
