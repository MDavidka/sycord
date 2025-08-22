import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import Providers from './providers'
import { Toaster } from 'react-hot-toast'
import StatusMonitor from '@/components/status-monitor'

export const metadata: Metadata = {
  title: 'all in one bot',
  description: 'Created by MDavid',
  generator: '.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-black">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="bg-black min-h-screen flex flex-col">
        <Providers>
          <Toaster />
          <main className="flex-grow">{children}</main>
          <StatusMonitor />
        </Providers>
      </body>
    </html>
  )
}
