import type { Metadata } from "next"
import "./globals.css"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import CartDrawer from "@/components/CartDrawer"

export const metadata: Metadata = {
  title: "Petal & Bloom | Artisan Florist & Custom DIY Bouquets",
  description: "Handcrafted signature floral arrangements, custom DIY bouquets, and same-day fresh flower delivery.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background scroll-smooth">
      <body className="flex flex-col min-h-screen selection:bg-primary/20 selection:text-primary">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  )
}
