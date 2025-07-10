"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, Users, Shield, MessageSquare, Star, ArrowRight, Zap, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  const [serverCount, setServerCount] = useState(0)

  useEffect(() => {
    fetch("/api/server-count")
      .then((res) => res.json())
      .then((data) => setServerCount(data.count))
      .catch(() => setServerCount(0))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto mobile-optimized py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center">
                <Image src="/bot-icon.png" alt="Dash Bot" width={32} height={32} className="rounded-lg" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-foreground">Dash</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground hover:bg-accent bg-transparent"
                >
                  Bejelentkezés
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Kezdés
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 gradient-bg">
        <div className="container mx-auto mobile-optimized text-center">
          <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Hero Illustration */}
            <div className="mb-8 sm:mb-12">
              <div className="relative mx-auto w-32 h-32 sm:w-48 sm:h-48 mb-6 sm:mb-8">
                <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
                <div className="absolute inset-4 bg-primary/20 rounded-full animate-bounce-in"></div>
                <div className="absolute inset-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground" />
                </div>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              A Legjobb Discord Bot
              <br />
              <span className="text-primary">A Te Szerveredhez</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              Hatékony moderáció, izgalmas funkciók és zökkenőmentes kezelés. Minden, amire szükséged van egy
              fantasztikus Discord közösség építéséhez.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8 sm:mb-12">
              <Link href="/login">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
                >
                  Discord-hoz Hozzáadás
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-border text-foreground hover:bg-accent text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-transparent"
              >
                Demó Megtekintése
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{serverCount.toLocaleString()} szerver</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Ingyenes örökre</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Azonnali beállítás</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-20 bg-muted/30">
        <div className="container mx-auto mobile-optimized">
          <div className="text-center mb-12 sm:mb-16 animate-slide-up">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">Minden, amire szükséged van</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Hatékony funkciók a Discord közösséged kezeléséhez és növeléséhez
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <Card className="modern-card group hover:scale-105 transition-transform duration-200">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">AI Moderáció</h3>
                <p className="text-sm text-muted-foreground">
                  Fejlett automatikus moderáció testreszabható szűrőkkel és műveletekkel
                </p>
              </CardContent>
            </Card>

            <Card className="modern-card group hover:scale-105 transition-transform duration-200">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Üdvözlő Rendszer</h3>
                <p className="text-sm text-muted-foreground">
                  Köszöntsd az új tagokat egyedi üzenetekkel és automatikus szerepkörökkel
                </p>
              </CardContent>
            </Card>

            <Card className="modern-card group hover:scale-105 transition-transform duration-200">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Ticket Rendszer</h3>
                <p className="text-sm text-muted-foreground">Professzionális ticket rendszer a tagok támogatásához</p>
              </CardContent>
            </Card>

            <Card className="modern-card group hover:scale-105 transition-transform duration-200">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Egyedi Parancsok</h3>
                <p className="text-sm text-muted-foreground">Hozz létre egyedi parancsokat és automatikus válaszokat</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto mobile-optimized">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="animate-slide-up">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Miért válaszd a Dash-t?</h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Gyors Beállítás</h3>
                    <p className="text-sm text-muted-foreground">
                      Percek alatt üzembe helyezhető, nincs szükség programozási tudásra
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">24/7 Működés</h3>
                    <p className="text-sm text-muted-foreground">Megbízható szolgáltatás 99.9% üzemidővel</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Folyamatos Fejlesztés</h3>
                    <p className="text-sm text-muted-foreground">Rendszeres frissítések és új funkciók</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl p-6 sm:p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-xl p-4 text-center">
                    <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">5 perc</div>
                    <div className="text-xs text-muted-foreground">Beállítási idő</div>
                  </div>
                  <div className="bg-card rounded-xl p-4 text-center">
                    <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">10K+</div>
                    <div className="text-xs text-muted-foreground">Elégedett felhasználó</div>
                  </div>
                  <div className="bg-card rounded-xl p-4 text-center">
                    <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">99.9%</div>
                    <div className="text-xs text-muted-foreground">Üzemidő</div>
                  </div>
                  <div className="bg-card rounded-xl p-4 text-center">
                    <Star className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">4.9/5</div>
                    <div className="text-xs text-muted-foreground">Értékelés</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-primary/5">
        <div className="container mx-auto mobile-optimized text-center">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">Készen állsz a kezdésre?</h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
              Csatlakozz a több ezer Discord szerverhez, amelyek a Dash-t használják fantasztikus közösségek
              létrehozásához.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/login">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
                >
                  Discord-hoz Hozzáadás
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-border text-foreground hover:bg-accent text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-transparent"
              >
                Dokumentáció
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 sm:py-8 bg-card">
        <div className="container mx-auto mobile-optimized">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Image src="/bot-icon.png" alt="Dash Bot" width={24} height={24} className="rounded" />
              <span className="font-semibold text-foreground">Dash</span>
            </div>
            <div className="text-sm text-muted-foreground text-center sm:text-right">
              © 2024 Dash Bot. Ingyenes örökre.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
