import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Petal & Bloom | Artisan Flower Shop & DIY Studio",
  description: "Fresh, handcrafted bouquets and custom flower arrangements hand-delivered to your doorstep. Experience our interactive DIY Bouquet Studio and live delivery tracker.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
