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
      router.push("/dashboard")
    }
    setIsLoading(false)
  }, [router])

  const handleLogin = (email: string) => {
    setIsAuthenticated(true)
    localStorage.setItem("userEmail", email)
    router.push("/dashboard")
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isAuthenticated) {
    return <div>Redirecting...</div>
  }

  return <LoginPage onLogin={handleLogin} />
}
