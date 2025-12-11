"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import LoginPage from "@/components/login-page"

export default function Home() {
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
    
    // Clear previous session data to ensure fresh state on sign in
    sessionStorage.removeItem("hasCompletedInteraction")
    // Clear Alex Morgan related session storage to ensure fresh state
    sessionStorage.removeItem("alexInitialized")
    // Clear Alex Morgan localStorage values to ensure 0% start
    localStorage.removeItem('alexMorganChatCompleted')
    localStorage.removeItem('alexMorganStage')
    localStorage.removeItem('alexMorganProgress')
    localStorage.removeItem('alexMetricsUpdated')
    // Clear Jordan Lee localStorage values to ensure fresh BGC Pending state
    localStorage.removeItem('jordanLeeBGCCompleted')
    localStorage.removeItem('jordanLeeStage')
    localStorage.removeItem('jordanLeeProgress')
    localStorage.removeItem('jordanMetricsUpdated')
    sessionStorage.removeItem('jordanInitialized')
    sessionStorage.removeItem('jordanBGCCompleted')
    sessionStorage.removeItem('jordanTilesUpdated')
    // Clear tile counters to reset on sign in
    sessionStorage.removeItem("upcomingJoiners")
    sessionStorage.removeItem("pendingDocuments")
    sessionStorage.removeItem("pendingBGCCount")
    sessionStorage.removeItem("pendingIDCreationCount")
    sessionStorage.removeItem('onboardingsInProgress')
    sessionStorage.removeItem('dashboardTilesInitialized')
    router.push("/dashboard")
  }

  // Remove automatic redirect on authentication check
  // This allows users to see the login page when visiting root URL

  if (isLoading) {
    return <div>Loading...</div>
  }

  // Always show LoginPage on root URL - let it handle redirection if already authenticated
  return <LoginPage onLogin={handleLogin} />
}
