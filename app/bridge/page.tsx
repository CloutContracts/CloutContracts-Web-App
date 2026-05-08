"use client"

import { AuthProvider, AuthButtons } from "@/components/auth-provider"
import { BridgeSwap } from "@/components/bridge-swap"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowDownUp, Shield, Zap, Globe, Users, BarChart3, Mail, Settings } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

function BridgePageContent() {
  return (
    <div className="min-h-screen bg-background minimal-grid">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Link href="/" className="flex items-center gap-3 sm:gap-4 min-w-0">
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
                  <h1 className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight whitespace-nowrap">
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      CCS
                    </span>
                    <span className="hidden sm:inline bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      {" "}Bridge
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    Token Bridge
                  </p>
                </div>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center gap-3 xl:gap-5 flex-shrink-0">
              <a
                href="https://discord.gg/nuNTfQXBN6"
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
              <Link
                href="/bridge"
                className="text-foreground font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <ArrowDownUp className="w-4 h-4" />
                Bridge
              </Link>
              <Link
                href="/#applications"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
              >
                <Settings className="w-4 h-4" />
                Apps
              </Link>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/"
                className="lg:hidden text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>
              <AuthButtons />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <ArrowDownUp className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-medium">Cross-Chain Bridge</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Bridge Your Tokens
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base mb-3">
            Bridge CCS tokens across Ethereum, BNB Chain, and Ethereum Classic networks.
            Fast, secure, and decentralized cross-chain transfers.
          </p>
          <p className="text-amber-500/80 max-w-lg mx-auto text-xs sm:text-sm">
            This bridge is for CCS cross-chain tokens only. Use at your own risk. 
            Always verify transactions before confirming.
          </p>
        </div>

        {/* Bridge Component */}
        <div className="mb-12">
          <BridgeSwap />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-semibold mb-2">Fast Transfers</h3>
              <p className="text-xs text-muted-foreground">
                Bridge your tokens in minutes with optimized transaction processing
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-semibold mb-2">Secure Protocol</h3>
              <p className="text-xs text-muted-foreground">
                Enterprise-grade security with audited smart contracts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-semibold mb-2">Multi-Chain CCS</h3>
              <p className="text-xs text-muted-foreground">
                Bridge CCS tokens across Ethereum, BNB Chain, and Ethereum Classic
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Supported Networks */}
        <div className="mt-12 text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Supported Networks</h3>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border/50">
              <Image src="/bridge/ETH.png" alt="Ethereum" width={24} height={24} className="rounded-full" />
              <span className="text-sm font-medium">Ethereum</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border/50">
              <Image src="/bridge/BNB.png" alt="BNB Chain" width={24} height={24} className="rounded-full" />
              <span className="text-sm font-medium">BNB Chain</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border/50">
              <Image src="/bridge/ETC.png" alt="Ethereum Classic" width={24} height={24} className="rounded-full" />
              <span className="text-sm font-medium">ETC</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Image src="/bridge/cc.png" alt="CloutContracts" width={24} height={24} className="rounded-full" />
              <span className="text-sm font-medium text-cyan-400">CCS Token</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/favicon.png" alt="CloutContracts" width={24} height={24} className="rounded" />
              <span className="text-sm text-muted-foreground">CloutContracts Bridge</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              CCS Cross-Chain Bridge - Use at your own risk
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function BridgePage() {
  return (
    <AuthProvider>
      <BridgePageContent />
    </AuthProvider>
  )
}
