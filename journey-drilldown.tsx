"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/ui/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Building2,
  Calendar,
  Mail,
  Phone,
  FileText,
  Shield,
  Monitor,
  GraduationCap,
  Heart,
  Settings,
  LogOut,
  Bell,
  MessageSquare
} from "lucide-react"
import { 
  generateOnboardingCases,
  generateAgentActivity,
  JOURNEY_STEPS 
} from "@/lib/mockData"
import { 
  OnboardingCase, 
  AgentActivity, 
  JourneyStep,
  TaskStatus,
  AgentType 
} from "@/lib/types"

interface JourneyDrilldownProps {
  caseId: string
  onLogout: () => void
  onViewChange: (view: 'dashboard' | 'survey' | 'journey', caseId?: string) => void
}

export default function JourneyDrilldown({ 
  caseId, 
  onLogout, 
  onViewChange 
}: JourneyDrilldownProps) {
  const [journeyCase, setJourneyCase] = useState<OnboardingCase | null>(null)
  const [agentActivity, setAgentActivity] = useState<AgentActivity[]>([])
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([])

  useEffect(() => {
    // Helper to compute effective case and journey steps (shared for initial load and live updates)
    const computeAndSetCase = () => {
      const cases = generateOnboardingCases()
      const selectedCase = cases.find(c => c.id === caseId)
      if (!selectedCase) return

      let effectiveCase = { ...selectedCase }

      if (selectedCase.id === 'CS0001' || selectedCase.employeeName === 'Alex Morgan') {
        const alexStage = localStorage.getItem('alexMorganStage')
        const alexProgress = localStorage.getItem('alexMorganProgress')
        const hasCompletedInteraction = sessionStorage.getItem('hasCompletedInteraction')
        const alexChatCompleted = localStorage.getItem('alexMorganChatCompleted')

        let stage = 'Not Started'
        let dueNext = 'Onboarding Initiation (today)'
        let progressPercent = 0

        // If any dashboard/session/local storage flags indicate progress, apply them
        if (hasCompletedInteraction === 'true' || alexChatCompleted === 'true' || alexStage === 'File Upload Pending') {
          stage = 'Preboarding'
          dueNext = 'File Upload Pending (today)'
          progressPercent = 5
        } else if (alexStage === 'Pulling BGC Reports') {
          stage = 'Week 1'
          dueNext = 'BGC Review Pending'
          progressPercent = alexProgress ? parseInt(alexProgress) : 20
        } else if (alexProgress) {
          // If explicit progress is saved in localStorage, use it
          progressPercent = parseInt(alexProgress)
          stage = selectedCase.stage
          // ensure dueNext mirrors dashboard's static value when progress saved
          dueNext = selectedCase.dueNext
        } else {
          // No storage overrides — mirror dashboard initial view: Not Started / 0%
          progressPercent = 0
          stage = 'Not Started'
          dueNext = 'Onboarding Initiation (today)'
        }

        effectiveCase = {
          ...selectedCase,
          stage: stage as any,
          progressPercent,
          dueNext,
        }
        }

        // Jordan Lee (CS0002) — keep in sync with dashboard storage/session semantics
        if (selectedCase.id === 'CS0002' || selectedCase.employeeName === 'Jordan Lee') {
          const jordanStage = localStorage.getItem('jordanLeeStage')
          const jordanProgress = localStorage.getItem('jordanLeeProgress')
          const sessionCompleted = sessionStorage.getItem('jordanBGCCompleted')

          let stage: any = 'BGC Pending'
          let dueNext = 'BGC Review'
          let progressPercent = 15

          // If session indicates BGC adjudication completed, reflect Week 1 / 35%
          if (sessionCompleted === 'true' || jordanStage === 'ID Creation Pending' || jordanProgress === '35') {
            stage = 'Week 1'
            // set a user-friendly dueNext similar to dashboard
            const nearFutureDate = new Date()
            nearFutureDate.setDate(nearFutureDate.getDate() + 3)
            const formattedDate = nearFutureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            dueNext = `Pending ID creation (${formattedDate})`
            progressPercent = 35
          } else if (jordanProgress) {
            progressPercent = parseInt(jordanProgress)
            stage = selectedCase.stage
            dueNext = selectedCase.dueNext
          } else {
            // default initial state mirrors dashboard: BGC Pending / 15%
            progressPercent = 15
            stage = 'BGC Pending'
            dueNext = 'BGC Review'
          }

          effectiveCase = {
            ...selectedCase,
            stage,
            progressPercent,
            dueNext,
          }
        }

      setJourneyCase(effectiveCase)
      // Generate activities then adjust ordering/status for Alex (CS0001) when progress is 0
      let activities = generateAgentActivity(caseId)
      // For Jordan (CS0002) show newest->oldest (top is most recent).
      // For other cases show oldest->newest so bottom is most recent.
      if (effectiveCase.id === 'CS0002' || effectiveCase.employeeName === 'Jordan Lee') {
        activities = activities.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      } else {
        activities = activities.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      }

      // For Jordan, ensure timestamps are monotonically older as we go down the list
      if (effectiveCase.id === 'CS0002' || effectiveCase.employeeName === 'Jordan Lee') {
        const now = Date.now()
        // First item should be 15 minutes ago, then 14, 13 ... decreasing by 1 minute
        const base = now - 15 * 60 * 1000
        const spacing = 1 * 60 * 1000
        activities = activities.map((act, idx) => {
          const ts = base + idx * spacing // base (15m ago), then 14m, 13m...
          // clamp so we never set a future or too-recent timestamp (at least 1 minute ago)
          const final = Math.min(ts, now - 60 * 1000)
          return { ...act, timestamp: new Date(final).toISOString() }
        })
      }

      // If Jordan's progress is exactly 15%, force all activity statuses to 'pending'
      if ((effectiveCase.id === 'CS0002' || effectiveCase.employeeName === 'Jordan Lee') && effectiveCase.progressPercent === 15) {
        activities = activities.map(a => ({ ...a, status: 'pending' as any }))
      }

      // If Jordan's progress reaches 35%, mark all activity statuses as 'success'
      if ((effectiveCase.id === 'CS0002' || effectiveCase.employeeName === 'Jordan Lee') && effectiveCase.progressPercent === 35) {
        activities = activities.map(a => ({ ...a, status: 'success' as any }))
      }

      // If Alex (CS0001) has 0% we set all to pending (handled previously)
      if ((effectiveCase.id === 'CS0001' || effectiveCase.employeeName === 'Alex Morgan') && effectiveCase.progressPercent === 0) {
        activities = activities.map(a => ({ ...a, status: 'pending' as any }))
      }

      // If Alex reached 5%: existing activities become success and we append the requested investigative steps as pending
      if ((effectiveCase.id === 'CS0001' || effectiveCase.employeeName === 'Alex Morgan') && effectiveCase.progressPercent === 5) {
        // Ensure existing entries are marked success
        activities = activities.map(a => ({ ...a, status: 'success' as any }))

        // Define appended steps in requested sequence
        const nowRef = Date.now()
        // Start timestamps after the last activity timestamp (or nowRef if no activities)
        const lastTs = activities.length > 0 ? new Date(activities[activities.length - 1].timestamp).getTime() : nowRef
        const appended = [
          { agent: 'ONBOARDING_PLANNER' as any, action: 'AI Orchestrator invoking BGC adjudication Agent' },
          { agent: 'BGC_VENDOR_COORDINATION' as any, action: 'Analyzing the BGC report for Jordan Smith' },
          { agent: 'HUMAN_IN_THE_LOOP' as any, action: 'Summarizing checks and identifying education verification gap' },
          { agent: 'DATA_COLLECTION_VALIDATION' as any, action: 'Invoking Data Search Agent: Searching for information about The College of Saint Rose' },
          { agent: 'DATA_COLLECTION_VALIDATION' as any, action: 'Found credible sources: last semester Spring 2024; declining enrollment noted' },
          { agent: 'COMPLIANCE_POLICY' as any, action: 'Consulting Compliance Agent: Checking state guidance' },
          { agent: 'ONBOARDING_PLANNER' as any, action: 'Cross-verifying Accreditation Agent' },
          { agent: 'HUMAN_IN_THE_LOOP' as any, action: 'Synthesizing evidence' }
        ]

        const appendedWithMeta: AgentActivity[] = appended.map((it, idx) => {
          // desired timestamp (incremental)
          const desired = lastTs + (idx + 1) * 60 * 1000
          const now = Date.now()
          // clamp to at most now - 60 seconds to avoid '0m ago' or negative durations
          const finalTs = Math.min(desired, now - 60 * 1000)
          return {
            id: `ACT-CS0001-EXT-${idx + 1}`,
            caseId: effectiveCase.id,
            agent: it.agent,
            action: it.action,
            timestamp: new Date(finalTs).toISOString(),
            status: 'pending' as any
          }
        })

        activities = activities.concat(appendedWithMeta)
      }

      setAgentActivity(activities)

      const stepsWithStatus = JOURNEY_STEPS.map((step, index) => {
        let status: TaskStatus = 'NotStarted'
        const progressThreshold = (index + 1) * (100 / JOURNEY_STEPS.length)

        if (effectiveCase.progressPercent >= progressThreshold) {
          status = 'Completed'
        } else if (effectiveCase.progressPercent >= progressThreshold - 15) {
          status = 'InProgress'
        } else if (effectiveCase.status === 'Blocked' && Math.random() > 0.7) {
          status = 'Blocked'
        }

        return { ...step, status }
      })

      if (effectiveCase.id === 'CS0001' || effectiveCase.employeeName === 'Alex Morgan') {
        if (effectiveCase.progressPercent === 0) {
          const idx = stepsWithStatus.findIndex(s => s.id === 'step1')
          if (idx >= 0) stepsWithStatus[idx].status = 'NotStarted'
        }

        if (effectiveCase.progressPercent >= 5) {
          const idx1 = stepsWithStatus.findIndex(s => s.id === 'step1')
          const idx2 = stepsWithStatus.findIndex(s => s.id === 'step2')
          if (idx1 >= 0) stepsWithStatus[idx1].status = 'Completed'
          if (idx2 >= 0) stepsWithStatus[idx2].status = 'InProgress'
        }
      }

      // Jordan-specific UX mapping
      if (effectiveCase.id === 'CS0002' || effectiveCase.employeeName === 'Jordan Lee') {
        // BGC coordination is step3
        const idxBGC = stepsWithStatus.findIndex(s => s.id === 'step3')
        if (effectiveCase.progressPercent === 15) {
          if (idxBGC >= 0) stepsWithStatus[idxBGC].status = 'InProgress'
        }
        if (effectiveCase.progressPercent >= 35) {
          // mark BGC Completed and advance HR setup (step5) to InProgress
          if (idxBGC >= 0) stepsWithStatus[idxBGC].status = 'Completed'
          const idxHR = stepsWithStatus.findIndex(s => s.id === 'step5')
          if (idxHR >= 0) stepsWithStatus[idxHR].status = 'InProgress'
        }
      }

      setJourneySteps(stepsWithStatus)
    }

    // Initial compute
    computeAndSetCase()

    // Listen for storage changes and custom events so this view stays in sync with the dashboard
    const handleStorage = (e: StorageEvent) => {
      // Refresh when relevant Alex- or Jordan-related keys change or when session flags alter
      const relevantKeys = [
        'alexMorganStage', 'alexMorganProgress', 'alexMorganChatCompleted', 'alexMorganBGCReady',
        'jordanLeeStage', 'jordanLeeProgress', 'jordanBGCCompleted'
      ]
      if (!e.key || relevantKeys.includes(e.key)) {
        computeAndSetCase()
      }
    }

    const handleCustom = (ev: Event) => {
      const t = (ev as any).type
      if (t === 'alexMorganUpdate' || t === 'jordanUpdate') computeAndSetCase()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('alexMorganUpdate', handleCustom)
    window.addEventListener('jordanUpdate', handleCustom)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('alexMorganUpdate', handleCustom)
      window.removeEventListener('jordanUpdate', handleCustom)
    }
  }, [caseId])

  if (!journeyCase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'InProgress':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'Blocked':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'InProgress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Blocked': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDisplayStatus = (step: JourneyStep) => {
    // For Alex Morgan (CS0001) we want the Onboarding Planning step to display as 'Started'
    if (journeyCase && journeyCase.id === 'CS0001') {
      if (step.id === 'step1' && step.status === 'InProgress') return 'Started'
      if (step.id === 'step2' && step.status === 'InProgress') return 'Started'
    }

    return step.status.replace(/([A-Z])/g, ' $1').trim()
  }

  const getAgentIcon = (agent: AgentType) => {
    switch (agent) {
      case 'ONBOARDING_PLANNER':
        return <Settings className="h-4 w-4" />
      case 'DATA_COLLECTION_VALIDATION':
        return <FileText className="h-4 w-4" />
      case 'BGC_VENDOR_COORDINATION':
        return <Shield className="h-4 w-4" />
      case 'COMPLIANCE_POLICY':
        return <FileText className="h-4 w-4" />
      case 'HR_PAYROLL_SETUP':
        return <User className="h-4 w-4" />
      case 'IT_ACCESS':
        return <Monitor className="h-4 w-4" />
      case 'TRAINING_ONBOARDING':
        return <GraduationCap className="h-4 w-4" />
      case 'ENGAGEMENT_FEEDBACK':
        return <Heart className="h-4 w-4" />
      case 'HUMAN_IN_THE_LOOP':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  // Display helpers to match dashboard grid presentation for specific candidates
  const getDisplayName = (employeeName: string) => {
    if (employeeName === 'Jordan Lee') return 'Jordan Smith'
    return employeeName
  }

  const getDisplayRole = (employeeName: string, role: string) => {
    if (employeeName === 'Jordan Lee') return 'Programmer'
    return role
  }

  const getDisplayStageLabel = (employeeName: string, stage: string, progressPercent: number) => {
    if (employeeName === 'Jordan Lee') {
      const lsProgress = localStorage.getItem('jordanLeeProgress')
      const sessionCompleted = sessionStorage.getItem('jordanBGCCompleted')
      if (progressPercent >= 35 || lsProgress === '35' || sessionCompleted === 'true') {
        return 'Exception Resolved'
      }
      return 'BGC Exception'
    }
    return stage
  }

  const getDisplayStageColor = (employeeName: string, stage: string) => {
    if (employeeName === 'Jordan Lee') {
      const lsProgress = localStorage.getItem('jordanLeeProgress')
      const sessionCompleted = sessionStorage.getItem('jordanBGCCompleted')
      if (lsProgress === '35' || sessionCompleted === 'true') {
        return 'bg-emerald-100 text-emerald-800'
      }
      return 'bg-red-100 text-red-800'
    }
    return getStatusColor as any // fallback; will be replaced where used
  }

  const formatAgentName = (agent: AgentType) => {
    return agent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffMs = now.getTime() - activityTime.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // Avoid negative or zero values — show at least '1m ago'
    if (diffMinutes <= 0) {
      return `1m ago`
    }

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return `${diffDays}d ago`
    }
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
        breadcrumbs={[{ label: "Journey Details" }, { label: getDisplayName(journeyCase?.employeeName || "Employee") }]}
        notifications={[
          { id: "1", title: "Journey Update", message: `Progress update for ${journeyCase?.employeeName}`, type: "info", read: false },
          { id: "2", title: "Task Completed", message: "Background check completed", type: "success", read: false }
        ]}
      />

      {/* Main Content */}
      <div className="p-6">
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => onViewChange('dashboard')}
            className="flex items-center space-x-2 hover:bg-blue-50 hover:text-blue-600 active:text-blue-600 text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Journey Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Employee Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{getDisplayName(journeyCase.employeeName)}</CardTitle>
                      <CardDescription className="text-base">
                        {getDisplayRole(journeyCase.employeeName, journeyCase.role)} • {journeyCase.department}
                      </CardDescription>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Started {new Date(journeyCase.createdDate).toLocaleDateString()}</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            journeyCase.employeeName === 'Jordan Lee' ? (
                              (localStorage.getItem('jordanLeeProgress') === '35' || sessionStorage.getItem('jordanBGCCompleted') === 'true') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            ) : (
                              journeyCase.stage === 'Preboarding' ? 'bg-purple-100 text-purple-800' :
                              journeyCase.stage === 'Day 1' ? 'bg-blue-100 text-blue-800' :
                              journeyCase.stage === 'Week 1' ? 'bg-indigo-100 text-indigo-800' :
                              journeyCase.stage === 'Day 30' ? 'bg-green-100 text-green-800' :
                              'bg-emerald-100 text-emerald-800'
                            )
                          }
                        >
                          {journeyCase.employeeName === 'Jordan Lee' ? getDisplayStageLabel(journeyCase.employeeName, journeyCase.stage, journeyCase.progressPercent) : journeyCase.stage}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{journeyCase.progressPercent}%</div>
                    <div className="text-sm text-gray-500">Complete</div>
                    <Progress value={journeyCase.progressPercent} className="w-24 mt-2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{journeyCase.employeeName.toLowerCase().replace(' ', '.')}@corespectrum.com</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Manager: {journeyCase.manager}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Due: {journeyCase.dueNext}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Journey Steps Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Journey</CardTitle>
                <CardDescription>Step-by-step progress through the onboarding process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {journeySteps.map((step, index) => (
                    <div key={step.id} className="flex items-start space-x-4">
                      {/* Status Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(step.status)}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900">{step.title}</h3>
                            <Badge variant="outline" className={getStatusColor(step.status)}>
                              {getDisplayStatus(step)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            {getAgentIcon(step.agent)}
                            <span>{formatAgentName(step.agent)}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                        
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-700 mb-1">Actions:</div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {step.actions.map((action, actionIndex) => (
                              <li key={actionIndex} className="flex items-center space-x-2">
                                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full"></div>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          Estimated duration: {step.estimatedDuration}
                          {step.dependencies && step.dependencies.length > 0 && (
                            <span className="ml-4">
                              Depends on: {step.dependencies.map(dep => 
                                journeySteps.find(s => s.id === dep)?.title
                              ).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Exceptions */}
            {journeyCase.exceptionCount > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Exceptions ({journeyCase.exceptionCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {journeyCase.exceptions.map(exception => (
                      <div key={exception.id} className="flex items-start justify-between p-3 bg-white rounded border border-red-200">
                        <div>
                          <div className="font-medium text-red-800">{exception.type}</div>
                          <div className="text-sm text-red-600">{exception.description}</div>
                          <div className="text-xs text-red-500 mt-1">
                            Created {new Date(exception.createdOn).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {exception.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Agent Activity Trace */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agent Activity Trace</CardTitle>
                <CardDescription>Real-time updates from AI agents and specialists</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* For Alex Morgan (CS0001) show a curated, non-breaking static trace */}
                  {
                    (journeyCase.id === 'CS0001' || journeyCase.employeeName === 'Alex Morgan')
                    ? (
                      // Construct three specific entries for Alex without mutating state
                      [
                        {
                          id: 'ACT-CS0001-OVR-1',
                          agent: 'ONBOARDING_PLANNER' as any,
                          action: 'Strategic Planner AI Agent — Synthesized onboarding plan and prioritized actions',
                          timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
                          status: 'success'
                        },
                        {
                          id: 'ACT-CS0001-OVR-2',
                          agent: 'DATA_COLLECTION_VALIDATION' as any,
                          action: 'Data Query Agent — Executed cross-source retrieval and resolved identity matches',
                          timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
                          status: 'success'
                        },
                        {
                          id: 'ACT-CS0001-OVR-3',
                          agent: 'BGC_VENDOR_COORDINATION' as any,
                          action: 'Submitted documents for BGC check',
                          timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
                          status: 'pending'
                        }
                      ].map(activity => (
                        <div key={activity.id} className="border-l-4 border-blue-200 pl-4 py-3">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getAgentIcon(activity.agent as AgentType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className={`font-medium text-sm text-gray-900`}>
                                  {formatAgentName(activity.agent as AgentType)}
                                </h4>
                                {!((journeyCase.id === 'CS0002' || journeyCase.employeeName === 'Jordan Lee') && activity.id === 'ACT-CS0002-OVR-4') ? (
                                  <span className={`text-xs text-gray-500`}>
                                    {getTimeAgo(activity.timestamp)}
                                  </span>
                                ) : null}
                              </div>

                              <p className={`text-sm text-gray-600 mt-1`}>
                                {activity.action}
                              </p>

                              <div className="flex items-center mt-2">
                                <Badge 
                                  variant={activity.status === 'success' ? 'default' : activity.status === 'pending' ? 'secondary' : 'destructive'}
                                  className="text-xs"
                                >
                                  {activity.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (journeyCase.id === 'CS0002' || journeyCase.employeeName === 'Jordan Lee') ? (
                      // Jordan-specific curated trace for CS0002/Jordan Lee
                      [
                        {
                          id: 'ACT-CS0002-OVR-1',
                          agent: 'ONBOARDING_PLANNER' as any,
                          action: 'Strategic Planner AI Agent — Synthesized onboarding plan and prioritized actions',
                          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                          status: 'success'
                        },
                        {
                          id: 'ACT-CS0002-OVR-2',
                          agent: 'DATA_COLLECTION_VALIDATION' as any,
                          action: 'Data Query Agent — Executed cross-source retrieval and resolved identity matches',
                          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                          status: 'success'
                        },
                        {
                          id: 'ACT-CS0002-OVR-3',
                          agent: 'BGC_VENDOR_COORDINATION' as any,
                          action: 'Received BGC report for Jordan Smith. BGC in exception.',
                          timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
                          status: 'success'
                        },
                        {
                          id: 'ACT-CS0002-OVR-4',
                          agent: 'HUMAN_IN_THE_LOOP' as any,
                          action: 'BGC exception report review pending',
                          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
                          status: 'pending'
                        }
                      ].map(activity => (
                        <div key={activity.id} className="border-l-4 border-blue-200 pl-4 py-3">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getAgentIcon(activity.agent as AgentType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                      <h4 className={`font-medium text-sm text-gray-900`}>
                                        {formatAgentName(activity.agent as AgentType)}
                                      </h4>
                                      {activity.id !== 'ACT-CS0002-OVR-4' ? (
                                        <span className={`text-xs text-gray-500`}>
                                          {getTimeAgo(activity.timestamp)}
                                        </span>
                                      ) : null}
                                    </div>

                              <p className={`text-sm text-gray-600 mt-1`}>
                                {activity.action}
                              </p>

                              <div className="flex items-center mt-2">
                                <Badge 
                                  variant={activity.status === 'success' ? 'default' : activity.status === 'pending' ? 'secondary' : 'destructive'}
                                  className="text-xs"
                                >
                                  {activity.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      agentActivity.map(activity => {
                        return (
                          <div key={activity.id} className="border-l-4 border-blue-200 pl-4 py-3">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {getAgentIcon(activity.agent)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className={`font-medium text-sm text-gray-900`}>
                                      {formatAgentName(activity.agent)}
                                    </h4>
                                    <span className={`text-xs text-gray-500`}>
                                      {getTimeAgo(activity.timestamp)}
                                    </span>
                                </div>

                                {/* Emphatic action line for static traces */}
                                <p className={`text-sm text-gray-600 mt-1`}>
                                  {activity.action}
                                </p>

                                {activity.details && (
                                  <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                                )}
                                <div className="flex items-center mt-2">
                                  <Badge 
                                    variant={activity.status === 'success' ? 'default' : activity.status === 'pending' ? 'secondary' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {activity.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )
                  }
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Raise Exception
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Task Complete
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Check-in
                </Button>
              </CardContent>
            </Card>

            {/* Journey Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Journey Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Days in onboarding</span>
                  <span className="font-medium">
                    {Math.floor((new Date().getTime() - new Date(journeyCase.createdDate).getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed steps</span>
                  <span className="font-medium">
                    {journeySteps.filter(s => s.status === 'Completed').length} / {journeySteps.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Agent interactions</span>
                  <span className="font-medium">{agentActivity.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Next milestone</span>
                  <span className="font-medium text-blue-600">{journeyCase.dueNext}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}