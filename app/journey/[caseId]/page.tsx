"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import JourneyDrilldown from "@/components/journey-drilldown"
import LoginPage from "@/components/login-page"

interface JourneyPageProps {
  params: Promise<{ caseId: string }>
}

export default function JourneyPage({ params }: JourneyPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [caseId, setCaseId] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const userEmail = localStorage.getItem("userEmail")
    if (userEmail) {
      setIsAuthenticated(true)
    }
    
    // Get the case ID from params
    params.then(resolvedParams => {
      setCaseId(resolvedParams.caseId)
      setIsLoading(false)
    })
  }, [params])

  const handleLogin = (email: string) => {
    setIsAuthenticated(true)
    localStorage.setItem("userEmail", email)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("userEmail")
    router.push("/")
  }

  const handleViewChange = (view: 'dashboard' | 'survey' | 'journey', newCaseId?: string) => {
    if (view === 'journey' && newCaseId) {
      router.push(`/journey/${newCaseId}`)
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

  return <JourneyDrilldown caseId={caseId} onLogout={handleLogout} onViewChange={handleViewChange} />
}