"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Cpu,
  Rocket,
  Activity,
  Shield,
  Globe,
  Database,
  Lock,
  Zap,
  Layers,
  GitBranch,
  ExternalLink,
  Users,
  BarChart3,
  Newspaper,
  Settings,
} from "lucide-react"
import { AuthButtons, useAuth } from "@/components/auth-provider"
import { EVMInterface } from "@/components/evm-interface"
import { MiningDashboard } from "@/components/mining-dashboard"
import { AppDeployment } from "@/components/app-deployment"
import { TokenManagement } from "@/components/token-management"
import { BlockExplorer } from "@/components/block-explorer"
import { WalletCounter } from "@/components/wallet-counter"
import { NetworkStatsViewer } from "@/components/network-stats-viewer"
import Image from "next/image"
import { useState, useEffect } from "react"

declare global {
  interface Window {
    ethereum?: any
  }
}

export default function CloutContractsApp() {
  const { account, isConnected, isAdmin } = useAuth()
  const [circulatingSupply, setCirculatingSupply] = useState<string>("Loading...")

  useEffect(() => {
    const fetchCirculatingSupply = async () => {
      try {
        const response = await fetch("/api/tokens/circulating-supply")
        const data = await response.json()
        if (data.success) {
          setCirculatingSupply(data.circulatingSupply.toLocaleString())
        } else {
          setCirculatingSupply("Error loading")
        }
      } catch (error) {
        console.error("Failed to fetch circulating supply:", error)
        setCirculatingSupply("Error loading")
      }
    }

    fetchCirculatingSupply()
  }, [])

  return (
    <div className="min-h-screen bg-background minimal-grid">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center subtle-glow">
                <Image
                  src="/favicon.png"
                  alt="CloutContracts Logo"
                  width={32}
                  height={32}
                  className="sm:w-10 sm:h-10 rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    CloutContracts
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Next-Gen Web3 Platform</p>
              </div>
            </div>

            <nav className="hidden xl:flex items-center gap-6 lg:gap-8">
              <a
                href="https://discord.gg/cloutcontracts"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
              >
                <Users className="w-4 h-4" />
                Discord
              </a>
              <a
                href="http://guild.xyz/cloutcontracts"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Guild
              </a>
              <a
                href="https://angel.co/s/digitalcpr/ngwMx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                VC Fund
              </a>
              <a
                href="#applications"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
              >
                <Settings className="w-4 h-4" />
                Apps
              </a>
              <a
                href="https://subscribe.decentralized-internet.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
              >
                <Newspaper className="w-4 h-4" />
                Newsletter
              </a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              {isConnected && (
                <div className="hidden sm:flex items-center gap-3">
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-xs">
                    <Image src="/favicon.png" alt="CCS" width={12} height={12} className="mr-1 rounded-sm" />
                    1,250.75 CCS
                  </Badge>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              )}
              <AuthButtons />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12">
        {!isConnected ? (
          <div className="text-center space-y-12 sm:space-y-16">
            <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Clout</span>
                <span className="tech-accent">Contracts</span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
                The smart contracts platform for influencers and creators, built on a high-speed rollup layer that
                powers the next generation of blockchain developers.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="professional-card p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center">
                  Watch the CloutContracts Trailer
                </h3>
                <div className="aspect-video rounded-lg overflow-hidden border border-border">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/oAUSVFjcyy8"
                    title="CloutContracts Trailer"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              </div>
            </div>

            <div className="max-w-6xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-semibold mb-8 sm:mb-12 text-center">Network Statistics</h3>
              <WalletCounter />
            </div>

            <div className="max-w-7xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-semibold mb-8 sm:mb-12 text-center">
                Multi-Chain Network Overview
              </h3>
              <NetworkStatsViewer />
            </div>

            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-semibold mb-8 sm:mb-12 text-center">Development Roadmap</h3>
              <div className="space-y-4 sm:space-y-6">
                <Card className="professional-card">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl flex items-start sm:items-center gap-3 flex-col sm:flex-row">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        1
                      </div>
                      <span>Phase #1 - Agoric SDK Integration</span>
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base sm:ml-11 mt-3 sm:mt-0">
                      The first phase is integrating the Agoric SDK and a test network for issuing smart contracts tied
                      to or on top of your decentralized social media profile.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="professional-card">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl flex items-start sm:items-center gap-3 flex-col sm:flex-row">
                      <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        2
                      </div>
                      <span>Phase #2 - Optimistic Rollup Mainnet</span>
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base sm:ml-11 mt-3 sm:mt-0">
                      More than likely, the second phase is an Optimistic Rollup on top of Ethereum created for creators
                      as the mainnet. We may also integrate various sidechain capabilities in the future.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="professional-card">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl flex items-start sm:items-center gap-3 flex-col sm:flex-row">
                      <div className="w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        3
                      </div>
                      <span>Phase #3 - Experimental Sidechain</span>
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base sm:ml-11 mt-3 sm:mt-0">
                      Phase 3 is an experimental phase, and we want to possibly integrate a sidechain to Lonero's
                      Decentralized-Internet SDK and create a series of offline-centric DAPP capabilities as well for
                      creator DAPPs.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>

            <div id="applications" className="max-w-6xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-semibold mb-8 sm:mb-12 text-center">Official Applications</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { name: "Node", href: "https://github.com/CloutContracts/CloutContracts", color: "primary" },
                  { name: "Faucet", href: "https://cloutcontracts.net/faucet", color: "accent" },
                  { name: "Main EVM", href: "https://github.com/CloutContracts/Main-EVM", color: "secondary" },
                  { name: "Side EVM", href: "https://cloutcontracts.net/side-evm", color: "emerald-500" },
                  { name: "Staking", href: "https://cloutcontracts.net/staking", color: "purple-500" },
                  { name: "CloutSwap", href: "https://github.com/CloutContracts/CloutSwap", color: "orange-500" },
                  { name: "Blockchain Explorer", href: "https://cloutcontracts.net/explorer", color: "blue-500" },
                  { name: "CCS DAO v2", href: "https://cloutcontracts.net/dao", color: "pink-500" },
                ].map((app) => (
                  <Card key={app.name} className="professional-card text-center">
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm sm:text-lg mb-2 sm:mb-3">{app.name}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-xs sm:text-sm h-8 sm:h-9 bg-transparent"
                      >
                        <a href={app.href} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          {app.href.includes("github") ? "GitHub" : "Launch"}
                        </a>
                      </Button>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            <div className="professional-card p-8 sm:p-12 max-w-5xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center">
                <span className="tech-accent">CCS Token Ecosystem</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Image src="/favicon.png" alt="CCS" width={20} height={20} className="sm:w-6 sm:h-6 rounded" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Symbol
                    </p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">CCS</p>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Total Supply
                  </p>
                  <p className="text-xl sm:text-2xl font-bold">111,000,000</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">CCS Tokens</p>
                </div>

                <div className="text-center space-y-2 col-span-2 sm:col-span-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Circulating
                  </p>
                  <p className="text-xl sm:text-2xl font-bold">{circulatingSupply}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">CCS Available</p>
                </div>

                <div className="text-center space-y-2 col-span-2 sm:col-span-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Type
                  </p>
                  <p className="text-base sm:text-lg font-semibold">Distributed Mineable</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Cryptocurrency</p>
                </div>

                <div className="col-span-2 professional-card p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                    <h4 className="text-base sm:text-lg font-semibold">Token Controller</h4>
                  </div>
                  <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                    <p className="text-xs sm:text-sm font-mono break-all mb-2">
                      0x0D81d9E21BD7C5bB095535624DcB0759E64B3899
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Controls the entire supply of 111,000,000 CCS tokens
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: Zap,
                  title: "Powerful",
                  desc: "Rollup layers with low gas fees, getting the best of both worlds for optimal performance",
                },
                {
                  icon: Lock,
                  title: "Open",
                  desc: "Fully open-source under OPNL license. Other developers can build on top of our platform",
                },
                {
                  icon: Layers,
                  title: "Flexibility",
                  desc: "Create custom faucets, DAPPs, and features on top of your creator profile",
                },
                {
                  icon: GitBranch,
                  title: "Reliability",
                  desc: "Making third party social networks more decentralized with tied user smart contracts",
                },
                {
                  icon: Cpu,
                  title: "Built-in EVM",
                  desc: "Deploy and interact with smart contracts using our integrated Ethereum Virtual Machine",
                },
                {
                  icon: Activity,
                  title: "Distributed Mining",
                  desc: "Mine CCS tokens using our JavaScript BOINC implementation and distributed computing network",
                },
              ].map((feature, index) => (
                <Card key={index} className="professional-card text-center">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                    </div>
                    <CardTitle className="text-base sm:text-lg mb-2 sm:mb-3">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">{feature.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="professional-card p-8 sm:p-12 max-w-md mx-auto">
              <div className="text-center space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-semibold">Connect Wallet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Access the CloutContracts platform</p>
                </div>
                <AuthButtons />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold">Command Center</h2>
                <p className="text-muted-foreground text-base sm:text-lg">
                  Welcome back, {account?.slice(0, 6)}...{account?.slice(-4)}
                  {isAdmin && <span className="text-accent ml-2 font-semibold">• Admin Access</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {isAdmin && (
                  <Badge variant="outline" className="bg-accent/10 border-accent text-accent text-xs">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Administrator
                  </Badge>
                )}
                <Badge variant="outline" className="bg-primary/10 border-primary text-primary text-xs">
                  <Database className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Connected
                </Badge>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-card border border-border p-1 rounded-lg">
                {[
                  { value: "overview", label: "Overview" },
                  { value: "evm", label: "EVM" },
                  { value: "mining", label: "Mining" },
                  { value: "tokens", label: "Tokens" },
                  { value: "explorer", label: "Explorer" },
                  { value: "deploy", label: "Deploy" },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all duration-200 text-xs sm:text-sm"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="space-y-6 sm:space-y-8">
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-xl sm:text-2xl font-semibold">Network Statistics</h3>
                  <WalletCounter />
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-xl sm:text-2xl font-semibold">Multi-Chain Overview</h3>
                  <NetworkStatsViewer />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <Card className="professional-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm font-medium uppercase tracking-wider">
                        CCS Balance
                      </CardTitle>
                      <Image src="/favicon.png" alt="CCS" width={16} height={16} className="sm:w-5 sm:h-5 rounded-sm" />
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="text-2xl sm:text-3xl font-bold">1,250.75</div>
                      <p className="text-xs text-muted-foreground">+2.5% from last cycle</p>
                    </CardContent>
                  </Card>

                  <Card className="professional-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm font-medium uppercase tracking-wider">
                        Mining Rate
                      </CardTitle>
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="text-2xl sm:text-3xl font-bold text-accent">12.5 CCS/hr</div>
                      <p className="text-xs text-muted-foreground">Distributed mining active</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <Card className="professional-card sm:col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm font-medium uppercase tracking-wider">
                        Deployed Apps
                      </CardTitle>
                      <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="text-2xl sm:text-3xl font-bold">3</div>
                      <p className="text-xs text-muted-foreground">2 active, 1 pending</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="evm">
                <EVMInterface />
              </TabsContent>

              <TabsContent value="mining">
                <MiningDashboard />
              </TabsContent>

              <TabsContent value="tokens">
                <TokenManagement />
              </TabsContent>

              <TabsContent value="explorer">
                <BlockExplorer />
              </TabsContent>

              <TabsContent value="deploy">
                <AppDeployment />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-16 sm:mt-20">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:gap-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <Image
                src="/favicon.png"
                alt="CloutContracts"
                width={28}
                height={28}
                className="sm:w-8 sm:h-8 rounded-lg"
              />
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-sm sm:text-base">CloutContracts</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Decentralizing the Internet</p>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-8 flex-wrap justify-center">
              {[
                { name: "GitHub", href: "https://github.com/CloutContracts" },
                { name: "Twitter", href: "https://twitter.com/CloutContracts" },
                { name: "Discord", href: "https://discord.gg/cloutcontracts" },
                { name: "Telegram", href: "https://t.me/cloutcontracts" },
                { name: "Statistics", href: "https://dune.com/cloutcontracts/dashboard" },
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              © Copyright 2025 CloutContracts - All Rights Reserved
            </p>
            <p className="text-xs text-muted-foreground px-4">
              Please consider this experimental. We aren't soliciting financial advice. Any actions you decide to do are
              fully at your own risk.
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 sm:gap-2 flex-wrap px-4">
              <span>Powered by</span>
              <a
                href="https://www.riecomp.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Riemann Computing Inc.
              </a>
              <span>•</span>
              <a
                href="https://bitbadges.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent/80 transition-colors font-medium"
              >
                BitBadges
              </a>
              <span>•</span>
              <a
                href="https://lonero.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:text-secondary/80 transition-colors font-medium"
              >
                Lonero
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
