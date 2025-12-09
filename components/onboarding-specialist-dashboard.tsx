"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/ui/app-header"
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
  Bot
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
  
  // Track Alex Morgan chat progress
  const [alexMorganProgress, setAlexMorganProgress] = useState(0)
  
  // Track Jordan Lee BGC progress
  const [jordanLeeProgress, setJordanLeeProgress] = useState(5) // Start at 5% as per initial state
  
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
      const casesData = generateOnboardingCases()
      setCases(casesData)
      setMetrics(getDashboardMetrics())
      setStageDistribution(getStageDistribution())
      setDepartmentMetrics(getDepartmentMetrics())
      setNotifications(generateNotifications())
      
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

  // Check for Alex Morgan chat completion in localStorage
  useEffect(() => {
    const checkAlexProgress = () => {
      const alexChatCompleted = localStorage.getItem('alexMorganChatCompleted')
      if (alexChatCompleted === 'true' && alexMorganProgress === 0) {
        setAlexMorganProgress(5)
        // Update metrics to reflect the changes only once per session
        const metricsUpdated = localStorage.getItem('alexMetricsUpdated')
        if (!metricsUpdated) {
          setMetrics(prev => prev ? {
            ...prev,
            activeJourneys: prev.activeJourneys + 1
          } : null)
          // Update stage distribution for Preboarding
          setStageDistribution(prev => prev.map(stage => 
            stage.stage === 'Preboarding' 
              ? { ...stage, count: stage.count + 1 }
              : stage
          ))
          localStorage.setItem('alexMetricsUpdated', 'true')
        }
      }
    }
    
    checkAlexProgress()
    
    // Check periodically for updates
    const interval = setInterval(checkAlexProgress, 1000)
    
    return () => clearInterval(interval)
  }, [alexMorganProgress])

  // Listen for Alex Morgan workflow updates
  useEffect(() => {
    const handleAlexMorganUpdate = () => {
      const alexStage = localStorage.getItem('alexMorganStage')
      const alexProgress = localStorage.getItem('alexMorganProgress')
      const alexBGCReady = localStorage.getItem('alexMorganBGCReady')
      
      console.log('Alex Morgan update check:', { alexStage, alexProgress, alexBGCReady, chatDialogOpen })
      
      if (alexStage && alexProgress) {
        setAlexMorganProgress(parseInt(alexProgress))
        
        // Trigger auto-open chat if Alex reaches BGC stage
        if (alexStage === 'Pulling BGC Reports' && !chatDialogOpen) {
          console.log('Conditions met - Auto-opening chat for Alex Morgan BGC workflow')
          setSelectedCandidate({
            id: 'alex-morgan-001',
            name: 'Alex Morgan',
            stage: alexStage
          })
          setChatDialogOpen(true)
        }
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

  // Check for Jordan Lee BGC completion in localStorage
  useEffect(() => {
    const checkJordanProgress = () => {
      const jordanBGCCompleted = localStorage.getItem('jordanLeeBGCCompleted')
      if (jordanBGCCompleted === 'true' && jordanLeeProgress === 5) {
        setJordanLeeProgress(15)
        // Update metrics to reflect Jordan Lee moving to active journeys only once per session
        const jordanMetricsUpdated = localStorage.getItem('jordanMetricsUpdated')
        if (!jordanMetricsUpdated) {
          setMetrics(prev => prev ? {
            ...prev,
            activeJourneys: prev.activeJourneys + 1,
            bgvPending: prev.bgvPending - 1 // Remove from BGV Pending as it moves to active
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
        
        let stage = 'Preboarding' as OnboardingStage
        let dueNext = 'Today'
        let status = 'Pending' as CaseStatus
        
        if (alexStage === 'File Upload Pending') {
          stage = 'Preboarding'
          dueNext = 'File Upload Pending'
          status = 'Pending'
        } else if (alexStage === 'Pulling BGC Reports') {
          stage = 'Week 1'
          dueNext = 'BGC Review Pending'
          status = 'InProgress'
        }
        
        return {
          ...caseItem,
          role: 'Senior Software Engineer',
          stage: stage,
          status: status,
          dueNext: dueNext,
          dueDate: today,
          exceptionCount: 0,
          progressPercent: alexProgress ? parseInt(alexProgress) : alexMorganProgress
        }
      }
      return caseItem
    })

    // Update Jordan Lee's details based on BGC completion
    filtered = filtered.map((caseItem: OnboardingCase) => {
      if (caseItem.employeeName === 'Jordan Lee') {
        const jordanBGCCompleted = localStorage.getItem('jordanLeeBGCCompleted')
        if (jordanBGCCompleted === 'true') {
          return {
            ...caseItem,
            stage: 'Week 1' as OnboardingStage,
            progressPercent: jordanLeeProgress,
            status: 'InProgress' as CaseStatus,
            dueNext: 'Equipment Setup (Today)',
            exceptionCount: 0
          }
        }
        return {
          ...caseItem,
          stage: 'BGC Pending' as OnboardingStage,
          progressPercent: jordanLeeProgress,
          status: 'Pending' as CaseStatus,
          dueNext: 'Upload BGC documents (today)',
          exceptionCount: 0
        }
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
    
    // Clear completion flags when opening chat
    if (candidate.employeeName === 'Alex Morgan') {
      localStorage.removeItem('alexMorganChatCompleted')
    }
    if (candidate.employeeName === 'Jordan Lee') {
      localStorage.removeItem('jordanLeeBGCCompleted')
      setJordanLeeProgress(5) // Reset to initial progress
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
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <AppHeader 
        onLogout={onLogout}
        userEmail="diane.prince@corespectrum.com"
        userRole="Onboarding Specialist"
        showSearch={true}
        showNotifications={true}
        onViewChange={onViewChange}
        notifications={notifications}
      />

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-25 md:hidden">
            <div className="fixed left-0 top-0 h-full w-64 bg-white p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Navigation</h2>
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onViewChange('dashboard')
                    setSidebarOpen(false)
                  }}
                >
                  Specialist Dashboard
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onViewChange('survey')
                    setSidebarOpen(false)
                  }}
                >
                  Survey Insights
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="flex-1 p-6">
          {/* KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
            {/* Onboarding Not Started */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-blue-700">15</div>
                    <p className="text-xs text-blue-600">Next 7 days</p>
                  </div>
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xs font-semibold text-blue-600 mt-2">Upcoming Joiners</h3>
              </CardContent>
            </Card>

            {/* Onboarding In Progress - Pending Documents */}
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-orange-700">5</div>
                    <p className="text-xs text-orange-600">Awaiting submission</p>
                  </div>
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xs font-semibold text-orange-600 mt-2">Pending Documents</h3>
              </CardContent>
            </Card>

            {/* Onboarding In Progress - Pending BGC */}
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-purple-700">18</div>
                    <p className="text-xs text-purple-600">Background verification</p>
                  </div>
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xs font-semibold text-purple-600 mt-2">Pending BGC</h3>
              </CardContent>
            </Card>

            {/* Onboarding In Progress - Pending ID Creation */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-yellow-700">20</div>
                    <p className="text-xs text-yellow-600">System access setup</p>
                  </div>
                  <UserPlus className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xs font-semibold text-yellow-600 mt-2">Pending ID Creation</h3>
              </CardContent>
            </Card>

            {/* Onboarding Completed */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-green-700">72</div>
                    <p className="text-xs text-green-600">Successfully completed</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xs font-semibold text-green-600 mt-2">Onboarded</h3>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Journey List */}
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Main Journey List */}
            <div className="flex-1 min-w-0">
              <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-semibold">Onboarding Journeys</CardTitle>
                        <CardDescription>
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
                                  <div className="font-medium">{case_.employeeName}</div>
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
                                <Badge variant="outline" className={getStageColor(case_.stage)}>
                                  {case_.stage}
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
                                  <div className="text-xs">
                                    {new Date(case_.dueDate).toLocaleDateString()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getStatusColor(case_.status)}>
                                  {case_.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {case_.exceptionCount > 0 ? (
                                  <Badge variant="destructive" className="text-xs">
                                    {case_.exceptionCount}
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

            {/* Business Metrics Panel */}
            <div className="xl:w-72 w-full">
              <div className="h-full flex flex-col gap-4">
                {/* Business Metrics Card */}
                <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-lg flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                      Business Metrics
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-sm">
                      Key performance indicators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Time to Onboard */}
                    <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-blue-600 mr-1" />
                          <span className="text-xs font-medium text-blue-900">Time to Onboard</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-blue-700 mb-1">14.2 days</div>
                      <div className="text-xs text-blue-600 flex items-center">
                        <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                        8% improvement vs last month
                      </div>
                    </div>

                    {/* Average Candidate Satisfaction */}
                    <div className="bg-green-50 rounded-lg p-2.5 border border-green-100">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <Building2 className="h-3 w-3 text-green-600 mr-1" />
                          <span className="text-xs font-medium text-green-900">Candidate Satisfaction</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-700 mb-1">4.7/5.0</div>
                      <div className="text-xs text-green-600 flex items-center">
                        <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                        Based on 127 responses
                      </div>
                    </div>

                    {/* Average BGC Time */}
                    <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-100">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <Shield className="h-3 w-3 text-purple-600 mr-1" />
                          <span className="text-xs font-medium text-purple-900">Average BGC Time</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-purple-700 mb-1">5.8 days</div>
                      <div className="text-xs text-purple-600 flex items-center">
                        <span className="inline-block w-1.5 h-1.5 bg-orange-400 rounded-full mr-1"></span>
                        2 days faster than target
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-800 mb-2">Quick Stats</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">This Month Completed</span>
                          <span className="font-medium text-slate-800">28</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Success Rate</span>
                          <span className="font-medium text-green-600">96.4%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Avg. Documents/Employee</span>
                          <span className="font-medium text-slate-800">8.2</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Agent Activity Card */}
                <Card className="bg-white border-slate-200 shadow-lg flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Recent Agent Activity</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Real-time updates and telemetry events
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {/* Recent Activity Items */}
                      <div className="border-l-2 border-green-200 pl-3 py-2">
                        <div className="text-sm font-medium text-green-800">Telemetry Event</div>
                        <div className="text-xs text-gray-600">IT access issue resolved</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date().toLocaleString()}</div>
                        <div className="flex items-center mt-1">
                          <Badge className="text-xs bg-green-100 text-green-800">Live</Badge>
                          <span className="text-xs text-gray-500 ml-2">Alex Morgan</span>
                        </div>
                      </div>

                      <div className="border-l-2 border-green-200 pl-3 py-2">
                        <div className="text-sm font-medium text-green-800">Telemetry Event</div>
                        <div className="text-xs text-gray-600">Identity verification completed</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(Date.now() - 12000).toLocaleString()}</div>
                        <div className="flex items-center mt-1">
                          <Badge className="text-xs bg-green-100 text-green-800">Live</Badge>
                          <span className="text-xs text-gray-500 ml-2">Alex Morgan</span>
                        </div>
                      </div>

                      <div className="border-l-2 border-green-200 pl-3 py-2">
                        <div className="text-sm font-medium text-green-800">Telemetry Event</div>
                        <div className="text-xs text-gray-600">BGV status updated from InProgress → Clear</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(Date.now() - 40000).toLocaleString()}</div>
                        <div className="flex items-center mt-1">
                          <Badge className="text-xs bg-green-100 text-green-800">Live</Badge>
                          <span className="text-xs text-gray-500 ml-2">Alex Morgan</span>
                        </div>
                      </div>

                      <div className="border-l-2 border-green-200 pl-3 py-2">
                        <div className="text-sm font-medium text-green-800">Telemetry Event</div>
                        <div className="text-xs text-gray-600">Identity verification completed</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(Date.now() - 100000).toLocaleString()}</div>
                        <div className="flex items-center mt-1">
                          <Badge className="text-xs bg-green-100 text-green-800">Live</Badge>
                          <span className="text-xs text-gray-500 ml-2">Casey Johnson</span>
                        </div>
                      </div>

                      <div className="border-l-2 border-green-200 pl-3 py-2">
                        <div className="text-sm font-medium text-green-800">Telemetry Event</div>
                        <div className="text-xs text-gray-600">Document mismatch exception created</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(Date.now() - 160000).toLocaleString()}</div>
                        <div className="flex items-center mt-1">
                          <Badge className="text-xs bg-green-100 text-green-800">Live</Badge>
                          <span className="text-xs text-gray-500 ml-2">Drew Anderson</span>
                        </div>
                      </div>

                      <div className="border-l-2 border-gray-200 pl-3 py-2">
                        <div className="text-sm font-medium">ENGAGEMENT FEEDBACK</div>
                        <div className="text-xs text-gray-600">Feedback collected</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(Date.now() - 14400000).toLocaleString()}</div>
                        <div className="flex items-center mt-1">
                          <Badge className="text-xs bg-primary text-primary-foreground">success</Badge>
                        </div>
                      </div>

                      <div className="border-l-2 border-gray-200 pl-3 py-2">
                        <div className="text-sm font-medium">COMPLIANCE POLICY</div>
                        <div className="text-xs text-gray-600">NDA sent for signature</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(Date.now() - 16560000).toLocaleString()}</div>
                        <div className="flex items-center mt-1">
                          <Badge className="text-xs bg-secondary text-secondary-foreground">pending</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
    </div>
  )
}