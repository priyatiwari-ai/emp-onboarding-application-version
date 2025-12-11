"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUserMode } from '@/components/user-mode-context'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Building2,
  Settings,
  LogOut,
  User,
  Bell,
  Search,
  Menu,
  Home,
  BarChart3,
  Users2
  , Zap
} from "lucide-react"

interface AppHeaderProps {
  userEmail?: string
  userRole?: string
  onLogout?: () => void
  showSearch?: boolean
  showNotifications?: boolean
  breadcrumbs?: { label: string; href?: string }[]
  onViewChange?: (view: 'dashboard' | 'survey' | 'journey', caseId?: string) => void
  notifications?: { id: string; title: string; message: string; type: string; read: boolean }[]
}

export function AppHeader({
  userEmail = "diane.prince@corespectrum.com",
  userRole = "Onboarding Specialist",
  onLogout,
  showSearch = true,
  showNotifications = true,
  breadcrumbs = [],
  onViewChange,
  notifications = []
}: AppHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const getUserInitials = (email: string) => {
    return email.split('@')[0].split('.').map(name => name[0]?.toUpperCase()).join('')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Left Section - Logo and Company */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <img 
              src="/dark-logo.svg" 
              alt="CoreSpectrum Logo" 
              className="h-10 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Onboarding Control Center</span>
            </div>
          </div>

          {/* Navigation Links */}
          {onViewChange && (
            <nav className="hidden lg:flex items-center gap-1">
              <Button
                variant="ghost"
                onClick={() => onViewChange('dashboard')}
                className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => onViewChange('survey')}
                className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                Engagement Surveys
              </Button>
            </nav>
          )}
        </div>        {/* Right Section - Search, Actions and User */}
        <div className="flex items-center gap-4">
          {/* Global Search */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  placeholder="Search employees, cases, or documents..."
                  className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Notifications */}
          {showNotifications && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 transition-colors">
                  <Bell className="h-5 w-5 text-slate-700" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 hover:bg-red-600">
                      {notifications.filter(n => !n.read).length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map(notification => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4 hover:bg-gray-50">
                      <div className="flex items-start space-x-3 w-full">
                        <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                          notification.type === 'warning' ? 'bg-yellow-500' : 
                          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled className="text-center py-4">
                    <span className="text-sm text-gray-500">No new notifications</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-slate-100">
                <Menu className="h-5 w-5 text-slate-700" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                {onViewChange && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        onViewChange('dashboard')
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-4 py-3 rounded-lg transition-colors justify-start"
                    >
                      <Home className="h-5 w-5" />
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        onViewChange('survey')
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-4 py-3 rounded-lg transition-colors justify-start"
                    >
                      <BarChart3 className="h-5 w-5" />
                      Engagement Surveys
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-auto px-3 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-slate-200 shadow-lg">
                    <AvatarImage src="/persona-avatar.png" alt={userEmail} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm">
                      {getUserInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start text-left">
                    <span className="text-sm font-semibold text-slate-900">{userEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <span className="text-xs text-slate-600">{userRole}</span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-gray-900">{userEmail}</p>
                  <p className="text-xs leading-none text-gray-500">{userRole}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-3 py-2">
                <ModeToggle />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-gray-50 transition-colors">
                <User className="mr-2 h-4 w-4 text-gray-600" />
                <span className="text-gray-700">Profile Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              {onLogout && (
                <DropdownMenuItem onClick={onLogout} className="text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

function ModeToggle() {
  const { mode, setMode } = useUserMode()

  const isAssist = mode === 'assist'
  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Assistant Mode</p>
          <p className="text-xs text-slate-500">Choose how the AI assistant behaves</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="relative inline-grid grid-cols-2 gap-0 p-1 bg-slate-100 rounded-full w-44 overflow-hidden">
          <div
            className={`absolute top-1 h-8 rounded-full shadow-md transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-500 z-0 pointer-events-none`}
            style={{
              width: 'calc(50% + 0.25rem)',
              left: isAssist ? '-0.125rem' : 'calc(50% - 0.125rem)'
            }}
            aria-hidden
          />

          <button
            onClick={() => setMode('assist')}
            className={`relative z-20 overflow-visible w-full flex items-center justify-center gap-0 py-1 px-3 text-sm font-medium rounded-full transition-colors duration-150 ${isAssist ? 'text-white' : 'text-slate-700'}`}
            aria-pressed={isAssist}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <User className="relative z-30 h-4 w-4 flex-shrink-0 stroke-current" />
            <span className="select-none ml-1">Assist</span>
          </button>

          <button
            onClick={() => setMode('autonomous')}
            className={`relative z-20 overflow-visible w-full flex items-center justify-center gap-0 py-1 px-3 text-sm font-medium rounded-full transition-colors duration-150 ${isAssist ? 'text-slate-700' : 'text-white'}`}
            aria-pressed={!isAssist}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Zap className="relative z-30 h-4 w-4 flex-shrink-0 stroke-current" />
            <span className="select-none" style={{ marginLeft: 4 }}>Autonomous</span>
          </button>
        </div>
      </div>
    </div>
  )
}