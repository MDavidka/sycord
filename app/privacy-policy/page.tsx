"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, Database, Cookie, Mail } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="hero-gradient" aria-hidden />

      <nav className="glass-card border-b border-white/10 -mt-4">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 pt-8">
            <Image src="/new-blue-logo.png" alt="Sycord Bot" width={32} height={32} className="rounded-lg" />
            <span className="text-2xl font-bold">
              <span className="text-white">Sycord</span>
            </span>
          </div>
          <div className="flex items-center space-x-4 pt-8">
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-400">How we collect, use, and protect your information</p>
          <p className="text-sm text-gray-500 mt-2">Last updated: September 20, 2025</p>
        </div>

        <div className="space-y-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="h-6 w-6 mr-3 text-blue-400" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>When you use Sycord, we collect minimal information necessary to provide our Discord bot services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Discord Account Information:</strong> Your Discord user ID, username, avatar, and email
                  address when you authenticate
                </li>
                <li>
                  <strong>Server Information:</strong> Discord server IDs, names, and member counts for servers where
                  Sycord is installed
                </li>
                <li>
                  <strong>Bot Configuration:</strong> Custom settings, welcome messages, and moderation preferences you
                  configure
                </li>
                <li>
                  <strong>Usage Data:</strong> Commands used, features accessed, and basic analytics to improve our
                  service
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Database className="h-6 w-6 mr-3 text-green-400" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>We use the collected information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and maintain Sycord bot functionality in your Discord servers</li>
                <li>Authenticate your access to the dashboard and bot configuration</li>
                <li>Send automated messages, moderation actions, and server notifications</li>
                <li>Improve our services and develop new features</li>
                <li>Provide customer support and respond to your inquiries</li>
              </ul>
              <p className="text-sm text-gray-400 mt-4">
                <strong>We never sell your data or share it with third parties for marketing purposes.</strong>
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Cookie className="h-6 w-6 mr-3 text-yellow-400" />
                Data Storage and Security
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>Your data is stored securely using industry-standard practices:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All data is encrypted in transit and at rest</li>
                <li>We use secure cloud infrastructure with regular backups</li>
                <li>Access to your data is limited to essential personnel only</li>
                <li>We retain data only as long as necessary to provide our services</li>
              </ul>
              <p className="text-sm text-gray-400 mt-4">
                You can request deletion of your data at any time by contacting our support team.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Mail className="h-6 w-6 mr-3 text-purple-400" />
                Your Rights and Choices
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>You have the following rights regarding your personal information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Access:</strong> Request a copy of the personal data we hold about you
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate or incomplete data
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal data
                </li>
                <li>
                  <strong>Portability:</strong> Request transfer of your data in a machine-readable format
                </li>
                <li>
                  <strong>Withdrawal:</strong> Withdraw consent for data processing at any time
                </li>
              </ul>
              <p className="text-sm text-gray-400 mt-4">
                To exercise these rights, please contact us at{" "}
                <a href="mailto:privacy@sycord.com" className="text-blue-400 hover:text-blue-300">
                  privacy@sycord.com
                </a>
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Discord Integration</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>
                Sycord operates as a Discord bot and is subject to Discord's Terms of Service and Privacy Policy. By
                using Sycord, you acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Discord may also collect and process your data according to their policies</li>
                <li>Sycord accesses Discord's API to provide bot functionality</li>
                <li>Some data may be shared with Discord as required for bot operation</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>We may update this Privacy Policy from time to time. We will notify you of any changes by:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Posting the new Privacy Policy on this page</li>
                <li>Updating the "Last updated" date at the top of this policy</li>
                <li>Sending a notification through our Discord bot or email (for significant changes)</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
              <div className="space-y-2">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:privacy@sycord.com" className="text-blue-400 hover:text-blue-300">
                    privacy@sycord.com
                  </a>
                </p>
                <p>
                  <strong>Support:</strong>{" "}
                  <a href="mailto:support@sycord.com" className="text-blue-400 hover:text-blue-300">
                    support@sycord.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg" className="bg-white text-black hover:bg-gray-200">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Home
            </Link>
          </Button>
        </div>
      </div>

      <style jsx>{`
        .hero-gradient {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 36vh;
          pointer-events: none;
          background: linear-gradient(120deg, rgba(255,138,96,0.04), rgba(139,92,246,0.03), rgba(59,130,246,0.025));
          animation: gradientShift 12s ease-in-out infinite;
          z-index: 0;
        }
        @keyframes gradientShift {
          0% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(25deg); }
          100% { filter: hue-rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
