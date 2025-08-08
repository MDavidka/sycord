import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sycord - Discord Bot Dashboard",
  description: "Manage your Discord server with Sycord bot",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" style={{ background: '#000000' }}>
      <body className={`${inter.className} dark`} style={{ background: '#000000', minHeight: '100vh' }}>
        <div style={{ background: '#000000', minHeight: '100vh' }}>
          <Providers>
            {children}
            <Toaster 
              theme="dark" 
              position="top-right"
              toastOptions={{
                style: {
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                },
              }}
            />
          </Providers>
        </div>
      </body>
    </html>
  )
}
