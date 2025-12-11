import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { UserModeProvider } from '@/components/user-mode-context'

export const metadata: Metadata = {
 
  description: "Professional onboarding specialist management portal",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <UserModeProvider>{children}</UserModeProvider>
      </body>
    </html>
  )
}
