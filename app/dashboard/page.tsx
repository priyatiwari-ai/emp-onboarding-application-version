"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Dashboard from "@/components/onboarding-specialist-dashboard"
import LoginPage from "@/components/login-page"

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const userEmail = localStorage.getItem("userEmail")
    if (userEmail) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (email: string) => {
    setIsAuthenticated(true)
    localStorage.setItem("userEmail", email)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("userEmail")
    router.push("/")
  }

  const handleViewChange = (view: 'dashboard' | 'survey' | 'journey', caseId?: string) => {
    if (view === 'journey' && caseId) {
      router.push(`/journey/${caseId}`)
    } else if (view === 'survey') {
      router.push('/survey')
    } else {
      router.push('/dashboard')
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return <Dashboard onLogout={handleLogout} onViewChange={handleViewChange} />
}