import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between glass-card border-b border-white/10">
        <Link className="flex items-center justify-center" href="#">
          <Image src="/new-blue-logo.png" alt="Sycord Logo" width={32} height={32} className="rounded-lg" />
          <span className="sr-only">Sycord</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            Contact
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Login
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-black to-gray-900">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_550px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-white">
                    Advanced Discord Bot Security
                  </h1>
                  <p className="max-w-[600px] text-gray-400 md:text-xl">
                    Protect your community from raids, scams, and malicious activity with Sycord's cutting-edge AI.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black shadow transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
                    href="/dashboard"
                  >
                    Get Started
                  </Link>
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-md border border-white/20 bg-transparent px-8 text-sm font-medium shadow-sm transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 text-white"
                    href="#"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <Image
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
                height="400"
                src="/placeholder.svg?height=400&width=400"
                width="400"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-950">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-800 px-3 py-1 text-sm text-gray-300">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">
                  Comprehensive Protection for Your Discord Server
                </h2>
                <p className="max-w-[900px] text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Sycord offers a suite of powerful features designed to keep your community safe and thriving.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
              <div className="grid gap-1 glass-card p-6 rounded-lg">
                <h3 className="text-lg font-bold text-white">AI-Powered Moderation</h3>
                <p className="text-sm text-gray-400">
                  Our advanced AI detects and neutralizes threats like spam, phishing, and malicious links in real-time.
                </p>
              </div>
              <div className="grid gap-1 glass-card p-6 rounded-lg">
                <h3 className="text-lg font-bold text-white">Raid Protection</h3>
                <p className="text-sm text-gray-400">
                  Automated systems to prevent and mitigate mass joining, ping, and bot raids.
                </p>
              </div>
              <div className="grid gap-1 glass-card p-6 rounded-lg">
                <h3 className="text-lg font-bold text-white">Customizable Filters</h3>
                <p className="text-sm text-gray-400">
                  Tailor content filters, bad word lists, and link scanning to fit your community's needs.
                </p>
              </div>
              <div className="grid gap-1 glass-card p-6 rounded-lg">
                <h3 className="text-lg font-bold text-white">User Verification</h3>
                <p className="text-sm text-gray-400">
                  Implement account age checks and other verification steps for new members.
                </p>
              </div>
              <div className="grid gap-1 glass-card p-6 rounded-lg">
                <h3 className="text-lg font-bold text-white">Role Management</h3>
                <p className="text-sm text-gray-400">
                  Automate role assignments and monitor for suspicious permission changes.
                </p>
              </div>
              <div className="grid gap-1 glass-card p-6 rounded-lg">
                <h3 className="text-lg font-bold text-white">Detailed Logging</h3>
                <p className="text-sm text-gray-400">
                  Keep track of all moderation actions, member activity, and bot events with comprehensive logs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-black">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-white">
                Ready to Secure Your Discord?
              </h2>
              <p className="mx-auto max-w-[600px] text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of communities trusting Sycord to keep their servers safe and clean.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black shadow transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
                href="/dashboard"
              >
                Get Started Now
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/20 bg-transparent px-8 text-sm font-medium shadow-sm transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 text-white"
                href="#"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-white/10 glass-card">
        <p className="text-xs text-gray-400">&copy; 2024 Sycord. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-gray-400" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-gray-400" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
