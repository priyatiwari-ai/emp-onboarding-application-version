"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  Filter, 
  Bell,
  LogOut, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Shield,
  Eye,
  MessageSquare,
  AlertCircle,
  UserPlus,
  TrendingUp,
  Calendar,
  Building2,
  Menu,
  X,
  Bot,
  IdCard
} from "lucide-react"
import { 
  generateOnboardingCases,
  getDashboardMetrics,
  getStageDistribution,
  getDepartmentMetrics,
  generateAgentActivity,
  generateNotifications,
  DEPARTMENTS 
} from "@/lib/mockData"
import { telemetryService, TelemetryEvent } from "@/lib/telemetry"
import { 
  OnboardingCase, 
  DashboardMetrics, 
  StageDistribution, 
  DepartmentMetrics,
  AgentActivity,
  Notification,
  DashboardFilters,
  OnboardingStage,
  Department,
  CaseStatus,
  AgentType 
} from "@/lib/types"
import { ChatAIDialog } from "@/components/ui/chat-ai-dialog"

interface OnboardingSpecialistDashboardProps {
  onLogout: () => void
  onViewChange: (view: 'dashboard' | 'survey' | 'journey', caseId?: string) => void
}

export default function OnboardingSpecialistDashboard({ 
  onLogout, 
  onViewChange 
}: OnboardingSpecialistDashboardProps) {
  // Debug log
  console.log('Dashboard rendering')
  
  const [cases, setCases] = useState<OnboardingCase[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [stageDistribution, setStageDistribution] = useState<StageDistribution[]>([])
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetrics[]>([])
  const [agentActivity, setAgentActivity] = useState<AgentActivity[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([])
  const [filters, setFilters] = useState<DashboardFilters>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Track Alex Morgan chat progress - ALWAYS start at 0 for ANY login
  const [alexMorganProgress, setAlexMorganProgress] = useState(0)
  
  // Track Jordan Lee chat progress - start at 15% (BGC Pending)
  const [jordanLeeProgress, setJordanLeeProgress] = useState(15)
  
  // Track specific dashboard tile metrics - load from sessionStorage to persist across page refreshes
  const [upcomingJoiners, setUpcomingJoiners] = useState(() => {
    const saved = sessionStorage.getItem('upcomingJoiners')
    return saved ? parseInt(saved) : 15
  })
  const [pendingDocuments, setPendingDocuments] = useState(() => {
    const saved = sessionStorage.getItem('pendingDocuments')
    return saved ? parseInt(saved) : 5
  })
  
  // Track pending BGC and ID Creation counts for Jordan workflow
  const [pendingBGC, setPendingBGC] = useState(() => {
    const saved = sessionStorage.getItem('pendingBGCCount')
    return saved ? parseInt(saved) : 18  // Default changed to requested value
  })
  const [pendingIDCreation, setPendingIDCreation] = useState(() => {
    const saved = sessionStorage.getItem('pendingIDCreationCount')
    return saved ? parseInt(saved) : 20  // Default changed to requested value
  })

  // Horizontal span: Onboardings in Progress (start at 43 by requirement)
  const [onboardingsInProgress, setOnboardingsInProgress] = useState(() => {
    const saved = sessionStorage.getItem('onboardingsInProgress')
    return saved ? parseInt(saved) : 43
  })
  
  // Chat AI Dialog state
  const [chatDialogOpen, setChatDialogOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<{
    id: string
    name: string
    stage: string
  } | null>(null)

  // Load data on component mount
  useEffect(() => {
    const loadData = () => {
      // Clear Alex Morgan localStorage values on initial load to ensure clean state
      const shouldResetAlex = !sessionStorage.getItem('alexInitialized')
      if (shouldResetAlex) {
        localStorage.removeItem('alexMorganStage')
        localStorage.removeItem('alexMorganProgress')
        localStorage.removeItem('alexMorganChatCompleted')
        localStorage.removeItem('alexMetricsUpdated')
        
        sessionStorage.setItem('alexInitialized', 'true')
        console.log('Reset Alex Morgan state for fresh session')
      }
      
      // Clear Jordan Lee localStorage values on initial load to ensure clean state
      const shouldResetJordan = !sessionStorage.getItem('jordanInitialized')
      if (shouldResetJordan) {
        localStorage.removeItem('jordanLeeStage')
        localStorage.removeItem('jordanLeeProgress')
        localStorage.removeItem('jordanLeeBGCCompleted')
        localStorage.removeItem('jordanMetricsUpdated')
        sessionStorage.removeItem('jordanBGCCompleted')
        sessionStorage.removeItem('jordanTilesUpdated')
        
        sessionStorage.setItem('jordanInitialized', 'true')
        console.log('Reset Jordan Lee state for fresh session')
      }
      
      const casesData = generateOnboardingCases()
      setCases(casesData)
      setMetrics(getDashboardMetrics())
      setStageDistribution(getStageDistribution())
      setDepartmentMetrics(getDepartmentMetrics())
      setNotifications(generateNotifications())

      // Ensure the initial values for the five KPI tiles are persisted during first load
      const tilesInitialized = sessionStorage.getItem('dashboardTilesInitialized')
      if (!tilesInitialized) {
        sessionStorage.setItem('upcomingJoiners', '15')
        sessionStorage.setItem('pendingDocuments', '5')
        sessionStorage.setItem('pendingBGCCount', '18')
        sessionStorage.setItem('pendingIDCreationCount', '20')
        sessionStorage.setItem('onboardingsInProgress', '43')
        setUpcomingJoiners(15)
        setPendingDocuments(5)
        setPendingBGC(18)
        setPendingIDCreation(20)
        setOnboardingsInProgress(43)
        sessionStorage.setItem('dashboardTilesInitialized', 'true')
        console.log('Initialized dashboard tiles in sessionStorage with default values')
      }
      
      // Generate recent agent activity from first few cases
      const recentActivity: AgentActivity[] = []
      casesData.slice(0, 5).forEach((caseItem) => {
        recentActivity.push(...generateAgentActivity(caseItem.id).slice(0, 2))
      })
      setAgentActivity(recentActivity.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10))
    }

    loadData()

    // Debug: Log initial tile state
    console.log('🏗️ Dashboard initialized with tile counts:', {
      pendingBGC: pendingBGC,
      pendingIDCreation: pendingIDCreation,
      jordanProgress: jordanLeeProgress,
      jordanBGCCompleted: sessionStorage.getItem('jordanBGCCompleted'),
      jordanBGCCompletedLS: localStorage.getItem('jordanLeeBGCCompleted'),
      jordanTilesUpdated: sessionStorage.getItem('jordanTilesUpdated')
    })

    // Subscribe to telemetry events
    const unsubscribe = telemetryService.subscribe((events) => {
      setTelemetryEvents(events)
    })

    // Subscribe to notifications from telemetry
    const unsubscribeNotifications = telemetryService.subscribeToNotifications((notification: Notification) => {
      setNotifications((prev: Notification[]) => [notification, ...prev.slice(0, 9)]) // Keep latest 10 notifications
    })

    return () => {
      unsubscribe()
      unsubscribeNotifications()
    }
  }, [])

  // Monitor for chat completion to update Alex progress (only during current session)
  useEffect(() => {
    const checkAlexProgress = () => {
      const hasCompletedInteraction = sessionStorage.getItem('hasCompletedInteraction')
      
      // ONLY update if chat was completed in THIS session and Alex is currently at 0%
      if (hasCompletedInteraction === 'true' && alexMorganProgress === 0) {
        console.log('Alex Morgan chat completed - updating progress from 0% to 5%')
        setAlexMorganProgress(5)
        
        // Set localStorage values for File Upload Pending stage
        localStorage.setItem('alexMorganStage', 'File Upload Pending')
        localStorage.setItem('alexMorganProgress', '5')
        // Notify other parts of the app (journey page) in same-tab flows
        try { window.dispatchEvent(new Event('alexMorganUpdate')) } catch (e) { /* noop */ }
        
        // Update metrics to reflect the changes only once per session
        const metricsUpdated = localStorage.getItem('alexMetricsUpdated')
        if (!metricsUpdated) {
          console.log('Updating dashboard metrics for Alex Morgan stage change (0% → 5%)')
          
          // Only update tile counters if they haven't been updated yet
          const currentUpcoming = parseInt(sessionStorage.getItem('upcomingJoiners') || '15')
          const currentPending = parseInt(sessionStorage.getItem('pendingDocuments') || '5')
          
          if (currentUpcoming === 15 && currentPending === 5) {
            console.log('Updating tile counters: Upcoming 15→14, Pending 5→6')
            // Update specific tile counters and save to sessionStorage
            setUpcomingJoiners(prev => {
              const newValue = prev - 1  // 15 → 14
              sessionStorage.setItem('upcomingJoiners', newValue.toString())
              return newValue
            })
            setPendingDocuments(prev => {
              const newValue = prev + 1  // 5 → 6
              sessionStorage.setItem('pendingDocuments', newValue.toString())
              return newValue
            })
            // Increment Onboardings in Progress by 1 when a case moves from Upcoming Joiners -> Pending Documents (Alex flow)
            setOnboardingsInProgress(prev => {
              const next = prev + 1
              sessionStorage.setItem('onboardingsInProgress', next.toString())
              return next
            })
          } else {
            console.log('Tile counters already updated, skipping update')
          }
          
          setMetrics(prev => prev ? {
            ...prev,
            activeJourneys: prev.activeJourneys + 1,  // Alex now has an active journey
            dueToday: prev.dueToday + 1,              // File Upload task due today
            bgvPending: prev.bgvPending + 1           // Will need BGV after file upload
          } : null)
          
          // Update stage distribution: decrease Not Started, increase Preboarding
          setStageDistribution(prev => prev.map(stage => {
            if (stage.stage === 'Not Started') {
              return { ...stage, count: Math.max(0, stage.count - 1) }
            } else if (stage.stage === 'Preboarding') {
              return { ...stage, count: stage.count + 1 }
            }
            return stage
          }))
          
          // Update department metrics for IT & Automation
          setDepartmentMetrics(prev => prev.map(dept => {
            if (dept.department === 'IT & Automation') {
              return {
                ...dept,
                active: dept.active + 1
              }
            }
            return dept
          }))
          
          localStorage.setItem('alexMetricsUpdated', 'true')
        }
      }
    }
    
    checkAlexProgress()
    
    // Check periodically for updates
    const interval = setInterval(checkAlexProgress, 1000)
    
    return () => clearInterval(interval)
  }, [alexMorganProgress])

  // Monitor for Jordan Lee BGC completion - EXACT same pattern as Alex
  useEffect(() => {
    const checkJordanProgress = () => {
      const hasJordanCompleted = sessionStorage.getItem('jordanBGCCompleted')
      
      // ONLY update if chat was completed and Jordan is currently at 15%
      if (hasJordanCompleted === 'true' && jordanLeeProgress === 15) {
        console.log('Jordan Lee BGC completed - updating progress from 15% to 35%')
        setJordanLeeProgress(35)
        
        // Set localStorage values for ID Creation Pending stage
        localStorage.setItem('jordanLeeStage', 'ID Creation Pending')
        localStorage.setItem('jordanLeeProgress', '35')
        // Notify other parts of the app (journey page) in same-tab flows
        try { window.dispatchEvent(new Event('jordanUpdate')) } catch (e) { /* noop */ }
        
        // Update metrics to reflect the changes only once per session
        const metricsUpdated = localStorage.getItem('jordanMetricsUpdated')
        if (!metricsUpdated) {
          console.log('Updating dashboard metrics for Jordan stage change (15% → 35%)')
          
          // Only update tile counters if they haven't been updated yet
          const currentBGC = parseInt(sessionStorage.getItem('pendingBGCCount') || '18')
          const currentID = parseInt(sessionStorage.getItem('pendingIDCreationCount') || '20')
          
          if (currentBGC === 18 && currentID === 20) {
            console.log('Updating tile counters: BGC 18→17, ID Creation 20→21')
            // Update specific tile counters and save to sessionStorage
            setPendingBGC(prev => {
              const newValue = prev - 1  // 18 → 17
              sessionStorage.setItem('pendingBGCCount', newValue.toString())
              return newValue
            })
            setPendingIDCreation(prev => {
              const newValue = prev + 1  // 20 → 21
              sessionStorage.setItem('pendingIDCreationCount', newValue.toString())
              return newValue
            })
            // Onboardings increment moved to Alex flow to reflect Upcoming→Pending Documents movement
          } else {
            console.log('Tile counters already updated, skipping update')
          }
          
          setMetrics(prev => prev ? {
            ...prev,
            activeJourneys: prev.activeJourneys + 1,
            bgvPending: Math.max(0, prev.bgvPending - 1)
          } : null)
          
          // Update stage distribution
          setStageDistribution(prev => prev.map(stage => {
            if (stage.stage === 'BGC Pending') {
              return { ...stage, count: Math.max(0, stage.count - 1) }
            }
            if (stage.stage === 'Week 1') {
              return { ...stage, count: stage.count + 1 }
            }
            return stage
          }))
          
          localStorage.setItem('jordanMetricsUpdated', 'true')
        }
      }
    }
    
    checkJordanProgress()
    
    // Check periodically for updates
    const interval = setInterval(checkJordanProgress, 1000)
    
    return () => clearInterval(interval)
  }, [jordanLeeProgress])

  // Listen for Alex Morgan workflow updates
  useEffect(() => {
    const handleAlexMorganUpdate = () => {
      const alexStage = localStorage.getItem('alexMorganStage')
      const alexProgress = localStorage.getItem('alexMorganProgress')
      const alexBGCReady = localStorage.getItem('alexMorganBGCReady')
      
      console.log('Alex Morgan update check:', { alexStage, alexProgress, alexBGCReady, chatDialogOpen })
      
      if (alexStage && alexProgress) {
        setAlexMorganProgress(parseInt(alexProgress))
        
        // Auto-open chat disabled to prevent chaos
        // if (alexStage === 'Pulling BGC Reports' && !chatDialogOpen) {
        //   console.log('Conditions met - Auto-opening chat for Alex Morgan BGC workflow')
        //   setSelectedCandidate({
        //     id: 'alex-morgan-001',
        //     name: 'Alex Morgan',
        //     stage: alexStage
        //   })
        //   setChatDialogOpen(true)
        // }
      }
    }

    // Listen for custom events
    const handleCustomEvent = (event: Event) => {
      console.log('Custom event received:', event.type)
      handleAlexMorganUpdate()
    }

    // Listen for storage events (in case custom events don't work)
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'alexMorganStage' || event.key === 'alexMorganBGCReady') {
        console.log('Storage event detected:', event.key, event.newValue)
        setTimeout(handleAlexMorganUpdate, 100)
      }
    }

    window.addEventListener('alexMorganUpdate', handleCustomEvent)
    window.addEventListener('storage', handleStorageEvent)
    
    // Check on mount and periodically
    handleAlexMorganUpdate()
    const interval = setInterval(handleAlexMorganUpdate, 2000)
    
    return () => {
      window.removeEventListener('alexMorganUpdate', handleCustomEvent)
      window.removeEventListener('storage', handleStorageEvent)
      clearInterval(interval)
    }
  }, [chatDialogOpen])


  // Listen for Jordan workflow updates (localStorage/session flags)
  useEffect(() => {
    const handleJordanUpdate = () => {
      const jordanStage = localStorage.getItem('jordanLeeStage')
      const jordanProgress = localStorage.getItem('jordanLeeProgress')
      const sessionCompleted = sessionStorage.getItem('jordanBGCCompleted')
      console.log('Jordan update check:', { jordanStage, jordanProgress, sessionCompleted })
      if (jordanProgress) {
        setJordanLeeProgress(parseInt(jordanProgress))
      } else if (sessionCompleted === 'true') {
        // If session indicates completion but localStorage not set, set progress to 15
        setJordanLeeProgress(15)
      }
    }

    const handleCustomEvent = (e: Event) => {
      console.log('Custom event received for Jordan:', e.type)
      handleJordanUpdate()
    }

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'jordanLeeProgress' || event.key === 'jordanLeeStage' || event.key === 'jordanBGCCompleted') {
        setTimeout(handleJordanUpdate, 100)
      }
    }

    window.addEventListener('jordanUpdate', handleCustomEvent)
    window.addEventListener('storage', handleStorageEvent)

    // Initial check and periodic polling
    handleJordanUpdate()
    const interval = setInterval(handleJordanUpdate, 2000)

    return () => {
      window.removeEventListener('jordanUpdate', handleCustomEvent)
      window.removeEventListener('storage', handleStorageEvent)
      clearInterval(interval)
    }
  }, [chatDialogOpen])



  // Filter and search cases
  const filteredCases = useMemo(() => {
    let filtered = cases

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((caseItem: OnboardingCase) =>
        caseItem.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        caseItem.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply stage filter
    if (filters.stage && filters.stage.length > 0) {
      filtered = filtered.filter((caseItem: OnboardingCase) => filters.stage!.includes(caseItem.stage))
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((caseItem: OnboardingCase) => filters.status!.includes(caseItem.status))
    }

    // Apply department filter
    if (filters.department && filters.department.length > 0) {
      filtered = filtered.filter((caseItem: OnboardingCase) => filters.department!.includes(caseItem.department as Department))
    }

    // Update Alex Morgan's details dynamically
    filtered = filtered.map((caseItem: OnboardingCase) => {
      if (caseItem.employeeName === 'Alex Morgan') {
        const today = new Date().toISOString().split('T')[0]
        const alexStage = localStorage.getItem('alexMorganStage')
        const alexProgress = localStorage.getItem('alexMorganProgress')
        const hasCompletedInteraction = sessionStorage.getItem('hasCompletedInteraction')
        const alexChatCompleted = localStorage.getItem('alexMorganChatCompleted')
        
        console.log('Alex Morgan case processing:', {
          alexStage,
          alexProgress,
          hasCompletedInteraction,
          alexChatCompleted,
          currentProgress: alexMorganProgress
        })
        
        let stage = 'Not Started' as OnboardingStage // Start with Not Started initially
        let dueNext = 'Onboarding Initiation' // Initial due next
        let status = 'Pending' as CaseStatus
        let progressPercent = 0 // Start at 0%
        
        // After chat completion, update to File Upload Pending
        if (hasCompletedInteraction === 'true' || alexChatCompleted === 'true' || alexStage === 'File Upload Pending') {
          stage = 'Preboarding'
          dueNext = 'File Upload Pending'
          status = 'Pending'
          progressPercent = 5
          console.log('Alex Morgan updated to File Upload Pending state')
        } else if (alexStage === 'Pulling BGC Reports') {
          stage = 'Week 1'
          dueNext = 'BGC Review Pending'
          status = 'InProgress'
          progressPercent = alexProgress ? parseInt(alexProgress) : 20
          console.log('Alex Morgan in BGC pulling state')
        } else {
          // Use current progress from state
          progressPercent = alexMorganProgress
          console.log('Alex Morgan in initial state with progress:', progressPercent)
        }
        
        // If this is the Alex Morgan row, show '(today)' inline with the dueNext label
        if (caseItem.employeeName === 'Alex Morgan') {
          dueNext = `${dueNext} (today)`
        }

        const updatedCase = {
          ...caseItem,
          role: 'Senior Software Engineer',
          stage: stage,
          status: status,
          dueNext: dueNext,
          dueDate: today,
          exceptionCount: 0,
          progressPercent: progressPercent
        }
        
        console.log('Alex Morgan final case data:', updatedCase)
        return updatedCase
      }
      return caseItem
    })

    // Update Jordan Lee's details based on BGC completion
    filtered = filtered.map((caseItem: OnboardingCase) => {
      if (caseItem.employeeName === 'Jordan Lee') {
        const today = new Date().toISOString().split('T')[0]
        const jordanStage = localStorage.getItem('jordanLeeStage')
        const jordanProgress = localStorage.getItem('jordanLeeProgress')
        
        let stage: OnboardingStage = 'BGC Pending'
        let status: CaseStatus = 'Pending'
        let dueNext = 'BGC Review'
        let progressPercent = jordanLeeProgress
        
        // If Jordan BGC was completed in chat, show resolved exception and pending ID creation
        const sessionCompleted = sessionStorage.getItem('jordanBGCCompleted')
        if (sessionCompleted === 'true' || (jordanStage === 'ID Creation Pending' && jordanProgress === '35')) {
          // Internally represent as a valid stage/status but display functions will show the custom labels
          stage = 'Week 1'
          status = 'InProgress'
          // Set due date to 3 days from today for near future
          const nearFutureDate = new Date()
          nearFutureDate.setDate(nearFutureDate.getDate() + 3)
          const formattedDate = nearFutureDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
          dueNext = `Pending ID creation (${formattedDate})`
          progressPercent = 35
          console.log('Jordan Lee updated to Exception Resolved / Pending ID creation state')
        } else {
          // Use current progress from state (starts at 5% for BGC Pending)
          progressPercent = jordanLeeProgress
          console.log('Jordan Lee in BGC Pending state with progress:', progressPercent)
        }
        
        const sessionCompletedFlag = sessionStorage.getItem('jordanBGCCompleted')
        const updatedCase = {
          ...caseItem,
          role: 'Programmer',
          stage: stage,
          status: status,
          dueNext: dueNext,
          dueDate: today,
          // Clear exceptions only when the session/completion flag indicates Jordan's BGC was adjudicated
          exceptionCount: sessionCompletedFlag === 'true' ? 0 : 0,
          progressPercent: progressPercent
        }
        
        console.log('Jordan Lee final case data:', updatedCase)
        return updatedCase
      }
      return caseItem
    })

    return filtered
  }, [cases, searchQuery, filters, alexMorganProgress, jordanLeeProgress])

  // Handle filter changes
  const handleStageFilter = (stage: OnboardingStage) => {
    setFilters((prev: DashboardFilters) => ({
      ...prev,
      stage: prev.stage?.includes(stage) 
        ? prev.stage.filter((s: OnboardingStage) => s !== stage)
        : [...(prev.stage || []), stage]
    }))
  }

  const handleStatusFilter = (status: CaseStatus) => {
    setFilters((prev: DashboardFilters) => ({
      ...prev,
      status: prev.status?.includes(status)
        ? prev.status.filter((s: CaseStatus) => s !== status)
        : [...(prev.status || []), status]
    }))
  }

  const handleDepartmentFilter = (department: Department) => {
    setFilters((prev: DashboardFilters) => ({
      ...prev,
      department: prev.department?.includes(department)
        ? prev.department.filter((d: Department) => d !== department)
        : [...(prev.department || []), department]
    }))
  }

  // Handle chat dialog
  const handleOpenChatDialog = (candidate: OnboardingCase) => {
    setSelectedCandidate({
      id: candidate.id,
      name: candidate.employeeName,
      stage: candidate.stage
    })
    setChatDialogOpen(true)
    
    // Clear completion flags when opening chat - simple like Alex
    if (candidate.employeeName === 'Alex Morgan') {
      localStorage.removeItem('alexMorganChatCompleted')
    }
    if (candidate.employeeName === 'Jordan Lee') {
      sessionStorage.removeItem('jordanBGCCompleted')
      sessionStorage.removeItem('jordanTilesUpdated')
    }
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery("")
  }

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'InProgress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Blocked': return 'bg-red-100 text-red-800 border-red-200'
      case 'At Risk': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Onboarding to be initiated': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStageColor = (stage: OnboardingStage) => {
    switch (stage) {
      case 'Preboarding': return 'bg-purple-100 text-purple-800'
      case 'Day 1': return 'bg-blue-100 text-blue-800'
      case 'Week 1': return 'bg-indigo-100 text-indigo-800'
      case 'Day 30': return 'bg-green-100 text-green-800'
      case 'Day 90': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Helper function to get display stage for Jordan Lee (display only, preserves functionality)
  const getDisplayStage = (employeeName: string, stage: OnboardingStage) => {
    if (employeeName === 'Jordan Lee') {
      const lsProgress = localStorage.getItem('jordanLeeProgress')
      const sessionCompleted = sessionStorage.getItem('jordanBGCCompleted')
      // If Jordan progressed to 15% (BGC adjudicated), show resolved stage
      if (jordanLeeProgress >= 35 || lsProgress === '35' || sessionCompleted === 'true') {
        return 'Exception Resolved'
      }
      return 'BGC Exception'
    }
    return stage
  }

  // Helper function to get display status for Jordan Lee (display only, preserves functionality)
  const getDisplayStatus = (employeeName: string, status: CaseStatus) => {
    if (employeeName === 'Jordan Lee') {
      const lsProgress = localStorage.getItem('jordanLeeProgress')
      const sessionCompleted = sessionStorage.getItem('jordanBGCCompleted')
      // After BGC adjudication completes, status becomes Pending ID creation
      if (jordanLeeProgress >= 35 || lsProgress === '35' || sessionCompleted === 'true') {
        return 'Pending ID creation'
      }
      return 'BGC Adjudication'
    }
    return status
  }

  // Helper function to get display name for Jordan Lee (display only, preserves functionality)
  const getDisplayName = (employeeName: string) => {
    if (employeeName === 'Jordan Lee') {
      return 'Jordan Smith'
    }
    return employeeName
  }

  // Helper function to get display exception count for Jordan Lee (display only, preserves functionality)
  const getDisplayExceptionCount = (employeeName: string, originalCount: number) => {
    if (employeeName === 'Jordan Lee') {
      const sessionCompleted = sessionStorage.getItem('jordanBGCCompleted')
      // If Jordan's BGC completed in this session, show 0 exceptions
      if (sessionCompleted === 'true') return 0
      // Default display override prior to completion
      return 1
    }
    return originalCount
  }

  // Helper function to get stage color for display stage including Jordan Lee custom stage
  const getDisplayStageColor = (employeeName: string, stage: OnboardingStage) => {
    if (employeeName === 'Jordan Lee') {
      const lsProgress = localStorage.getItem('jordanLeeProgress')
      const sessionCompleted = sessionStorage.getItem('jordanBGCCompleted')
      if (jordanLeeProgress >= 35 || lsProgress === '35' || sessionCompleted === 'true') {
        return 'bg-emerald-100 text-emerald-800' // Resolved -> green
      }
      return 'bg-red-100 text-red-800' // Custom color for BGC Exception
    }
    return getStageColor(stage)
  }

  // Helper function to get status color for display status including Jordan Lee custom status
  const getDisplayStatusColor = (employeeName: string, status: CaseStatus) => {
    if (employeeName === 'Jordan Lee') {
      const lsProgress = localStorage.getItem('jordanLeeProgress')
      const sessionCompleted = sessionStorage.getItem('jordanBGCCompleted')
      if (jordanLeeProgress >= 35 || lsProgress === '35' || sessionCompleted === 'true') {
        return 'bg-amber-100 text-amber-800 border-amber-200' // Pending ID creation -> amber
      }
      return 'bg-orange-100 text-orange-800 border-orange-200' // Custom color for BGC Adjudication
    }
    return getStatusColor(status)
  }

  const formatAgentName = (agent: string) => {
    return agent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getDueDateColor = (dueDate: string, status: CaseStatus) => {
    if (status === 'Completed') return 'text-green-600'
    
    const today = new Date()
    const due = new Date(dueDate)
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24))
    
    if (diffDays < 0) return 'text-red-600 font-medium' // Overdue
    if (diffDays === 0) return 'text-orange-600 font-medium' // Due today
    if (diffDays <= 2) return 'text-yellow-600' // Due soon
    return 'text-gray-600'
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content with proper spacing */}
      <div className="p-6 pt-24">
        {/* Top Section - Two Column Layout */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-6">
            {/* First Column - KPI Tiles (2/3 width) */}
            <div className="col-span-2 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg shadow-md border border-slate-200 p-4">
              <h3 className="text-lg font-semibold text-indigo-700 mb-8">Key Performance Indicators</h3>
              <div className="grid grid-cols-5 gap-6 items-center justify-center mt-6">
                {/* Horizontal Span for Total */}
                <div className="col-start-2 col-span-3 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 border border-blue-800 rounded-md p-1 text-center shadow-md flex items-center justify-center">
                  <div className="text-lg font-bold text-white mr-2">Onboardings in Progress</div>
                  <div className="text-lg font-bold text-gray-200">{onboardingsInProgress}</div>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-6 items-center justify-center mt-6">
                {/* Upcoming Joiners */}
                <Card className="bg-white border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-indigo-300 hover:bg-blue-50 h-24">
                  <CardContent className="p-3 h-full flex flex-col items-center justify-center">
                    <UserPlus className="h-8 w-8 text-indigo-600 mb-2" />
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-indigo-700 mb-0.5">{upcomingJoiners}</div>
                      <p className="text-sm font-bold text-indigo-600">Upcoming Joiners</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Documents */}
                <Card className="bg-white border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-indigo-300 hover:bg-orange-50 h-24">
                  <CardContent className="p-3 h-full flex flex-col items-center justify-center">
                    <FileText className="h-8 w-8 text-orange-600 mb-2" />
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-indigo-700 mb-0.5">{pendingDocuments}</div>
                      <p className="text-sm font-bold text-indigo-600">Pending Documents</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending BGC */}
                <Card className="bg-white border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-indigo-300 hover:bg-purple-50 h-24">
                  <CardContent className="p-3 h-full flex flex-col items-center justify-center">
                    <Shield className="h-8 w-8 text-purple-600 mb-2" />
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-indigo-700 mb-0.5">{pendingBGC}</div>
                      <p className="text-sm font-bold text-indigo-600">Pending BGC</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending ID Creation */}
                <Card className="bg-white border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-indigo-300 hover:bg-amber-50 h-24">
                  <CardContent className="p-3 h-full flex flex-col items-center justify-center">
                    <IdCard className="h-8 w-8 text-amber-600 mb-2" />
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-indigo-700 mb-0.5">{pendingIDCreation}</div>
                      <p className="text-sm font-bold text-indigo-600">Pending ID Creation</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Successfully Onboarded */}
                <Card className="bg-white border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-indigo-300 hover:bg-green-50 h-24">
                  <CardContent className="p-3 h-full flex flex-col items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-indigo-700 mb-0.5">72</div>
                      <p className="text-sm font-bold text-indigo-600">Successfully Onboarded</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Second Column - Business Metrics (1/3 width) */}
            <div className="col-span-1 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-lg shadow-md border border-slate-200 p-3">
              <h3 className="text-lg font-semibold text-indigo-700 mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 text-indigo-600 mr-2" />
                Business Metrics
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Time to Onboard */}
                <Card className="bg-white border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-indigo-300 hover:bg-blue-50 h-24">
                  <CardContent className="p-3 h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-indigo-700 mb-0.5">14.2</div>
                      <p className="text-sm font-bold text-indigo-600 leading-tight">Days to<br/>Onboard</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Candidate Satisfaction */}
                <Card className="bg-white border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-indigo-300 hover:bg-green-50 h-24">
                  <CardContent className="p-3 h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-indigo-700 mb-0.5">4.7</div>
                      <p className="text-sm font-bold text-indigo-600 leading-tight">Satisfaction</p>
                    </div>
                  </CardContent>
                </Card>

                {/* BGC Time */}
                <Card className="bg-white border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-indigo-300 hover:bg-purple-50 h-24">
                  <CardContent className="p-3 h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-indigo-700 mb-0.5">5.8</div>
                      <p className="text-sm font-bold text-indigo-600 leading-tight">BGC Days</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Success Rate */}
                <Card className="bg-white border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-indigo-300 hover:bg-emerald-50 h-24">
                  <CardContent className="p-3 h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-indigo-700 mb-0.5">96.4%</div>
                      <p className="text-sm font-bold text-indigo-600 leading-tight">Success Rate</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Journey List - Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">Onboarding Journeys</CardTitle>
                    <CardDescription className="text-gray-600">
                      {filteredCases.length} of {cases.length} journeys
                      {(filters.stage?.length || filters.status?.length || filters.department?.length || searchQuery) && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={clearFilters}
                          className="ml-2 p-0 text-blue-600 hover:text-blue-800"
                        >
                          Clear filters
                        </Button>
                      )}
                    </CardDescription>
                  </div>
                    <div className="flex items-center space-x-2">
                      {/* Search for mobile */}
                      <div className="sm:hidden relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-40"
                        />
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-1" />
                            Filter
                            {(filters.stage?.length || filters.status?.length || filters.department?.length) && (
                              <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                                {(filters.stage?.length || 0) + (filters.status?.length || 0) + (filters.department?.length || 0)}
                              </Badge>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Filter by Stage</DropdownMenuLabel>
                          {['Preboarding', 'Day 1', 'Week 1', 'Day 30', 'Day 90'].map(stage => (
                            <DropdownMenuItem
                              key={stage}
                              onClick={() => handleStageFilter(stage as OnboardingStage)}
                              className="flex items-center justify-between"
                            >
                              {stage}
                              {filters.stage?.includes(stage as OnboardingStage) && <CheckCircle className="h-4 w-4" />}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                          {['InProgress', 'Blocked', 'At Risk', 'Completed'].map(status => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => handleStatusFilter(status as CaseStatus)}
                              className="flex items-center justify-between"
                            >
                              {status}
                              {filters.status?.includes(status as CaseStatus) && <CheckCircle className="h-4 w-4" />}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Filter by Department</DropdownMenuLabel>
                          {DEPARTMENTS.map(dept => (
                            <DropdownMenuItem
                              key={dept}
                              onClick={() => handleDepartmentFilter(dept)}
                              className="flex items-center justify-between"
                            >
                              {dept}
                              {filters.department?.includes(dept) && <CheckCircle className="h-4 w-4" />}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Role/Dept</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead className="text-center">% Complete</TableHead>
                          <TableHead>Due Next</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Exceptions</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCases.slice(0, 20).map(case_ => (
                          <TableRow key={case_.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div>
                                <div className="font-medium">{getDisplayName(case_.employeeName)}</div>
                                <div className="text-sm text-gray-500">{case_.id}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{case_.role}</div>
                                <div className="text-xs text-gray-500">{case_.department}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getDisplayStageColor(case_.employeeName, case_.stage)}>
                                {getDisplayStage(case_.employeeName, case_.stage)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center">
                                <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(case_.progressPercent, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{case_.progressPercent}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={getDueDateColor(case_.dueDate, case_.status)}>
                                <div className="text-sm font-medium">{case_.dueNext}</div>
                                {/* Hide the date line for Alex Morgan and Jordan Lee (displayed as Jordan Smith) only - keep for all others */}
                                {(case_.employeeName !== 'Alex Morgan' && case_.employeeName !== 'Jordan Lee') && (
                                  <div className="text-xs">
                                    {new Date(case_.dueDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getDisplayStatusColor(case_.employeeName, case_.status)}>
                                {getDisplayStatus(case_.employeeName, case_.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {getDisplayExceptionCount(case_.employeeName, case_.exceptionCount) > 0 ? (
                                <Badge variant="destructive" className="text-xs">
                                  {getDisplayExceptionCount(case_.employeeName, case_.exceptionCount)}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onViewChange('journey', case_.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

          {/* Recent Activity - Simple Right Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-gray-50">
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                <CardDescription className="text-gray-600">
                  Real-time updates and events
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {/* Activity Items */}
                  <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">IT access issue resolved</div>
                        <div className="text-sm text-gray-600">Riley Parker</div>
                        <div className="text-xs text-gray-400">{new Date().toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">Identity verification completed</div>
                        <div className="text-sm text-gray-600">Riley Parker</div>
                        <div className="text-xs text-gray-400">{new Date(Date.now() - 12000).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">BGV status updated</div>
                        <div className="text-sm text-gray-600">Riley Parker</div>
                        <div className="text-xs text-gray-400">{new Date(Date.now() - 40000).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">Feedback collected</div>
                        <div className="text-sm text-gray-600">Casey Johnson</div>
                        <div className="text-xs text-gray-400">{new Date(Date.now() - 100000).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">NDA sent for signature</div>
                        <div className="text-sm text-gray-600">Drew Anderson</div>
                        <div className="text-xs text-gray-400">{new Date(Date.now() - 160000).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>

        {/* Floating AI Chat Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative group">
            <Button
              onClick={() => handleOpenChatDialog({
                id: 'alex-morgan-001',
                employeeId: 'EMP-2024-1201',
                employeeName: 'Alex Morgan',
                department: 'Engineering',
                role: 'Senior Software Engineer',
                stage: 'Preboarding',
                progressPercent: 65,
                status: 'Pending',
                dueNext: 'BGC Report Review',
                dueDate: '2025-12-15',
                exceptionCount: 0,
                exceptions: [],
                createdDate: '2025-12-01',
                manager: 'Sarah Chen'
              } as OnboardingCase)}
              className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-white"
              title="AI Onboarding Assistant"
            >
              <div className="relative">
                <Bot className="h-8 w-8 text-white" />
                <div className="absolute -inset-1 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
                <div className="absolute -inset-2 bg-blue-300 rounded-full opacity-10 animate-ping animation-delay-200"></div>
              </div>
            </Button>
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                AI Onboarding Assistant
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
            <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
              <div className="flex flex-col gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse animation-delay-300"></div>
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse animation-delay-600"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat AI Dialog */}
        {selectedCandidate && (
          <ChatAIDialog
            open={chatDialogOpen}
            onOpenChange={setChatDialogOpen}
            candidateName={selectedCandidate?.name || ''}
            candidateId={selectedCandidate?.id || ''}
            currentStage={selectedCandidate?.stage || ''}
          />
        )}
      </div>
    
  )
}