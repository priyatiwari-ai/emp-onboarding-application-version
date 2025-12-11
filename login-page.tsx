"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, HelpCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const VALID_CREDENTIALS = [
  { email: "diane.prince@corespectrum.com", password: "Demo@1234" },
  { email: "hradmin@company.com", password: "Demo@1234" },
]

export default function LoginPage({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validation
    if (!email || !password) {
      setError("Both email and password are required")
      setLoading(false)
      return
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError("Please enter a valid email address")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const isValid = VALID_CREDENTIALS.some((cred) => cred.email === email && cred.password === password)

    if (isValid) {
      onLogin(email)
    } else {
      setError("Invalid credentials. Please try: diane.prince@corespectrum.com / Demo@1234")
    }

    setLoading(false)
  }

  const handleForgotPassword = () => {
    alert("Forgot Password feature is not functional in this demo version.")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="flex min-h-screen items-center justify-center relative overflow-hidden px-4">
        {/* Background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-white/40"></div>
          <div className="relative z-10">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <img 
                src="/dark-logo.svg" 
                alt="Company Logo" 
                className="h-32 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-indigo-700 mb-2">
              Onboarding Control Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11"
                  required
                  minLength={8}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="flex flex-col space-y-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-primary hover:text-primary/80 hover:bg-primary/10"
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </Button>

                <Dialog>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        <span>Need Access?</span>
                      </DialogTitle>
                      <DialogDescription className="text-left">
                        <div className="space-y-3 mt-4">
                          
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="font-medium text-blue-900 mb-2">Demo Credentials:</p>
                            <div className="space-y-1 text-sm">
                              <p><strong>Onboarding Specialist:</strong><br />
                              Email: diane.prince@corespectrum.com<br />
                              Password: Demo@1234</p>
                              <p><strong>HR Admin:</strong><br />
                              Email: hradmin@company.com<br />
                              Password: Demo@1234</p>
                            </div>
                          </div>

                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <p className="text-yellow-800 text-sm">
                              <strong>Note:</strong> All data shown is simulated for demonstration purposes. 
                              No real employee information is used or stored.
                            </p>
                          </div>

                          <p className="text-sm text-gray-600">
                            For production access, please contact your system administrator.
                          </p>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
            </form>
          </CardContent>
          </div>
        </Card>
      </div>
    </div>
  )
}
