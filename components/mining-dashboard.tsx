"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Cpu, Zap, TrendingUp, Pause, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function MiningDashboard() {
  const [isMining, setIsMining] = useState(false)
  const [hashRate, setHashRate] = useState(0)
  const [progress, setProgress] = useState(0)
  const [earnedToday, setEarnedToday] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isMining) {
      interval = setInterval(() => {
        setHashRate((prev) => Math.max(0, prev + (Math.random() - 0.5) * 2))
        setProgress((prev) => (prev + 0.5) % 100)
        setEarnedToday((prev) => prev + 0.001)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isMining])

  const toggleMining = () => {
    setIsMining(!isMining)
    if (!isMining) {
      setHashRate(12.5)
      toast({
        title: "Mining started",
        description: "BOINC mining session initiated",
      })
    } else {
      setHashRate(0)
      toast({
        title: "Mining stopped",
        description: "Mining session ended",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Mining Dashboard</h3>
          <Badge
            variant={isMining ? "default" : "secondary"}
            className={isMining ? "bg-accent text-accent-foreground" : ""}
          >
            {isMining ? "Active" : "Inactive"}
          </Badge>
        </div>

        <Button onClick={toggleMining} className={isMining ? "bg-destructive hover:bg-destructive/90" : ""}>
          {isMining ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {isMining ? "Stop Mining" : "Start Mining"}
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hash Rate</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hashRate.toFixed(1)} H/s</div>
            <p className="text-xs text-muted-foreground">JavaScript BOINC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earned Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnedToday.toFixed(3)} CCS</div>
            <p className="text-xs text-muted-foreground">+{(earnedToday * 0.1).toFixed(2)}% efficiency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Power Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isMining ? "45W" : "0W"}</div>
            <p className="text-xs text-muted-foreground">Optimized consumption</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Share</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.02%</div>
            <p className="text-xs text-muted-foreground">Of total network</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mining" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mining">Mining Status</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="mining" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Mining Session</CardTitle>
              <CardDescription>Real-time mining statistics using decentralized-internet SDK</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Block Progress</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Session Duration</p>
                  <p className="font-semibold">{isMining ? "00:15:32" : "00:00:00"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Blocks Found</p>
                  <p className="font-semibold">{isMining ? "3" : "0"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Difficulty</p>
                  <p className="font-semibold">1,024</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pool Share</p>
                  <p className="font-semibold">2.1%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mining Rewards</CardTitle>
              <CardDescription>Track your CCS token earnings and payouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-accent/10 rounded-lg">
                  <div>
                    <p className="font-semibold">Today's Earnings</p>
                    <p className="text-sm text-muted-foreground">Last 24 hours</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-accent">{earnedToday.toFixed(3)} CCS</p>
                    <p className="text-sm text-muted-foreground">≈ $12.45</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Weekly Total</span>
                    <span className="font-semibold">87.5 CCS</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Monthly Total</span>
                    <span className="font-semibold">350.2 CCS</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>All Time</span>
                    <span className="font-semibold">1,250.75 CCS</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mining Configuration</CardTitle>
              <CardDescription>Optimize your mining performance and resource usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">CPU Usage</label>
                <Progress value={75} className="h-2" />
                <p className="text-xs text-muted-foreground">75% - Recommended for optimal performance</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Memory Allocation</label>
                <Progress value={60} className="h-2" />
                <p className="text-xs text-muted-foreground">60% - 2.4GB allocated for mining</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-start Mining</p>
                  <p className="text-sm text-muted-foreground">Start mining when app opens</p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
