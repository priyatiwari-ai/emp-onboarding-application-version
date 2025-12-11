"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Mode = "assist" | "autonomous"

interface UserModeContextValue {
  mode: Mode
  setMode: (m: Mode) => void
}

const STORAGE_KEY = "user_mode"

const UserModeContext = createContext<UserModeContextValue | undefined>(undefined)

export const UserModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
      if (raw === "assist" || raw === "autonomous") return raw
    } catch (e) {
      // ignore
    }
    return "assist"
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch (e) {
      // ignore
    }
  }, [mode])

  return <UserModeContext.Provider value={{ mode, setMode }}>{children}</UserModeContext.Provider>
}

export function useUserMode() {
  const ctx = useContext(UserModeContext)
  if (!ctx) throw new Error("useUserMode must be used within UserModeProvider")
  return ctx
}

export default UserModeProvider
