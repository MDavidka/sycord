“use client”

import { useState, useEffect, useRef, useCallback } from “react”
import { Button } from “@/components/ui/button”
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from “@/components/ui/card”
import { Badge } from “@/components/ui/badge”
import { Bot, Shield, MessageSquare, Clock, Users, Zap, ArrowRight, Github, Twitter, Star, CheckCircle } from “lucide-react”

interface AppSettings {
maintenanceMode: {
enabled: boolean
estimatedTime?: string
}
}

const ADMIN_CODE = “7625819-7528-715”

// Mock router for demo
const mockRouter = {
push: (path: string) => {
console.log(`Would navigate to: ${path}`)
// In a real Next.js app, this would be: router.push(path)
}
}

export default function LandingPage() {
const router = mockRouter
const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
const [adminCode, setAdminCode] = useState(””)
const [shake, setShake] = useState(false)
const [glowSuccess, setGlowSuccess] = useState(false)
const [isAuthenticated, setIsAuthenticated] = useState(false)
const inputRef = useRef<HTMLInputElement | null>(null)

// Mock image component for demo
const MockImage = ({ src, alt, width, height, className }: any) => (

  <div 
    className={`${