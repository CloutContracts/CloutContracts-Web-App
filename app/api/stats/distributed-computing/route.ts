import { NextResponse } from "next/server"

interface ComputeNode {
  id: string
  location: string
  status: "active" | "idle" | "offline"
  cpuUsage: number
  memoryUsage: number
  tasksCompleted: number
  uptime: number
}

interface DistributedStats {
  totalNodes: number
  activeNodes: number
  totalComputePower: number
  averageResponseTime: number
  tasksInQueue: number
  completedTasks: number
  nodes: ComputeNode[]
}

// Simulated distributed computing stats
const generateStats = (): DistributedStats => {
  const nodes: ComputeNode[] = [
    {
      id: "node-us-east-1",
      location: "US East (Virginia)",
      status: "active",
      cpuUsage: Math.random() * 80 + 10,
      memoryUsage: Math.random() * 70 + 20,
      tasksCompleted: Math.floor(Math.random() * 1000) + 500,
      uptime: Math.random() * 168 + 24, // 1-7 days in hours
    },
    {
      id: "node-eu-west-1",
      location: "EU West (Ireland)",
      status: "active",
      cpuUsage: Math.random() * 75 + 15,
      memoryUsage: Math.random() * 65 + 25,
      tasksCompleted: Math.floor(Math.random() * 800) + 400,
      uptime: Math.random() * 120 + 48,
    },
    {
      id: "node-ap-south-1",
      location: "Asia Pacific (Mumbai)",
      status: Math.random() > 0.8 ? "idle" : "active",
      cpuUsage: Math.random() * 60 + 20,
      memoryUsage: Math.random() * 80 + 10,
      tasksCompleted: Math.floor(Math.random() * 600) + 300,
      uptime: Math.random() * 96 + 12,
    },
    {
      id: "node-us-west-2",
      location: "US West (Oregon)",
      status: "active",
      cpuUsage: Math.random() * 85 + 5,
      memoryUsage: Math.random() * 75 + 15,
      tasksCompleted: Math.floor(Math.random() * 1200) + 600,
      uptime: Math.random() * 200 + 72,
    },
  ]

  const activeNodes = nodes.filter((node) => node.status === "active").length
  const totalComputePower = nodes.reduce((sum, node) => sum + (100 - node.cpuUsage), 0)
  const completedTasks = nodes.reduce((sum, node) => sum + node.tasksCompleted, 0)

  return {
    totalNodes: nodes.length,
    activeNodes,
    totalComputePower: Math.round(totalComputePower),
    averageResponseTime: Math.round(Math.random() * 500 + 100), // 100-600ms
    tasksInQueue: Math.floor(Math.random() * 50) + 10,
    completedTasks,
    nodes,
  }
}

export async function GET() {
  try {
    const stats = generateStats()

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch distributed computing stats" }, { status: 500 })
  }
}
