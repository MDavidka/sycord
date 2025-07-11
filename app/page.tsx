import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { ArrowRight, Shield, MessageSquare, Gift, Package, Settings } from "lucide-react"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="glass-card border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image src="/new-blue-logo.png" alt="Sycord Bot" width={32} height={32} className="rounded-lg" />
            <h1 className="text-xl font-bold">Sycord</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="#contact" className="text-gray-300 hover:text-white transition-colors">
              Contact
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                Login
              </Button>
            </Link>
          </nav>
          <Link href="/login" className="md:hidden">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 lg:py-48 flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-80"></div>
          {/* Subtle pattern/texture */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/placeholder.svg')",
              backgroundSize: "cover",
              opacity: 0.05,
            }}
          ></div>
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 animate-fade-in-up">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">Sycord</span>{" "}
            <br className="hidden sm:inline" />
            Your Ultimate Discord Bot
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto animate-fade-in-up delay-200">
            Empower your community with advanced moderation, engaging events, and seamless integrations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up delay-400">
            <Link href="/dashboard">
              <Button className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg rounded-full shadow-lg transition-all duration-300 transform hover:scale-105">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-lg rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 bg-transparent"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-gray-950">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful Features for Every Server</h2>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Sycord offers a comprehensive suite of tools to enhance your Discord server.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="glass-card p-6 flex flex-col items-center text-center">
              <Shield className="h-12 w-12 text-cyan-400 mb-4" />
              <CardTitle className="text-xl font-semibold text-white mb-2">Advanced Moderation</CardTitle>
              <CardDescription className="text-gray-300">
                Keep your community safe with customizable filters, raid protection, and bot detection.
              </CardDescription>
            </Card>
            <Card className="glass-card p-6 flex flex-col items-center text-center">
              <MessageSquare className="h-12 w-12 text-blue-400 mb-4" />
              <CardTitle className="text-xl font-semibold text-white mb-2">Helpdesk & Support</CardTitle>
              <CardDescription className="text-gray-300">
                Streamline support with ticket systems and automated Q&A responses.
              </CardDescription>
            </Card>
            <Card className="glass-card p-6 flex flex-col items-center text-center">
              <Gift className="h-12 w-12 text-purple-400 mb-4" />
              <CardTitle className="text-xl font-semibold text-white mb-2">Engaging Events</CardTitle>
              <CardDescription className="text-gray-300">
                Create and manage exciting giveaways to boost community engagement.
              </CardDescription>
            </Card>
            <Card className="glass-card p-6 flex flex-col items-center text-center">
              <Package className="h-12 w-12 text-green-400 mb-4" />
              <CardTitle className="text-xl font-semibold text-white mb-2">Extensible Plugins</CardTitle>
              <CardDescription className="text-gray-300">
                Extend functionality with a growing library of community-driven plugins.
              </CardDescription>
            </Card>
            <Card className="glass-card p-6 flex flex-col items-center text-center">
              <Settings className="h-12 w-12 text-yellow-400 mb-4" />
              <CardTitle className="text-xl font-semibold text-white mb-2">Customizable Bot</CardTitle>
              <CardDescription className="text-gray-300">
                Personalize your bot's profile picture, name, and token for a unique presence.
              </CardDescription>
            </Card>
            <Card className="glass-card p-6 flex flex-col items-center text-center">
              <Image src="/new-blue-logo.png" alt="Sycord Bot" width={48} height={48} className="mb-4 rounded-lg" />
              <CardTitle className="text-xl font-semibold text-white mb-2">Seamless Integration</CardTitle>
              <CardDescription className="text-gray-300">
                Connect Sycord with your favorite services for a unified experience.
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Elevate Your Discord Server?</h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of communities already benefiting from Sycord's powerful features.
          </p>
          <Link href="/dashboard">
            <Button className="bg-white text-black hover:bg-gray-200 px-10 py-4 text-xl rounded-full shadow-lg transition-all duration-300 transform hover:scale-105">
              Get Started Now
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-card border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Image src="/new-blue-logo.png" alt="Sycord Bot" width={24} height={24} className="rounded-lg" />
              <p className="text-lg font-bold text-white">Sycord</p>
            </div>
            <p>&copy; {new Date().getFullYear()} Sycord. All rights reserved.</p>
            <nav className="flex space-x-4">
              <Link href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
