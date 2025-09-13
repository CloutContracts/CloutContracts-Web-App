import Link from "next/link"
import { NewsletterForm } from "@/components/newsletter-form"
import { Users, BarChart3, Mail, Settings } from "lucide-react"
import Image from "next/image"

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-background">
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
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent [&:not(:has(.bg-clip-text))]:text-foreground">
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
              <Link
                href="/newsletter"
                className="text-foreground font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <Mail className="w-4 h-4" />
                Newsletter
              </Link>
              <a
                href="/#applications"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
              >
                <Settings className="w-4 h-4" />
                Apps
              </a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-cyan-500">CloutContracts</span> Newsletter
            </h1>
            <p className="text-lg text-muted-foreground">
              Subscribe to our newsletter and stay updated with the latest Web3 developments and platform updates.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <NewsletterForm />
          </div>
        </div>
      </div>

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
