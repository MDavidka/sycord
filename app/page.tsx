import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  Shield,
  MessageSquare,
  Clock,
  Users,
  Zap,
  ArrowRight,
  Github,
  Twitter,
  Star,
  CheckCircle,
  TrendingUp,
  Globe,
  Lock,
  Sparkles,
  Cpu,
  Database,
  Activity,
  BarChart3,
  Settings,
  Headphones,
  Award,
  Rocket,
  Heart,
  MessageCircle,
  UserPlus,
  Bell,
  Target,
  Layers,
  Code,
  Wifi,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/3 w-56 h-56 bg-pink-500/10 rounded-full blur-3xl"></div>

        {/* Floating Icons */}
        <div className="absolute top-32 left-1/4 animate-pulse">
          <Bot className="w-8 h-8 text-cyan-400/30" />
        </div>
        <div className="absolute top-60 right-1/4 animate-pulse delay-1000">
          <Shield className="w-6 h-6 text-green-400/30" />
        </div>
        <div className="absolute bottom-60 left-1/3 animate-pulse delay-2000">
          <Zap className="w-7 h-7 text-yellow-400/30" />
        </div>
        <div className="absolute bottom-32 right-1/5 animate-pulse delay-500">
          <MessageSquare className="w-6 h-6 text-blue-400/30" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="glass-card border-b border-white/10 relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Image src="/bot-icon.png" alt="Dash Bot" width={32} height={32} className="rounded-lg" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Dash</span>
            </span>
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
              Online
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-300">
              <Link href="#features" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Features
              </Link>
              <Link href="#stats" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Stats
              </Link>
              <Link href="#support" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                <Headphones className="w-4 h-4" />
                Support
              </Link>
            </div>
            <Link href="/login">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                <Users className="w-4 h-4 mr-2" />
                Login
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-white text-black hover:bg-gray-200">
                <Rocket className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Status Indicators */}
          <div className="flex justify-center items-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Globe className="w-4 h-4" />
              <span>24/7 Active</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Enterprise Security</span>
            </div>
          </div>

          <Badge variant="secondary" className="mb-6 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            <Star className="w-4 h-4 mr-2" />
            Advanced Discord Bot
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Meet{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent relative">
              Dash
              <Sparkles className="absolute -top-2 -right-8 w-6 h-6 text-yellow-400 animate-pulse" />
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            The intelligent Discord bot that moderates your server, manages tickets, and keeps your community engaged
            with smart automation.
          </p>

          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm">Auto Moderation</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm">Smart Tickets</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm">Real-time Analytics</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-3 hover-glow">
                <Bot className="mr-2 h-5 w-5" />
                Add to Discord
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-3 bg-transparent"
            >
              <Activity className="mr-2 h-5 w-5" />
              View Demo
            </Button>
          </div>
        </div>

        {/* Hero Illustration */}
        <div className="mt-16 relative">
          <div className="glass-card p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-cyan-400">50K+</p>
                <p className="text-sm text-gray-400">Active Servers</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-green-400">99.9%</p>
                <p className="text-sm text-gray-400">Threat Detection</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-purple-400">1M+</p>
                <p className="text-sm text-gray-400">Messages Processed</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-yellow-400">24/7</p>
                <p className="text-sm text-gray-400">Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400">Powerful Features</span>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4">Everything you need to manage and grow your Discord community</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            From advanced moderation to intelligent automation, Dash provides all the tools your server needs to thrive.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="glass-card hover-glow animate-fade-in group">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <MessageSquare className="h-12 w-12 text-blue-400 group-hover:scale-110 transition-transform" />
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <Cpu className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
              <CardTitle className="text-white">Smart Support System</CardTitle>
              <CardDescription className="text-gray-400">
                Automated ticket system with intelligent responses and priority routing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Automated ticket management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Custom response system
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  User reporting features
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Priority queue management
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover-glow animate-fade-in group">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Shield className="h-12 w-12 text-green-400 group-hover:scale-110 transition-transform" />
                <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                  <Lock className="w-3 h-3 mr-1" />
                  Secure
                </Badge>
              </div>
              <CardTitle className="text-white">Advanced Moderation</CardTitle>
              <CardDescription className="text-gray-400">
                Comprehensive protection with fraud detection and raid protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Suspicious account filtering
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Advanced fraud protection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Raid protection system
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Auto-ban malicious users
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover-glow animate-fade-in group">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Users className="h-12 w-12 text-purple-400 group-hover:scale-110 transition-transform" />
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  <UserPlus className="w-3 h-3 mr-1" />
                  Growth
                </Badge>
              </div>
              <CardTitle className="text-white">Welcome & Invite Tracking</CardTitle>
              <CardDescription className="text-gray-400">
                Welcome new members and track who invited them with detailed analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Custom welcome messages
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Invite tracking system
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Auto role assignment
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Member analytics
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover-glow animate-fade-in group">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Clock className="h-12 w-12 text-orange-400 group-hover:scale-110 transition-transform" />
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                  <Bell className="w-3 h-3 mr-1" />
                  Automated
                </Badge>
              </div>
              <CardTitle className="text-white">Smart Announcements</CardTitle>
              <CardDescription className="text-gray-400">
                Triggered announcements and web-based giveaways with advanced scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Time-based triggers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Member count milestones
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Web giveaway system
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Custom event scheduling
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover-glow animate-fade-in group">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-12 w-12 text-yellow-400 group-hover:scale-110 transition-transform" />
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Analytics
                </Badge>
              </div>
              <CardTitle className="text-white">Real-time Dashboard</CardTitle>
              <CardDescription className="text-gray-400">
                Monitor and configure your bot from anywhere with comprehensive analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Live server statistics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Feature toggles
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Configuration management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Performance insights
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover-glow animate-fade-in group">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Bot className="h-12 w-12 text-pink-400 group-hover:scale-110 transition-transform" />
                <Badge variant="secondary" className="bg-pink-500/20 text-pink-300 border-pink-500/30">
                  <Rocket className="w-3 h-3 mr-1" />
                  Quick Setup
                </Badge>
              </div>
              <CardTitle className="text-white">Easy Setup</CardTitle>
              <CardDescription className="text-gray-400">
                Get started in minutes with our simple setup process and 24/7 support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  One-click Discord integration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Guided configuration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  24/7 support team
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Video tutorials
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="container mx-auto px-4 py-20">
        <div className="glass-card p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">Trusted by Communities</span>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4">Join the Growing Community</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Thousands of Discord servers trust Dash to keep their communities safe and engaged.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-white" />
              </div>
              <p className="text-3xl font-bold text-cyan-400 mb-2">50,000+</p>
              <p className="text-gray-400">Active Servers</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <p className="text-3xl font-bold text-green-400 mb-2">10M+</p>
              <p className="text-gray-400">Messages Moderated</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <p className="text-3xl font-bold text-purple-400 mb-2">99.9%</p>
              <p className="text-gray-400">Threat Detection</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <p className="text-3xl font-bold text-yellow-400 mb-2">5M+</p>
              <p className="text-gray-400">Happy Users</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="glass-card neon-border p-12 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-4 left-4">
              <Code className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="absolute top-4 right-4">
              <Database className="w-8 h-8 text-blue-400" />
            </div>
            <div className="absolute bottom-4 left-4">
              <Settings className="w-8 h-8 text-purple-400" />
            </div>
            <div className="absolute bottom-4 right-4">
              <Wifi className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                <Rocket className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400">Ready to Launch</span>
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Discord Server?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of communities already using{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-bold">
                Dash
              </span>{" "}
              to create better Discord experiences with advanced automation and security.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/login">
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-3 hover-glow">
                  <Bot className="mr-2 h-5 w-5" />
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-3 bg-transparent"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Join Discord
              </Button>
            </div>

            <div className="flex justify-center items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="support" className="border-t border-white/10 glass-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image src="/bot-icon.png" alt="Dash Bot" width={32} height={32} className="rounded-lg" />
                <span className="text-xl font-semibold">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Dash</span>{" "}
                  Bot
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                The most advanced Discord bot for community management, moderation, and engagement.
              </p>
              <div className="flex items-center space-x-4">
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Github className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Moderation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Ticket System
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Analytics
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Automation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                Support
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Discord Server
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Status Page
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Company
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>All systems operational</span>
              </div>
            </div>
            <span className="text-gray-400 text-sm">© 2024 Dash Bot. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
