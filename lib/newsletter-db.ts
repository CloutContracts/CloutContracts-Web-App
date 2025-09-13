// Simple in-memory database for newsletter subscribers
// In production, this would be replaced with a proper database like PostgreSQL, MongoDB, etc.

interface Subscriber {
  id: string
  name: string
  email: string
  ethereumAddress: string
  subscribedAt: string
  status: "active" | "unsubscribed"
}

// In-memory storage (will reset on server restart)
// In production, use a persistent database
const subscribers: Subscriber[] = []

export class NewsletterDB {
  static async addSubscriber(data: Omit<Subscriber, "id" | "subscribedAt" | "status">): Promise<Subscriber> {
    // Check if email already exists
    const existingSubscriber = subscribers.find((sub) => sub.email.toLowerCase() === data.email.toLowerCase())
    if (existingSubscriber) {
      throw new Error("Email already subscribed")
    }

    const subscriber: Subscriber = {
      id: crypto.randomUUID(),
      ...data,
      subscribedAt: new Date().toISOString(),
      status: "active",
    }

    subscribers.push(subscriber)
    console.log("[v0] Subscriber added to database:", subscriber)
    return subscriber
  }

  static async getSubscriberCount(): Promise<number> {
    return subscribers.filter((sub) => sub.status === "active").length
  }

  static async getAllSubscribers(): Promise<Subscriber[]> {
    return subscribers.filter((sub) => sub.status === "active")
  }

  static async getSubscriberByEmail(email: string): Promise<Subscriber | null> {
    return subscribers.find((sub) => sub.email.toLowerCase() === email.toLowerCase()) || null
  }

  static async unsubscribeByEmail(email: string): Promise<boolean> {
    const subscriber = subscribers.find((sub) => sub.email.toLowerCase() === email.toLowerCase())
    if (subscriber) {
      subscriber.status = "unsubscribed"
      return true
    }
    return false
  }

  // Initialize with existing subscriber from logs if needed
  static async initializeWithExistingData() {
    // Add the subscriber we saw in the logs if not already present
    const existingEmail = "test@test.com"
    if (!subscribers.find((sub) => sub.email === existingEmail)) {
      subscribers.push({
        id: crypto.randomUUID(),
        name: "Andrew",
        email: existingEmail,
        ethereumAddress: "0x0000000000000000000000000000000000000000",
        subscribedAt: "2025-09-13T04:41:54.129Z",
        status: "active",
      })
      console.log("[v0] Initialized with existing subscriber from logs")
    }
  }
}

// Initialize on module load
NewsletterDB.initializeWithExistingData()
