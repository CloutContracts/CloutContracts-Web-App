"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Cpu,
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
  Settings,
  Mail,
} from "lucide-react"
import { AuthButtons, useAuth } from "@/components/auth-provider"
import { WalletCounter } from "@/components/wallet-counter"
import { NetworkStatsViewer } from "@/components/network-stats-viewer"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function CloutContractsApp() {
  const { account, isConnected } = useAuth()
  const [circulatingSupply, setCirculatingSupply] = useState<string>("Loading...")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center subtle-glow flex-shrink-0">
                <Image
                  src="/favicon.png"
                  alt="CloutContracts Logo"
                  width={32}
                  height={32}
                  className="sm:w-10 sm:h-10 rounded-lg"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent [&:not(:has(.bg-clip-text))]:text-foreground">
                    CloutContracts
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Next-Gen Web3 Platform</p>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
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
              <Link
                href="/newsletter"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
              >
                <Mail className="w-4 h-4" />
                Newsletter
              </Link>
              <a
                href="#applications"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
              >
                <Settings className="w-4 h-4" />
                Apps
              </a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {isConnected && (
                <div className="hidden xl:flex items-center gap-3">
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

              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>

              <div className="hidden lg:flex">
                <AuthButtons />
              </div>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-border">
              <nav className="flex flex-col gap-3 pt-4">
                <div className="pb-3 border-b border-border/50">
                  <AuthButtons />
                </div>

                <a
                  href="https://discord.gg/cloutcontracts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm py-2"
                >
                  <Users className="w-4 h-4" />
                  Discord
                </a>
                <a
                  href="http://guild.xyz/cloutcontracts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm py-2"
                >
                  Guild
                </a>
                <a
                  href="https://angel.co/s/digitalcpr/ngwMx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm py-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  VC Fund
                </a>
                <Link
                  href="/newsletter"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm py-2"
                >
                  <Mail className="w-4 h-4" />
                  Newsletter
                </Link>
                <a
                  href="#applications"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm py-2"
                >
                  <Settings className="w-4 h-4" />
                  Apps
                </a>
                {isConnected && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-xs w-fit">
                      <Image src="/favicon.png" alt="CCS" width={12} height={12} className="mr-1 rounded-sm" />
                      1,250.75 CCS
                    </Badge>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs w-fit">
                      <Globe className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <a
        href="https://netcapital.com/companies/starkdrones"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        <div className="w-full bg-gradient-to-b from-background via-background/50 to-background py-6 sm:py-8 mt-4 sm:mt-6">
          <div className="container mx-auto px-4">
            <div className="max-w-[614px] mx-auto rounded-xl overflow-hidden border-2 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25),0_0_40px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35),0_0_60px_rgba(6,182,212,0.2)] hover:border-cyan-400/50 transition-all duration-300">
              <Image
                src="/riemann-banner.jpg"
                alt="Own a Piece of Riemann Computing via Equity Crowdfunding"
                width={700}
                height={225}
                className="w-full h-auto"
                style={{
                  imageRendering: "crisp-edges",
                  WebkitFontSmoothing: "antialiased",
                }}
                quality={100}
                priority
                unoptimized
              />
            </div>
          </div>
        </div>
      </a>

      <main className="container mx-auto px-4 py-4 sm:py-6">
        <div className="text-center space-y-12 sm:space-y-16">
          <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent [&:not(:has(.bg-clip-text))]:text-foreground">
                Clout
              </span>
              <span className="text-foreground">Contracts</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              The smart contracts platform for influencers and creators, built on a high-speed rollup layer that powers
              the next generation of blockchain developers.
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
            <div className="professional-card p-6 sm:p-8">
              <div className="text-center space-y-4 sm:space-y-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Cpu className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-semibold">CloutContracts IDE</h3>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                    Write, compile, and deploy smart contracts directly in your browser. Our integrated development
                    environment supports Solidity with syntax highlighting, real-time compilation, and MetaMask
                    integration.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button
                    variant="default"
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    asChild
                  >
                    <Link href="/ide">
                      <Cpu className="w-4 h-4 mr-2" />
                      Open IDE
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <a href="https://github.com/CloutContracts" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Source
                    </a>
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Real-time Compilation</p>
                    <p className="text-xs text-muted-foreground">Instant feedback as you code</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
                      <Shield className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-sm font-medium">MetaMask Integration</p>
                    <p className="text-xs text-muted-foreground">Deploy directly to CloutContracts</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto">
                      <Database className="w-4 h-4 text-secondary" />
                    </div>
                    <p className="text-sm font-medium">Template Library</p>
                    <p className="text-xs text-foreground/70">ERC20, ERC721, and more</p>
                  </div>
                </div>
              </div>
            </div>
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
                    The first phase is integrating the Agoric SDK and a test network for issuing smart contracts tied to
                    or on top of your decentralized social media profile.
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
                { name: "Faucet", href: "https://distributednet.org/faucet", color: "accent" },
                { name: "Main EVM", href: "https://github.com/CloutContracts/Main-EVM", color: "secondary" },
                { name: "Side EVM", href: "https://github.com/CloutContracts/side-evm", color: "emerald-500" },
                { name: "Staking", href: "https://distributednet.org/staking", color: "purple-500" },
                { name: "CloutSwap", href: "https://github.com/CloutContracts/CloutSwap", color: "orange-500" },
                { name: "Blockchain Explorer", href: "https://distributednet.org/explorer", color: "blue-500" },
                {
                  name: "CCS DAO v2",
                  href: "https://polygonscan.com/token/0xe346502D3BB39262EE2d9D2C52c7aE7C1f98E7e8",
                  color: "pink-500",
                },
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
              <span className="text-foreground">CCS Token Ecosystem</span>
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
                  <p className="text-xs text-muted-foreground">Controls the entire supply of 111,000,000 CCS tokens</p>
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
            <div id="connect-wallet-section" className="text-center space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-semibold">Connect Wallet</h3>
                <p className="text-sm sm:text-base text-muted-foreground">Access the CloutContracts platform</p>
              </div>
              <AuthButtons />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-4 sm:mt-6">
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
                { name: "Twitter", href: "https://twitter.com/_CloutContracts" },
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
            <p className="text-xs sm:text-sm text-muted-foreground px-4">
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
