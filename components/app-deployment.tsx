"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Rocket, Globe, Zap, Play, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function AppDeployment() {
  const [appName, setAppName] = useState("")
  const [isDeploying, setIsDeploying] = useState(false)
  const { toast } = useToast()

  const deployApp = async (template: string) => {
    setIsDeploying(true)
    try {
      // Simulate deployment
      await new Promise((resolve) => setTimeout(resolve, 3000))

      toast({
        title: "App deployed successfully",
        description: `${template} app is now live on CloutContracts network`,
      })
    } catch (error) {
      toast({
        title: "Deployment failed",
        description: "Failed to deploy application",
        variant: "destructive",
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const templates = [
    {
      name: "DeFi Exchange",
      description: "Decentralized token exchange with AMM",
      icon: "🔄",
      category: "DeFi",
      deployTime: "2 min",
    },
    {
      name: "NFT Marketplace",
      description: "Complete NFT trading platform",
      icon: "🎨",
      category: "NFT",
      deployTime: "3 min",
    },
    {
      name: "DAO Governance",
      description: "Decentralized governance system",
      icon: "🏛️",
      category: "Governance",
      deployTime: "2 min",
    },
    {
      name: "Staking Pool",
      description: "Token staking and rewards platform",
      icon: "💰",
      category: "DeFi",
      deployTime: "1 min",
    },
    {
      name: "Social Network",
      description: "Decentralized social platform",
      icon: "👥",
      category: "Social",
      deployTime: "4 min",
    },
    {
      name: "Gaming Platform",
      description: "Blockchain-based gaming ecosystem",
      icon: "🎮",
      category: "Gaming",
      deployTime: "5 min",
    },
  ]

  const deployedApps = [
    {
      name: "My DeFi Exchange",
      url: "https://my-defi.cloutcontracts.app",
      status: "active",
      deployed: "2 days ago",
      users: 156,
    },
    {
      name: "NFT Gallery",
      url: "https://nft-gallery.cloutcontracts.app",
      status: "active",
      deployed: "1 week ago",
      users: 89,
    },
    {
      name: "Staking Rewards",
      url: "https://staking.cloutcontracts.app",
      status: "pending",
      deployed: "1 hour ago",
      users: 0,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Rocket className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">App Deployment</h3>
        <Badge variant="secondary" className="bg-accent/10 text-accent">
          One-Click Deploy
        </Badge>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="deployed">My Apps</TabsTrigger>
          <TabsTrigger value="custom">Custom Deploy</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preconfigured App Templates</CardTitle>
              <CardDescription>Deploy production-ready dApps with a single click</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-accent/5 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="text-2xl">{template.icon}</div>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-sm">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Deploy time: {template.deployTime}</span>
                        <Button size="sm" onClick={() => deployApp(template.name)} disabled={isDeploying}>
                          <Play className="w-3 h-3 mr-1" />
                          Deploy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployed Applications</CardTitle>
              <CardDescription>Manage your deployed apps on the CloutContracts network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deployedApps.map((app, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{app.name}</h4>
                        <p className="text-sm text-muted-foreground">{app.url}</p>
                        <p className="text-xs text-muted-foreground">
                          Deployed {app.deployed} • {app.users} users
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={app.status === "active" ? "default" : "secondary"}>{app.status}</Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Deployment</CardTitle>
              <CardDescription>Deploy your own application using CloutContracts infrastructure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-name">Application Name</Label>
                <Input
                  id="app-name"
                  placeholder="My Awesome DApp"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo-url">Repository URL</Label>
                <Input id="repo-url" placeholder="https://github.com/username/repo" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="build-command">Build Command</Label>
                <Input id="build-command" placeholder="npm run build" />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Deployment Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automatic HTTPS certificates</li>
                  <li>• Global CDN distribution</li>
                  <li>• Built-in analytics</li>
                  <li>• Custom domain support</li>
                  <li>• Integrated with CloutContracts RPC</li>
                </ul>
              </div>

              <Button className="w-full" disabled={!appName}>
                <Zap className="w-4 h-4 mr-2" />
                Deploy Application
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
