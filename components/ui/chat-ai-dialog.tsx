"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Send,
  Bot,
  User,
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  FileText,
  Mail,
  UserCheck,
  Settings,
  Zap,
  Brain,
  Play,
  Pause,
  RotateCcw,
  Target,
  Workflow,
  Eye,
  Shield
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Add streaming animation styles
const streamingStyles = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes typewriter {
    from { width: 0; }
    to { width: 100%; }
  }
  
  .streaming-text {
    overflow: hidden;
    white-space: nowrap;
    animation: typewriter 2s steps(30, end);
  }
  
  .slide-in-agentic {
    animation: slideInRight 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
`

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  isSystemMessage?: boolean
}

interface ActivityTraceItem {
  id: string
  action: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
  timestamp: Date
  details?: string
  agent?: string
  ticketId?: string
}

interface PlanningStep {
  id: string
  description: string
  status: 'planned' | 'executing' | 'completed' | 'failed'
  estimatedTime?: string
  dependencies?: string[]
}

interface ChatAIDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidateName: string
  candidateId: string
  currentStage: string
}

export function ChatAIDialog({ 
  open, 
  onOpenChange, 
  candidateName, 
  candidateId, 
  currentStage 
}: ChatAIDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [activityTrace, setActivityTrace] = useState<ActivityTraceItem[]>([])
  const [planningSteps, setPlanningSteps] = useState<PlanningStep[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [isMessageStreaming, setIsMessageStreaming] = useState<boolean>(false)
  const [currentTypingMessageId, setCurrentTypingMessageId] = useState<string | null>(null)
  const [isAutonomous, setIsAutonomous] = useState(false)
  const [isExecutingPlan, setIsExecutingPlan] = useState(false)
  const [exceptionScenario, setExceptionScenario] = useState<1 | 2 | 3 | null>(null)
  const [jordanScenario, setJordanScenario] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState("")
  const [streamingActivity, setStreamingActivity] = useState<{
    id: string;
    action: string;
    details: string;
    agent: string;
    status: ActivityTraceItem['status'];
    ticketId: string;
    streamedAction: string;
    streamedDetails: string;
    isActionComplete: boolean;
    isDetailsComplete: boolean;
  } | null>(null)
  const [currentStreamingIndex, setCurrentStreamingIndex] = useState<number>(-1)
  const [emailTimer, setEmailTimer] = useState<number>(0)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)
  const [showEmailPopup, setShowEmailPopup] = useState<boolean>(false)
  const [showViewMailButton, setShowViewMailButton] = useState<boolean>(false)
  const [alexMorganWorkflowStarted, setAlexMorganWorkflowStarted] = useState<boolean>(false)
  const [alexMorganFileUploadTimer, setAlexMorganFileUploadTimer] = useState<NodeJS.Timeout | null>(null)
  const chatScrollAreaRef = useRef<HTMLDivElement>(null)
  const traceScrollAreaRef = useRef<HTMLDivElement>(null)
  const streamTimeoutsRef = useRef<NodeJS.Timeout[]>([])

  // Initialize chat when dialog opens
  useEffect(() => {
    if (open) {
      // Set exception scenario for Alex Morgan (Scenario 1 for now)
      if (candidateName === 'Alex Morgan') {
        setExceptionScenario(1)
      } else if (candidateName === 'Jordan' || candidateName.toLowerCase().includes('jordan')) {
        setJordanScenario(true)
      }
      initializeChat()
    }
  }, [open])

  // Handle Alex Morgan workflow progression
  useEffect(() => {
    if (candidateName === 'Alex Morgan' && showEmailPopup && !alexMorganWorkflowStarted) {
      setAlexMorganWorkflowStarted(true)
      
      // Trigger dashboard update: progress to 5%, stage to "File Upload Pending"
      localStorage.setItem('alexMorganStage', 'File Upload Pending')
      localStorage.setItem('alexMorganProgress', '5')
      
      // Start timer for 50-60 seconds (using 10 seconds for testing)
      const timer = setTimeout(() => {
        console.log('Alex Morgan timer triggered - starting BGC workflow')
        
        // Close current dialog and trigger BGC workflow
        setShowEmailPopup(false)
        onOpenChange(false)
        
        // Set BGC workflow trigger
        localStorage.setItem('alexMorganBGCReady', 'true')
        localStorage.setItem('alexMorganStage', 'Pulling BGC Reports')
        localStorage.setItem('alexMorganProgress', '20')
        
        console.log('Alex Morgan BGC workflow triggered - stage set to Pulling BGC Reports')
        console.log('LocalStorage values:', {
          stage: localStorage.getItem('alexMorganStage'),
          progress: localStorage.getItem('alexMorganProgress'),
          bgcReady: localStorage.getItem('alexMorganBGCReady')
        })
        
        // Multiple triggers to ensure dashboard picks up the change
        setTimeout(() => {
          console.log('Dispatching custom event')
          window.dispatchEvent(new CustomEvent('alexMorganUpdate'))
          
          // Also try dispatching a storage event manually
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'alexMorganStage',
            newValue: 'Pulling BGC Reports',
            oldValue: 'File Upload Pending'
          }))
        }, 500)
        
        // Fallback: direct call to force dialog open after delay
        setTimeout(() => {
          console.log('Fallback trigger - forcing dialog open')
          window.dispatchEvent(new CustomEvent('alexMorganUpdate'))
        }, 2000)
      }, 10000) // 10 seconds for testing (was 55000)
      
      setAlexMorganFileUploadTimer(timer)
    }
  }, [showEmailPopup, candidateName, alexMorganWorkflowStarted, onOpenChange])

  // Cleanup timer when dialog closes
  useEffect(() => {
    if (!open && alexMorganFileUploadTimer) {
      clearTimeout(alexMorganFileUploadTimer)
      setAlexMorganFileUploadTimer(null)
    }
  }, [open, alexMorganFileUploadTimer])

  // Reset all state when dialog closes
  useEffect(() => {
    if (!open) {
      // Clear all streaming timeouts
      streamTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      streamTimeoutsRef.current = []
      
      // Reset all state when dialog closes
      setMessages([])
      setActivityTrace([])
      setPlanningSteps([])
      setInputValue("")
      setIsTyping(false)
      setExceptionScenario(null)
      setJordanScenario(false)
      setIsProcessing(false)
      setProcessingMessage("")
      setStreamingActivity(null)
      setCurrentStreamingIndex(-1)
      setEmailTimer(0)
      setIsTimerRunning(false)
      setShowEmailPopup(false)
      setShowViewMailButton(false)
      setAlexMorganWorkflowStarted(false)
    }
  }, [open])

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    if (chatScrollAreaRef.current) {
      // Simple fallback scroll
      setTimeout(() => {
        const scrollContainer = chatScrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' })
        }
      }, 100)
    }
  }, [messages])

  useEffect(() => {
    if (traceScrollAreaRef.current) {
      setTimeout(() => {
        const scrollContainer = traceScrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' })
        }
      }, 100)
    }
  }, [activityTrace])

  const initializeChat = () => {
    let welcomeMessage: ChatMessage
    
    // Check if Alex Morgan BGC workflow is ready
    const alexBGCReady = localStorage.getItem('alexMorganBGCReady')
    
    // Special handling for Alex Morgan BGC exception scenario
    if (candidateName === 'Alex Morgan' && alexBGCReady === 'true') {
      welcomeMessage = {
        id: `msg-${Date.now()}`,
        type: 'ai',
        content: `Hi Diane, Welcome!

As promised, here's an update on the onboarding journey Candidate Alex Morgan.

Alex has successfully uploaded the required documents, and we've received the Background Check (BGC) report from our verification partner.

**Summary of BGC Report**
• Previous employment experience letters: ✅ Verified
• Degree certificate: ✅ Verified  
• Passport: ✅ Verified
• Employment verification: ✅ Completed
• W2 submitted: ⚠️ Latest W2 missing
• Utility bill: ✅ Verified

**Recommended Action**

Please approve the BGC exception, as this is considered low risk.

CoreSpectrum Inc policy allows a maximum employment gap of 1 month 

There is an employment gap of 2 months between the last two jobs at Innodate and DataZenith Analytics

• Employment period with Innodate: July 01, 2020 to June 30, 2023
• Employment gap: 2 months  
• Employment period with DataZenith Analytics: September 01, 2022 to August 29, 2025

**Risk of Denying**

Delaying approval may impact onboarding for a business-critical role.`,
        timestamp: new Date(),
        isSystemMessage: false
      }
      
      // Clear the BGC ready flag
      localStorage.removeItem('alexMorganBGCReady')
      
      // Start BGC activity trace immediately
      setTimeout(() => startAlexMorganBGCActivityStream(), 1000)
    }
    // Special handling for Alex Morgan initial scenario
    else if (candidateName === 'Alex Morgan') {
      welcomeMessage = {
        id: `msg-${Date.now()}`,
        type: 'ai',
        content: `Hi, 👋

I am here to assist you with your onboarding journeys.

Here are 5 candidates for whom onboarding needs to be initiated as their joining date is in next 7 days:

🔸 Sarah Wilson - Engineering Lead (Joins Dec 16)
🔸 Michael Chen - Product Designer (Joins Dec 17)  
🔸 Emma Davis - Data Analyst (Joins Dec 18)
🔸 James Rodriguez - DevOps Engineer (Joins Dec 19)
🔸 Alex Morgan - Senior Software Engineer (Joins Dec 16)

Please confirm if I can start onboarding process for these candidates.`,
        timestamp: new Date(),
        isSystemMessage: false
      }
    } else {
      welcomeMessage = {
        id: `msg-${Date.now()}`,
        type: 'ai',
        content: `🎯 **Welcome to AI-Powered Onboarding!**

I'm Diana Prince, your dedicated AI Onboarding Specialist. I'm here to streamline ${candidateName}'s onboarding journey with intelligent automation and real-time assistance.

**Current Status:**
• Candidate: ${candidateName}
• Stage: ${currentStage}
• Mode: ${isAutonomous ? '🚀 Autonomous (I can take independent actions)' : '🤝 Assist (I will work with your guidance)'}

**What I can help you with:**
✅ Automate onboarding workflows
✅ Monitor background checks
✅ Track document submissions
✅ Generate progress reports
✅ Handle compliance requirements

How would you like to proceed today?`,
        timestamp: new Date(),
        isSystemMessage: false
      }
    }
    
    setMessages([welcomeMessage])
    
    // Initialize activity trace and planning based on current stage
    initializeActivityTrace()
    initializePlanning()

    // Only start streaming for non-Alex Morgan scenarios (unless BGC ready)
    if (candidateName !== 'Alex Morgan' || alexBGCReady === 'true') {
      if (isAutonomous) {
        setTimeout(() => {
          startActivityStream()
          executeAutonomousPlanning()
        }, 2000)
      } else {
        setTimeout(() => {
          startActivityStream()
        }, 1000)
      }
    }
  }

  const startActivityStream = () => {
    // Clear any existing stream to prevent duplicates
    const currentTime = Date.now()
    
    // Add streaming activity updates with intelligent, realistic scenarios
    const streamUpdates = [
      {
        action: "Querying candidate data",
        status: "completed" as const,
        details: `Retrieved comprehensive onboarding data for ${candidateName}`,
        agent: "Data Query Agent",
        delay: 1000
      },
      {
        action: "Understanding immediate actions",
        status: "completed" as const,
        details: `Analyzed current stage: ${currentStage}. Identified next steps in workflow`,
        agent: "Strategic Planner Agent",
        delay: 2500
      },
      {
        action: "Preparing welcome emails for onboarding",
        status: "completed" as const,
        details: "Customizing welcome email template with role-specific information",
        agent: "Content Generation Agent",
        delay: 4000
      },
      {
        action: "Document validation system check",
        status: "completed" as const,
        details: "Verified document upload portal is operational and secure",
        agent: "Security Validation Agent",
        delay: 5500
      },
      {
        action: "BGC vendor integration status",
        status: "completed" as const,
        details: "Confirmed BGC vendor API connectivity and SLA compliance",
        agent: "External Integration Agent",
        delay: 7000
      },
      {
        action: "Passport expiry validation",
        status: "error" as const,
        details: "⚠️ Exception detected: Passport expires in 4 months. Policy requires 6+ months validity",
        agent: "Document Compliance Agent",
        delay: 8500
      },
      {
        action: "Employment gap analysis",
        status: "completed" as const,
        details: "Detected 1-month employment gap. Within Silverline policy (max 3 months allowed)",
        agent: "BGC Analysis Agent",
        delay: 10000
      },
      {
        action: "Generating risk assessment",
        status: "completed" as const,
        details: "Risk level: LOW. Business critical role. Recommended: Approve with conditions",
        agent: "Risk Assessment Agent",
        delay: 11500
      },
      {
        action: "ID creation system ready",
        status: "completed" as const,
        details: "Awaiting BGC approval to trigger automated ID provisioning",
        agent: "Identity Management Agent",
        delay: 13000
      },
      {
        action: "Payroll system integration",
        status: "completed" as const,
        details: "Pre-validating employee setup parameters for payroll system",
        agent: "Payroll Integration Agent",
        delay: 14500
      }
    ]

    // Add stage-specific streaming updates
    if (currentStage === 'BGC Pending') {
      streamUpdates.push({
        action: "Summarizing BGC report",
        status: "completed" as const,
        details: "BGC report processed. Employment gap of 1 month identified between employers",
        agent: "BGC Processing Agent",
        delay: 16000
      })
    }

    if (currentStage === 'Documents Pending') {
      streamUpdates.push({
        action: "Document reminder automation",
        status: "completed" as const,
        details: "Sending automated reminder to candidate for pending document submission",
        agent: "Reminder Automation Agent",
        delay: 16000
      })
    }

    streamUpdates.forEach((update, index) => {
      const timeout = setTimeout(() => {
        const newActivity: ActivityTraceItem = {
          id: `stream-${currentTime}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          action: update.action,
          status: update.status,
          timestamp: new Date(),
          details: update.details,
          agent: update.agent
        }
        
        setActivityTrace(prev => {
          // Check if activity with similar action already exists to prevent duplicates
          const exists = prev.some(activity => 
            activity.action === update.action && activity.agent === update.agent
          )
          if (exists) return prev
          return [...prev, newActivity].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        })
        
        // Auto-scroll to bottom when new activity is added
        if (traceScrollAreaRef.current) {
          setTimeout(() => {
            const scrollContainer = traceScrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
            if (scrollContainer) {
              scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' })
            }
          }, 100)
        }
      }, update.delay)
      
      streamTimeoutsRef.current.push(timeout)
    })
  }

  const initializeActivityTrace = () => {
    // For Alex Morgan, start with empty trace - will be populated by streaming
    if (candidateName === 'Alex Morgan') {
      setActivityTrace([])
      return
    }
    
    const baseActivities: ActivityTraceItem[] = [
      {
        id: `activity-${Date.now()}-1`,
        action: "AI Assistant initialized",
        status: "completed",
        timestamp: new Date(Date.now() - 180000), // 3 minutes ago
        details: "Diana Prince AI Onboarding Specialist activated for candidate journey",
        agent: "System Initialization"
      }
    ]

    // Add stage-specific activities
    if (currentStage === 'Not Started') {
      baseActivities.push({
        id: `activity-${Date.now()}-2`,
        action: "Onboarding workflow identified",
        status: "completed",
        timestamp: new Date(Date.now() - 120000), // 2 minutes ago
        details: "Standard onboarding workflow selected for new hire process",
        agent: "Workflow Selection Agent"
      })
    } else if (currentStage === 'Documents Pending') {
      baseActivities.push({
        id: `activity-${Date.now()}-2`,
        action: "Document collection portal activated",
        status: "completed",
        timestamp: new Date(Date.now() - 120000),
        details: "Secure document upload portal configured for candidate",
        agent: "Document Portal Agent"
      })
    } else if (currentStage === 'BGC Pending') {
      baseActivities.push({
        id: `activity-${Date.now()}-2`,
        action: "BGC vendor integration confirmed",
        status: "completed",
        timestamp: new Date(Date.now() - 120000),
        details: "Background check vendor API connection established",
        agent: "BGC Integration Agent"
      })
    } else if (currentStage === 'Week 1' || currentStage === 'Preboarding') {
      baseActivities.push({
        id: `activity-${Date.now()}-2`,
        action: "Pre-boarding checklist generated",
        status: "completed",
        timestamp: new Date(Date.now() - 120000),
        details: "Customized pre-boarding tasks created based on role and department",
        agent: "Pre-boarding Agent"
      })
    }

    setActivityTrace(baseActivities.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()))
  }

  const initializePlanning = () => {
    const basePlan: PlanningStep[] = []
    
    if (currentStage === 'Not Started') {
      basePlan.push(
        {
          id: 'step-1',
          description: 'Send welcome email with onboarding checklist',
          status: 'planned',
          estimatedTime: '2 minutes'
        },
        {
          id: 'step-2',
          description: 'Set up document collection portal',
          status: 'planned',
          estimatedTime: '5 minutes',
          dependencies: ['step-1']
        },
        {
          id: 'step-3',
          description: 'Schedule orientation meeting',
          status: 'planned',
          estimatedTime: '3 minutes',
          dependencies: ['step-2']
        },
        {
          id: 'step-4',
          description: 'Initiate background check process',
          status: 'planned',
          estimatedTime: '3 minutes'
        }
      )
    } else if (currentStage === 'BGC Pending') {
      basePlan.push(
        {
          id: 'step-1',
          description: 'Review background check report for discrepancies',
          status: 'planned',
          estimatedTime: '15 minutes'
        },
        {
          id: 'step-2',
          description: 'Generate final offer letter if BGC is clear',
          status: 'planned',
          estimatedTime: '5 minutes',
          dependencies: ['step-1']
        }
      )
    }
    
    setPlanningSteps(basePlan)
  }

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI processing and response
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage.content)
      const aiMessageId = `msg-${Date.now()}-ai`
      
      // Add placeholder AI message for streaming
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        type: 'ai',
        content: '', // Start with empty content for streaming
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
      
      // Start character-by-character streaming
      typeMessage(aiResponse.message, aiMessageId)

      // Update activity trace based on the interaction
      if (aiResponse.activities) {
        setActivityTrace(prev => [...prev, ...aiResponse.activities!])
      }

      // Special streaming for Alex Morgan after user mentions Alex
      if (candidateName === 'Alex Morgan' && userMessage.content.toLowerCase().includes('alex')) {
        if (exceptionScenario === 1) {
          setTimeout(() => startAlexMorganActivityStream(), 2000)
        } else if (exceptionScenario === 2) {
          setTimeout(() => startBGCExceptionActivityStream(), 2000)
        }
      }
      
      // Special streaming for Jordan BGC scenario
      if (userMessage.content.toLowerCase().includes('jordan')) {
        setTimeout(() => startJordanBGCActivityStream(), 2000)
      }
      
      // Special streaming for Alex Morgan BGC scenario - manual trigger
      if (userMessage.content.toLowerCase().includes('alex') && userMessage.content.toLowerCase().includes('morgan') && 
          (userMessage.content.toLowerCase().includes('bgc') || userMessage.content.toLowerCase().includes('background') || userMessage.content.toLowerCase().includes('pull'))) {
        setTimeout(() => startAlexMorganBGCActivityStream(), 2000)
      }
    }, 1500)
  }

  const startAlexMorganActivityStream = () => {
    // Clear existing activity trace first
    setActivityTrace([])
    setIsProcessing(false)
    setStreamingActivity(null)
    
    const currentTime = Date.now()
    
    const alexMorganUpdates = [
      {
        action: "Onboarding Planner Agent",
        status: "completed" as const,
        details: "",
        agent: "Onboarding Planner Agent",
        ticketId: "OPA-AM-2024-000"
      },
      {
        action: "Querying candidate data",
        status: "completed" as const,
        details: "Pulling Alex's date from Applicant Tracking System, Analyzing Alex Morgan's role specification and work location\n\nDetermining documentation requirements, BGC checks required for role.",
        agent: "Data Query Agent",
        ticketId: "QRY-AM-2024-001"
      },
      {
        action: "🧠 Understanding immediate actions",
        status: "completed" as const,
        details: "Identifying critical dependencies for January 5th start date, prioritizing task sequence, creating onboarding steps and defining timeline.",
        agent: "Strategic Planner Agent",
        ticketId: "STR-AM-2024-002"
      },
      {
        action: "✍️ Preparing Welcome emails for onboarding",
        status: "completed" as const,
        details: "Generating personalized welcome content, and communicating documentation and BGC requirements for Onboarding",
        agent: "Content Generation Agent",
        ticketId: "CNT-AM-2024-003"
      },
      {
        action: "📤 Sending welcome communications",
        status: "completed" as const,
        details: "Successfully dispatched welcome email package with instructions for document submission",
        agent: "Communication Delivery Agent",
        ticketId: "SND-AM-2024-004"
      },
      {
        action: "👁️ Monitoring email delivery status",
        status: "completed" as const,
        details: "Email delivered successfully",
        agent: "Communication Delivery Agent",
        ticketId: "MON-AM-2024-005"
      }
    ]

    let currentActivityIndex = 0
    const activeTimeouts: NodeJS.Timeout[] = []

    const addTimeout = (timeout: NodeJS.Timeout) => {
      activeTimeouts.push(timeout)
      streamTimeoutsRef.current.push(timeout)
    }

    const processNextActivity = () => {
      if (currentActivityIndex >= alexMorganUpdates.length) {
        // Activity trace completed, show completion message only for scenario 1
        setCurrentStreamingIndex(-1)
        if (exceptionScenario === 1) {
          setTimeout(() => {
            const completionMessage: ChatMessage = {
              id: `msg-${Date.now()}`,
              type: 'ai',
              content: `✅ Process initiated for Alex Morgan • I'll monitor the progress and notify you of any updates.

[View Mail](view-mail)`,
              timestamp: new Date(),
              isSystemMessage: false
            }
            setMessages(prev => [...prev, completionMessage])
            // Set flag in localStorage when Alex Morgan onboarding is initiated
            localStorage.setItem('alexMorganChatCompleted', 'true')
          }, 1000)
        }
        return
      }

      const update = alexMorganUpdates[currentActivityIndex]
      setCurrentStreamingIndex(activityTrace.length + currentActivityIndex)
      const thinkingMessages = [
        "🔍 Analyzing candidate data patterns and requirements...",
        "🧠 Cross-referencing systems and planning optimal workflow...",
        "⚡ Processing contextual information and generating strategy...",
        "📊 Evaluating dependencies and orchestrating task sequence...",
        "🎯 Reasoning through onboarding priorities and timeline...",
        "🔄 Synthesizing data inputs and formulating action plan..."
      ]

      // Show thinking indicator
      setIsProcessing(true)
      setProcessingMessage(thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)])
      
      // Scroll to show processing indicator
      scrollToCurrentActivity()

      // Start streaming after thinking delay
      const thinkingTimeout = setTimeout(() => {
        setIsProcessing(false)
        
        // Initialize streaming activity
        const streamingId = `alex-stream-${currentTime}-${currentActivityIndex}-${Math.random().toString(36).substr(2, 9)}`
        setStreamingActivity({
          id: streamingId,
          action: update.action,
          details: update.details,
          agent: update.agent,
          status: update.status,
          ticketId: update.ticketId,
          streamedAction: "",
          streamedDetails: "",
          isActionComplete: false,
          isDetailsComplete: false
        })

        // Stream action character by character
        let actionIndex = 0
        const streamAction = () => {
          if (actionIndex < update.action.length) {
            setStreamingActivity(prev => prev ? {
              ...prev,
              streamedAction: update.action.substring(0, actionIndex + 1)
            } : null)
            actionIndex++
            const actionTimeout = setTimeout(streamAction, 50) // 50ms per character
            addTimeout(actionTimeout)
          } else {
            setStreamingActivity(prev => prev ? { ...prev, isActionComplete: true } : null)
            
            // Start streaming details after action is complete
            const detailsDelayTimeout = setTimeout(() => {
              let detailsIndex = 0
              const streamDetails = () => {
                if (detailsIndex < update.details.length) {
                  setStreamingActivity(prev => prev ? {
                    ...prev,
                    streamedDetails: update.details.substring(0, detailsIndex + 1)
                  } : null)
                  
                  // Auto-scroll during details streaming to show current activity
                  if (detailsIndex % 2 === 0) {
                    scrollToCurrentActivity()
                  }
                  
                  detailsIndex++
                  const detailsTimeout = setTimeout(streamDetails, 30) // 30ms per character for details
                  addTimeout(detailsTimeout)
                } else {
                  setStreamingActivity(prev => prev ? { ...prev, isDetailsComplete: true } : null)
                  
                  // Complete the activity and add to trace
                  const completeTimeout = setTimeout(() => {
                    // Set appropriate timestamp based on activity index
                    let activityTimestamp = new Date()
                    if (currentActivityIndex === 0) {
                      activityTimestamp = new Date(Date.now() - 60000) // Onboarding Planner Agent - 1 minute ago
                    } else if (currentActivityIndex === 1 || currentActivityIndex === 2) {
                      activityTimestamp = new Date(Date.now() - 60000) // Data Query Agent and Strategic Planner - 1 minute ago
                    } else {
                      activityTimestamp = new Date(Date.now() - 30000) // Content Generation and Communication Delivery - less than a minute ago
                    }
                    
                    const newActivity: ActivityTraceItem = {
                      id: streamingId,
                      action: update.action,
                      status: update.status,
                      timestamp: activityTimestamp,
                      details: update.details,
                      agent: update.agent,
                      ticketId: update.ticketId
                    }
                    
                    setActivityTrace(prev => [...prev, newActivity])
                    setStreamingActivity(null)
                    currentActivityIndex++
                    
                    // Auto-scroll
                    const scrollTimeout = setTimeout(() => {
                      if (traceScrollAreaRef.current) {
                        const scrollContainer = traceScrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
                        if (scrollContainer) {
                          scrollContainer.scrollTop = scrollContainer.scrollHeight
                        }
                      }
                    }, 100)
                    addTimeout(scrollTimeout)
                    
                    // Process next activity after delay
                    const nextActivityTimeout = setTimeout(processNextActivity, 2000)
                    addTimeout(nextActivityTimeout)
                  }, 500)
                  addTimeout(completeTimeout)
                }
              }
              streamDetails()
            }, 300)
            addTimeout(detailsDelayTimeout)
          }
        }
        streamAction()
      }, 2000) // 2 second thinking time
      addTimeout(thinkingTimeout)
    }

    processNextActivity()
  }

  const startJordanBGCActivityStream = () => {
    // Clear existing activity trace first
    setActivityTrace([])
    setIsProcessing(false)
    setStreamingActivity(null)
    
    const currentTime = Date.now()
    
    const jordanBGCUpdates = [
      {
        action: "Onboarding Planner Agent",
        status: "completed" as const,
        details: "",
        agent: "Onboarding Planner Agent",
        ticketId: "OPA-JO-2024-000"
      },
      {
        action: "📊 Summarizing BGC report",
        status: "completed" as const,
        details: "Analyzing background check findings, employment gaps, and risk assessment metrics from vendor report",
        agent: "BGC Analysis Agent",
        ticketId: "BGC-SUM-2024-001"
      },
      {
        action: "🎯 Generating recommendations",
        status: "completed" as const,
        details: "Processing company policy guidelines, risk thresholds, and business impact to formulate approval recommendation",
        agent: "Risk Assessment Agent",
        ticketId: "REC-GEN-2024-002"
      },
      {
        action: "🚀 Launching AI agents for ID creation",
        status: "completed" as const,
        details: "Deploying IdentityBot, PayrollAgent, and AssetProvisionBot for employee system setup and provisioning",
        agent: "Orchestration Hub",
        ticketId: "BOT-LAUNCH-2024-003"
      },
      {
        action: "🎫 Tickets created for system setup",
        status: "completed" as const,
        details: "Generated tracking tickets: EMP-ID-AM-2024, PAY-SETUP-AM-2024, IT-ASSETS-AM-2024 for monitoring progress",
        agent: "Ticket Management System",
        ticketId: "TKT-CREATE-2024-004"
      }
    ]

    let currentActivityIndex = 0
    const activeTimeouts: NodeJS.Timeout[] = []

    const addTimeout = (timeout: NodeJS.Timeout) => {
      activeTimeouts.push(timeout)
      streamTimeoutsRef.current.push(timeout)
    }

    const processNextActivity = () => {
      if (currentActivityIndex >= jordanBGCUpdates.length) {
        // Jordan BGC activity trace completed, show BGC report summary
        setCurrentStreamingIndex(-1)
        setTimeout(() => {
          const completionMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            type: 'ai',
            content: `I've reviewed the BGC report for Jordan.

**Summary of BGC report:**
- Employment gap of 1 month between last 2 jobs at Company X and Company Y
- Employment period with employer1: 18 months  
- Employment gap: 1 month
- Employment period with employer2: 24 months
- **Exception detected:** Passport expires in 4 months (Policy requires 6+ months)

**Risk Assessment:** Low risk - Employment gap within Silverline Manufacturing policy (allows maximum gap of 3 months)

**Recommended actions:** 
1. Approve BGC exception as it is low risk and business critical role
2. Request passport renewal before start date
3. Risk of denying: Delay in onboarding for critical position

Do you want to approve this exception?`,
            timestamp: new Date(),
            isSystemMessage: false
          }
          setMessages(prev => [...prev, completionMessage])
          // Set flag in localStorage when Jordan Lee BGC is completed
          localStorage.setItem('jordanLeeBGCCompleted', 'true')
        }, 1000)
        return
      }

      const update = jordanBGCUpdates[currentActivityIndex]
      setCurrentStreamingIndex(activityTrace.length + currentActivityIndex)
      const thinkingMessages = [
        "🔍 Parsing BGC report data and policy compliance...",
        "🧠 Evaluating risk factors and business impact...",
        "⚡ Cross-referencing approval guidelines and precedents...",
        "📊 Computing risk scores and recommendation confidence...",
        "🎯 Orchestrating system provisioning workflows...",
        "🔄 Coordinating multi-agent deployment sequence..."
      ]

      // Show thinking indicator
      setIsProcessing(true)
      setProcessingMessage(thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)])
      
      // Scroll to show processing indicator
      scrollToCurrentActivity()

      // Start streaming after thinking delay
      const thinkingTimeout = setTimeout(() => {
        setIsProcessing(false)
        
        // Initialize streaming activity
        const streamingId = `jordan-stream-${currentTime}-${currentActivityIndex}-${Math.random().toString(36).substr(2, 9)}`
        setStreamingActivity({
          id: streamingId,
          action: update.action,
          details: update.details,
          agent: update.agent,
          status: update.status,
          ticketId: update.ticketId,
          streamedAction: "",
          streamedDetails: "",
          isActionComplete: false,
          isDetailsComplete: false
        })

        // Stream action character by character
        let actionIndex = 0
        const streamAction = () => {
          if (actionIndex < update.action.length) {
            setStreamingActivity(prev => prev ? {
              ...prev,
              streamedAction: update.action.substring(0, actionIndex + 1)
            } : null)
            actionIndex++
            const actionTimeout = setTimeout(streamAction, 50) // 50ms per character
            addTimeout(actionTimeout)
          } else {
            setStreamingActivity(prev => prev ? { ...prev, isActionComplete: true } : null)
            
            // Start streaming details after action is complete
            const detailsDelayTimeout = setTimeout(() => {
              let detailsIndex = 0
              const streamDetails = () => {
                if (detailsIndex < update.details.length) {
                  setStreamingActivity(prev => prev ? {
                    ...prev,
                    streamedDetails: update.details.substring(0, detailsIndex + 1)
                  } : null)
                  
                  // Auto-scroll during details streaming to show current activity
                  if (detailsIndex % 2 === 0) {
                    scrollToCurrentActivity()
                  }
                  
                  detailsIndex++
                  const detailsTimeout = setTimeout(streamDetails, 30) // 30ms per character for details
                  addTimeout(detailsTimeout)
                } else {
                  setStreamingActivity(prev => prev ? { ...prev, isDetailsComplete: true } : null)
                  
                  // Complete the activity and add to trace
                  const completeTimeout = setTimeout(() => {
                    // Set appropriate timestamp based on activity index
                    let activityTimestamp = new Date()
                    if (currentActivityIndex === 0 || currentActivityIndex === 1 || currentActivityIndex === 2) {
                      activityTimestamp = new Date(Date.now() - 180000) // First three - 3 minutes ago
                    } else {
                      activityTimestamp = new Date(Date.now() - 60000) // Last two - 1 minute ago
                    }
                    
                    const newActivity: ActivityTraceItem = {
                      id: streamingId,
                      action: update.action,
                      status: update.status,
                      timestamp: activityTimestamp,
                      details: update.details,
                      agent: update.agent,
                      ticketId: update.ticketId
                    }
                    
                    setActivityTrace(prev => [...prev, newActivity])
                    setStreamingActivity(null)
                    currentActivityIndex++
                    
                    // Auto-scroll
                    const scrollTimeout = setTimeout(() => {
                      if (traceScrollAreaRef.current) {
                        const scrollContainer = traceScrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
                        if (scrollContainer) {
                          scrollContainer.scrollTop = scrollContainer.scrollHeight
                        }
                      }
                    }, 100)
                    addTimeout(scrollTimeout)
                    
                    // Process next activity after delay
                    const nextActivityTimeout = setTimeout(processNextActivity, 2000)
                    addTimeout(nextActivityTimeout)
                  }, 500)
                  addTimeout(completeTimeout)
                }
              }
              streamDetails()
            }, 300)
            addTimeout(detailsDelayTimeout)
          }
        }
        streamAction()
      }, 2000) // 2 second thinking time
      addTimeout(thinkingTimeout)
    }

    processNextActivity()
  }

  const startAlexMorganBGCActivityStream = () => {
    // Clear existing activity trace first
    setActivityTrace([])
    setIsProcessing(false)
    setStreamingActivity(null)
    
    const currentTime = Date.now()
    
    const alexBGCUpdates = [
      {
        action: "🔍 Pulling BGC Reports",
        status: "completed" as const,
        details: "Retrieving comprehensive background check report from verification partner system",
        agent: "BGC Retrieval Agent",
        ticketId: "BGC-PULL-AM-2024-001"
      },
      {
        action: "📊 Analyzing Employment History",
        status: "completed" as const,
        details: "Cross-referencing employment dates, verifying positions at Innodate and DataZenith Analytics",
        agent: "Employment Verification Agent",
        ticketId: "EMP-VER-AM-2024-002"
      },
      {
        action: "⚠️ Exception Detection",
        status: "completed" as const,
        details: "Identified 2-month employment gap between Innodate (June 2023) and DataZenith Analytics (September 2022)",
        agent: "Risk Assessment Agent",
        ticketId: "RISK-AM-2024-003"
      },
      {
        action: "📋 Policy Compliance Check",
        status: "completed" as const,
        details: "Comparing gap against CoreSpectrum Inc policy (max 1 month allowed), flagging for manual review",
        agent: "Compliance Validation Agent",
        ticketId: "POL-CHK-AM-2024-004"
      },
      {
        action: "🎯 Generating Recommendation",
        status: "completed" as const,
        details: "Evaluating business impact, role criticality, and start date proximity to formulate approval recommendation",
        agent: "Decision Support Agent",
        ticketId: "REC-GEN-AM-2024-005"
      }
    ]
    
    let currentActivityIndex = 0

    // Store timeouts for cleanup
    const activeTimeouts: NodeJS.Timeout[] = []

    const addTimeout = (timeout: NodeJS.Timeout) => {
      activeTimeouts.push(timeout)
      streamTimeoutsRef.current.push(timeout)
    }

    const processNextActivity = () => {
      if (currentActivityIndex >= alexBGCUpdates.length) {
        // Alex Morgan BGC activity trace completed
        setCurrentStreamingIndex(-1)
        // Set flag in localStorage when Alex Morgan BGC is completed
        localStorage.setItem('alexMorganBGCCompleted', 'true')
        return
      }

      const update = alexBGCUpdates[currentActivityIndex]
      setCurrentStreamingIndex(activityTrace.length + currentActivityIndex)
      const thinkingMessages = [
        "🔍 Processing BGC report data and policy framework...",
        "🧠 Evaluating employment gaps against company policies...",
        "⚡ Cross-referencing risk factors and business requirements...",
        "📊 Analyzing compliance thresholds and exception criteria...",
        "🎯 Formulating recommendations based on role criticality...",
        "🔄 Coordinating approval workflow and impact assessment..."
      ]

      // Show thinking indicator
      setIsProcessing(true)
      setProcessingMessage(thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)])
      
      // Scroll to show processing indicator
      scrollToCurrentActivity()

      // Start streaming after thinking delay
      const thinkingTimeout = setTimeout(() => {
        setIsProcessing(false)
        
        // Initialize streaming activity
        const streamingId = `alex-bgc-stream-${currentTime}-${currentActivityIndex}-${Math.random().toString(36).substr(2, 9)}`
        setStreamingActivity({
          id: streamingId,
          action: update.action,
          details: update.details,
          agent: update.agent,
          status: update.status,
          ticketId: update.ticketId,
          streamedAction: "",
          streamedDetails: "",
          isActionComplete: false,
          isDetailsComplete: false
        })

        // Stream action character by character
        let actionIndex = 0
        const streamAction = () => {
          if (actionIndex < update.action.length) {
            setStreamingActivity(prev => prev ? {
              ...prev,
              streamedAction: update.action.substring(0, actionIndex + 1)
            } : null)
            actionIndex++
            const actionTimeout = setTimeout(streamAction, 50) // 50ms per character
            addTimeout(actionTimeout)
          } else {
            setStreamingActivity(prev => prev ? { ...prev, isActionComplete: true } : null)
            
            // Start streaming details after action is complete
            const detailsDelayTimeout = setTimeout(() => {
              let detailsIndex = 0
              const streamDetails = () => {
                if (detailsIndex < update.details.length) {
                  setStreamingActivity(prev => prev ? {
                    ...prev,
                    streamedDetails: update.details.substring(0, detailsIndex + 1)
                  } : null)
                  
                  // Auto-scroll during details streaming to show current activity
                  if (detailsIndex % 2 === 0) {
                    scrollToCurrentActivity()
                  }
                  
                  detailsIndex++
                  const detailsTimeout = setTimeout(streamDetails, 30) // 30ms per character for details
                  addTimeout(detailsTimeout)
                } else {
                  setStreamingActivity(prev => prev ? { ...prev, isDetailsComplete: true } : null)
                  
                  // Complete the activity and add to trace
                  const completeTimeout = setTimeout(() => {
                    const newActivity: ActivityTraceItem = {
                      id: streamingId,
                      action: update.action,
                      status: update.status,
                      timestamp: new Date(),
                      details: update.details,
                      agent: update.agent,
                      ticketId: update.ticketId
                    }
                    
                    setActivityTrace(prev => [...prev, newActivity])
                    setStreamingActivity(null)
                    currentActivityIndex++
                    
                    // Auto-scroll
                    const scrollTimeout = setTimeout(() => {
                      if (traceScrollAreaRef.current) {
                        const scrollContainer = traceScrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
                        if (scrollContainer) {
                          scrollContainer.scrollTop = scrollContainer.scrollHeight
                        }
                      }
                    }, 100)
                    addTimeout(scrollTimeout)
                    
                    // Process next activity after delay
                    const nextActivityTimeout = setTimeout(processNextActivity, 2000)
                    addTimeout(nextActivityTimeout)
                  }, 500)
                  addTimeout(completeTimeout)
                }
              }
              streamDetails()
            }, 300)
            addTimeout(detailsDelayTimeout)
          }
        }
        streamAction()
      }, 2000) // 2 second thinking time
      addTimeout(thinkingTimeout)
    }

    processNextActivity()
  }

  const triggerSecondExceptionScenario = () => {
    // Send BGC report message after first scenario completes
    const bgcMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'ai',
      content: `Hi 👋 Welcome back!

As promised, keeping you updated on onboarding journey of 2 candidates. Alex has uploaded documents and BGC report has been received from the BGC vendor.

**Summary of BGC report:**
✅ Criminal Background: Clear
✅ Education Verification: Confirmed - MS Computer Science, Stanford University
⚠️ Employment History: Gap identified

**Recommended actions:** 
Approve BGC exception as it is low risk and Silverline Manufacturing policy allows a maximum gap of **2 months**. There is an employment gap of **1 month** between last 2 jobs at TechCorp and DataSystems.

**Employment period with TechCorp:** Jan 2022 - Aug 2023
**Employment gap:** Sep 2023 - Sep 2023 (1 month)
**Employment period with DataSystems:** Oct 2023 - Present

**Risk of denying:** Delay in onboarding. Business critical role with Dec 16 start date.

Do you want to approve this exception?`,
      timestamp: new Date(),
      isSystemMessage: false
    }

    setMessages(prev => [...prev, bgcMessage])
  }

  const startBGCExceptionActivityStream = () => {
    // Don't clear activity trace - append to existing activities
    setIsProcessing(false)
    setStreamingActivity(null)
    
    const currentTime = Date.now()
    
    const bgcActivityUpdates = [
      {
        action: "📊 Summarizing BGC report",
        status: "completed" as const,
        details: "Analyzing background check findings, employment gaps, and risk assessment metrics from vendor report",
        agent: "BGC Analysis Agent",
        ticketId: "BGC-SUM-2024-001"
      },
      {
        action: "🎯 Generating recommendations",
        status: "completed" as const,
        details: "Processing company policy guidelines, risk thresholds, and business impact to formulate approval recommendation",
        agent: "Risk Assessment Agent",
        ticketId: "REC-GEN-2024-002"
      },
      {
        action: "🚀 Launching AI agents for ID creation",
        status: "completed" as const,
        details: "Deploying IdentityBot, PayrollAgent, and AssetProvisionBot for employee system setup and provisioning",
        agent: "Orchestration Hub",
        ticketId: "BOT-LAUNCH-2024-003"
      },
      {
        action: "🎫 Tickets created for system setup",
        status: "completed" as const,
        details: "Generated tracking tickets: EMP-ID-AM-2024, PAY-SETUP-AM-2024, IT-ASSETS-AM-2024 for monitoring progress",
        agent: "Ticket Management System",
        ticketId: "TKT-CREATE-2024-004"
      }
    ]

    let currentActivityIndex = 0
    const activeTimeouts: NodeJS.Timeout[] = []

    const addTimeout = (timeout: NodeJS.Timeout) => {
      activeTimeouts.push(timeout)
      streamTimeoutsRef.current.push(timeout)
    }

    const processNextActivity = () => {
      if (currentActivityIndex >= bgcActivityUpdates.length) {
        setCurrentStreamingIndex(-1)
        return
      }

      const update = bgcActivityUpdates[currentActivityIndex]
      setCurrentStreamingIndex(activityTrace.length + currentActivityIndex)
      const thinkingMessages = [
        "🔍 Parsing BGC report data and policy compliance...",
        "🧠 Evaluating risk factors and business impact...",
        "⚡ Cross-referencing approval guidelines and precedents...",
        "📊 Computing risk scores and recommendation confidence...",
        "🎯 Orchestrating system provisioning workflows...",
        "🔄 Coordinating multi-agent deployment sequence..."
      ]

      // Show thinking indicator
      setIsProcessing(true)
      setProcessingMessage(thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)])
      
      // Scroll to show processing indicator
      scrollToCurrentActivity()

      // Start streaming after thinking delay
      const thinkingTimeout = setTimeout(() => {
        setIsProcessing(false)
        
        // Initialize streaming activity
        const streamingId = `bgc-stream-${currentTime}-${currentActivityIndex}-${Math.random().toString(36).substr(2, 9)}`
        setStreamingActivity({
          id: streamingId,
          action: update.action,
          details: update.details,
          agent: update.agent,
          status: update.status,
          ticketId: update.ticketId,
          streamedAction: "",
          streamedDetails: "",
          isActionComplete: false,
          isDetailsComplete: false
        })

        // Stream action character by character
        let actionIndex = 0
        const streamAction = () => {
          if (actionIndex < update.action.length) {
            setStreamingActivity(prev => prev ? {
              ...prev,
              streamedAction: prev.streamedAction + update.action[actionIndex]
            } : null)
            
            // Auto-scroll during streaming to show current activity
            scrollToCurrentActivity()
            
            actionIndex++
            
            const actionTimeout = setTimeout(streamAction, 50)
            addTimeout(actionTimeout)
          } else {
            // Action complete, start streaming details
            setStreamingActivity(prev => prev ? { ...prev, isActionComplete: true } : null)
            
            const detailsDelayTimeout = setTimeout(() => {
              let detailsIndex = 0
              const streamDetails = () => {
                if (detailsIndex < update.details.length) {
                  setStreamingActivity(prev => prev ? {
                    ...prev,
                    streamedDetails: prev.streamedDetails + update.details[detailsIndex]
                  } : null)
                  
                  // Auto-scroll during details streaming to show current activity
                  if (detailsIndex % 2 === 0) {
                    scrollToCurrentActivity()
                  }
                  
                  detailsIndex++
                  
                  const detailsTimeout = setTimeout(streamDetails, 30)
                  addTimeout(detailsTimeout)
                } else {
                  // Details complete, finalize activity
                  setStreamingActivity(prev => prev ? { ...prev, isDetailsComplete: true } : null)
                  
                  const completeTimeout = setTimeout(() => {
                    // Add to activity trace
                    setActivityTrace(prev => [...prev, {
                      id: streamingId,
                      action: update.action,
                      details: update.details,
                      agent: update.agent,
                      status: update.status,
                      timestamp: new Date(),
                      ticketId: update.ticketId
                    }])
                    
                    // Clear streaming activity
                    setStreamingActivity(null)
                    currentActivityIndex++
                    
                    // Ensure scroll to bottom after completion
                    scrollToCurrentActivity()
                    
                    // Process next activity after delay
                    const nextActivityTimeout = setTimeout(processNextActivity, 2000)
                    addTimeout(nextActivityTimeout)
                  }, 500)
                  addTimeout(completeTimeout)
                }
              }
              streamDetails()
            }, 300)
            addTimeout(detailsDelayTimeout)
          }
        }
        streamAction()
      }, 2000) // 2 second thinking time
      addTimeout(thinkingTimeout)
    }

    processNextActivity()
  }

  const typeMessage = (message: string, messageId: string) => {
    setIsMessageStreaming(true)
    setStreamingMessage('')
    setCurrentTypingMessageId(messageId)
    
    let index = 0
    const typeNextChar = () => {
      if (index < message.length) {
        setStreamingMessage(prev => prev + message[index])
        index++
        
        // Auto scroll to bottom as message streams in
        setTimeout(() => {
          if (chatScrollAreaRef.current) {
            const scrollContainer = chatScrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
            if (scrollContainer) {
              scrollContainer.scrollTop = scrollContainer.scrollHeight
            }
          }
        }, 10)
        
        setTimeout(typeNextChar, 30) // 30ms per character
      } else {
        // Streaming complete, update the actual message
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, content: message } : msg
        ))
        setIsMessageStreaming(false)
        setCurrentTypingMessageId(null)
        setStreamingMessage('')
      }
    }
    
    setTimeout(typeNextChar, 500) // Initial delay
  }

  const scrollToCurrentActivity = () => {
    setTimeout(() => {
      if (traceScrollAreaRef.current) {
        const scrollContainer = traceScrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
        if (scrollContainer) {
          // Always scroll to bottom to show latest activity/processing
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      }
    }, 100)
  }

  const parseMarkdownText = (text: string) => {
    // Handle [View Mail] link first
    if (text.includes('[View Mail](view-mail)')) {
      const parts = text.split('[View Mail](view-mail)')
      return (
        <>
          {parts[0]}
          <Button 
            onClick={() => setShowEmailPopup(true)}
            variant="outline"
            size="sm"
            className="ml-2"
          >
            <Mail className="w-4 h-4 mr-2" />
            View Mail
          </Button>
          {parts[1]}
        </>
      )
    }
    
    // Handle bold text (**text**)
    const parts = text.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // Odd indices are the content inside **
        return <strong key={index}>{part}</strong>
      }
      return part
    })
  }

  const generateAIResponse = (userInput: string): { message: string, activities?: ActivityTraceItem[] } => {
    const input = userInput.toLowerCase()

    // Special handling for Alex Morgan exception scenario 1
    if (candidateName === 'Alex Morgan' && exceptionScenario === 1 && input.includes('alex')) {
      // User mentioned Alex - activity trace will start
      return {
        message: ``,
        activities: []
      }
    }

    // Special handling for Alex Morgan exception scenario 2 - BGC Report
    if (candidateName === 'Alex Morgan' && exceptionScenario === 2 && (input.includes('yes') || input.includes('approve') || input.includes('accept'))) {
      // User approved BGC exception
      return {
        message: `Thanks! ✅ BGC exception approved successfully.

**Next steps triggered automatically:**
• Employee ID creation initiated
• Payroll system setup in progress
• IT asset allocation workflow started
• Security access provisioning scheduled

All systems are now processing Alex Morgan's onboarding. You'll receive updates as each step completes.`,
        activities: [
          {
            id: `activity-${Date.now()}-bgc-approved`,
            action: "BGC exception approved",
            status: "completed",
            timestamp: new Date(),
            details: "Exception Scenario 2 completed: Background check exception approved for Alex Morgan",
            agent: "BGC Review Agent",
            ticketId: "BGC-AM-2024-APP"
          }
        ]
      }
    }

    if (input.includes('start') || input.includes('initiate') || input.includes('begin')) {
      return {
        message: `Perfect! I'll start the onboarding process for ${candidateName}. ${isAutonomous ? 'Autonomously executing' : 'Initiating with your oversight'} the welcome email and document collection process now.`,
        activities: [
          {
            id: `activity-${Date.now()}-auto`,
            action: "Sending welcome email",
            status: "in-progress",
            timestamp: new Date(),
            details: "Automated welcome email being sent to candidate",
            agent: "Communication Agent",
            ticketId: "WEL-2024-AUTO"
          },
          {
            id: `activity-${Date.now()}-auto-2`,
            action: "Setting up document collection",
            status: "pending",
            timestamp: new Date(),
            details: "Preparing secure document upload portal",
            agent: "System Configuration Agent"
          }
        ]
      }
    }

    if ((input.includes('bgc') || input.includes('background') || input.includes('check')) && !input.includes('jordan')) {
      return {
        message: `I've reviewed the BGC report for ${candidateName}. 

**Summary of BGC report:**
- Employment gap of 1 month between last 2 jobs at Company X and Company Y
- Employment period with employer1: 18 months  
- Employment gap: 1 month
- Employment period with employer2: 24 months
- **Exception detected:** Passport expires in 4 months (Policy requires 6+ months)

**Risk Assessment:** Low risk - Employment gap within Silverline Manufacturing policy (allows maximum gap of 3 months)

**Recommended actions:** 
1. Approve BGC exception as it is low risk and business critical role
2. Request passport renewal before start date
3. Risk of denying: Delay in onboarding for critical position

Do you want to approve this exception?`,
        activities: [
          {
            id: `activity-${Date.now()}-bgc-1`,
            action: "BGC report analysis completed",
            status: "completed",
            timestamp: new Date(),
            details: "Comprehensive background check report processed and analyzed",
            agent: "BGC Analysis Agent",
            ticketId: `BGC-${Date.now().toString().slice(-4)}`
          },
          {
            id: `activity-${Date.now()}-bgc-2`,
            action: "Exception validation performed",
            status: "completed",
            timestamp: new Date(),
            details: "Passport expiry and employment gap exceptions identified and assessed",
            agent: "Compliance Validation Agent",
            ticketId: `EXC-${Date.now().toString().slice(-4)}`
          },
          {
            id: `activity-${Date.now()}-bgc-3`,
            action: "Risk assessment generated",
            status: "completed",
            timestamp: new Date(),
            details: "Low risk assessment confirmed. Approval recommended with conditions",
            agent: "Risk Assessment Agent",
            ticketId: `RISK-${Date.now().toString().slice(-4)}`
          }
        ]
      }
    }

    if (input.includes('yes') || input.includes('approve') || input.includes('proceed')) {
      return {
        message: `Thank you! ${isAutonomous ? 'Autonomously proceeding' : 'I\'m proceeding'} with the next steps. Launching AI agents for ID creation, payroll setup, and asset allocation processes. I'll keep you updated on the progress.

**Tickets Created:**
- ID Creation: ID-${Date.now().toString().slice(-4)}
- Payroll Setup: PAY-${Date.now().toString().slice(-4)}
- Asset Allocation: AST-${Date.now().toString().slice(-4)}`,
        activities: [
          {
            id: `activity-${Date.now()}-approval-1`,
            action: "BGC exception approved",
            status: "completed",
            timestamp: new Date(),
            details: "Background check exception officially approved with conditions",
            agent: "Approval Management Agent",
            ticketId: `APP-${Date.now().toString().slice(-4)}`
          },
          {
            id: `activity-${Date.now()}-approval-2`,
            action: "Launching AI agents for ID creation",
            status: "in-progress",
            timestamp: new Date(),
            details: "Automated identity management workflow initiated",
            agent: "Identity Management Agent",
            ticketId: `ID-${Date.now().toString().slice(-4)}`
          },
          {
            id: `activity-${Date.now()}-approval-3`,
            action: "Payroll system integration triggered",
            status: "in-progress",
            timestamp: new Date(),
            details: "Employee payroll setup process initiated",
            agent: "Payroll Integration Agent",
            ticketId: `PAY-${Date.now().toString().slice(-4)}`
          },
          {
            id: `activity-${Date.now()}-approval-4`,
            action: "Asset allocation workflow started",
            status: "pending",
            timestamp: new Date(),
            details: "IT asset provisioning queue updated for new employee",
            agent: "Asset Management Agent",
            ticketId: `AST-${Date.now().toString().slice(-4)}`
          },
          {
            id: `activity-${Date.now()}-approval-5`,
            action: "Downstream tickets orchestrated",
            status: "completed",
            timestamp: new Date(),
            details: "Multiple workflow tickets created and assigned to respective teams",
            agent: "Orchestration Agent",
            ticketId: `ONB-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
          }
        ]
      }
    }

    if (input.includes('status') || input.includes('update') || input.includes('progress')) {
      return {
        message: `**Current Status for ${candidateName}:**
- Stage: ${currentStage}
- Progress: ${Math.floor(Math.random() * 40) + 30}% complete
- Last Activity: Document verification completed
- Next Milestone: Background check completion
- Expected Timeline: 2-3 business days
- ${isAutonomous ? 'Autonomous monitoring active' : 'Manual oversight required'}`
      }
    }

    if (input.includes('document') || input.includes('upload')) {
      return {
        message: `${candidateName} has uploaded their documents successfully. I'm now ${isAutonomous ? 'autonomously' : ''} processing them for verification. The documents include passport, educational certificates, and previous employment records. All appear to be in order.`,
        activities: [
          {
            id: `activity-${Date.now()}-doc`,
            action: "Document verification in progress",
            status: "in-progress",
            timestamp: new Date(),
            details: "Automated document validation running",
            agent: "Document Processing Agent"
          }
        ]
      }
    }

    if (input.includes('autonomous') || input.includes('assist')) {
      const mode = input.includes('autonomous') ? 'autonomous' : 'assist'
      setIsAutonomous(mode === 'autonomous')
      return {
        message: `Switching to ${mode.toUpperCase()} mode. ${mode === 'autonomous' ? 'I will now take independent actions and provide updates.' : 'I will now wait for your guidance before taking actions.'}`
      }
    }

    // Special handling for Jordan BGC scenario
    if (input.includes('jordan')) {
      // Don't show BGC report immediately, let activity trace complete first
      return {
        message: ``,
        activities: []
      }
    }

    // Special handling for Alex Morgan BGC scenario - manual trigger
    if (input.includes('alex') && input.includes('morgan') && (input.includes('bgc') || input.includes('background') || input.includes('pull'))) {
      // Don't show BGC report immediately, let activity trace complete first
      return {
        message: ``,
        activities: []
      }
    }

    // Default response
    return {
      message: `I understand your query about ${candidateName}. In ${isAutonomous ? 'Autonomous' : 'Assist'} mode, I can help you start onboarding, check BGC status, review documents, get status updates, or switch between modes. How would you like to proceed?`
    }
  }

  const getActivityTickMark = (activity: ActivityTraceItem, index: number) => {
    const isEmail = activity.action.toLowerCase().includes('sending') || activity.action.toLowerCase().includes('email')
    const isCompleted = activity.status === 'completed'
    const isCurrentStreaming = index === currentStreamingIndex && streamingActivity
    
    // For completed activities, always show checkmark
    if (isCompleted && !isCurrentStreaming) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    
    // For currently streaming activities
    if (isCurrentStreaming) {
      if (isEmail && isTimerRunning) {
        return (
          <div className="flex items-center gap-1">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-xs text-blue-600 font-mono">{emailTimer}s</span>
          </div>
        )
      }
      return <div className="animate-pulse w-4 h-4 bg-blue-400 rounded-full"></div>
    }
    
    // For pending activities
    return <Clock className="h-4 w-4 text-gray-400" />
  }

  const getActivityIcon = (status: ActivityTraceItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'in-progress':
        return <Activity className="h-3 w-3 text-blue-500 animate-pulse" />
      case 'error':
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      default:
        return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  const getActivityStatusColor = (status: ActivityTraceItem['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTraceIcon = (status: ActivityTraceItem['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      case 'pending': return <Clock className="w-5 h-5 text-gray-400" />
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  const getPlanIcon = (status: PlanningStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'executing': return <Zap className="w-5 h-5 text-blue-500 animate-pulse" />
      case 'planned': return <Target className="w-5 h-5 text-gray-400" />
      case 'failed': return <AlertTriangle className="w-5 h-5 text-red-500" />
      default: return <Workflow className="w-5 h-5" />
    }
  }

  const handleExecutePlan = () => {
    if (!isAutonomous) return
    setIsExecutingPlan(true)
    
    const executeStep = (index: number) => {
      if (index >= planningSteps.length) {
        setIsExecutingPlan(false)
        return
      }

      setPlanningSteps(prev => prev.map((step, i) => 
        i === index ? { ...step, status: 'executing' } : step
      ))

      const step = planningSteps[index]
      const executionTime = parseInt(step.estimatedTime || '1') * 1000 // Convert minutes to ms

      setTimeout(() => {
        setPlanningSteps(prev => prev.map((s, i) => 
          i === index ? { ...s, status: 'completed' } : s
        ))
        
        // Add a corresponding activity trace item
        const newActivity: ActivityTraceItem = {
          id: `activity-plan-${step.id}-${Date.now()}`,
          action: `Completed: ${step.description}`,
          status: 'completed',
          timestamp: new Date(),
          agent: 'Autonomous Agent'
        }
        setActivityTrace(prev => [...prev, newActivity].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()))

        executeStep(index + 1)
      }, executionTime)
    }

    executeStep(0)
  }

  const executeAutonomousPlanning = () => {
    // Placeholder for more complex autonomous logic
    if (isAutonomous) {
      handleExecutePlan()
    }
  }

  const handlePausePlan = () => {
    setIsExecutingPlan(false)
    // In a real scenario, you'd need to manage pausing timeouts/intervals
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Inject custom styles for streaming animations */}
      <style dangerouslySetInnerHTML={{ __html: streamingStyles }} />
      
      <DialogContent className="sm:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Bot className="w-7 h-7 text-primary" />
                <span>AI Onboarding Assistant: {candidateName}</span>
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Managing onboarding for {candidateId}. Current stage: <Badge>{currentStage}</Badge>
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
          <div className="md:col-span-2 flex flex-col gap-4 min-h-0 overflow-hidden">
            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Chat
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isAutonomous ? "destructive" : "secondary"}>
                      {isAutonomous ? "Autonomous Mode" : "Assist Mode"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => setIsAutonomous(!isAutonomous)}>
                      {isAutonomous ? <UserCheck className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                      Toggle Mode
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 min-h-0 p-0 overflow-hidden">
                <div className="flex-1 min-h-0 px-6">
                  <ScrollArea className="h-full" ref={chatScrollAreaRef}>
                    <div className="py-4">
                      <style>{streamingStyles}</style>
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-3 my-4 ${msg.type === 'user' ? 'justify-end' : ''}`}>
                          {msg.type === 'ai' && (
                            <Avatar className="w-8 h-8 border-2 border-primary">
                              <AvatarImage src="/ai-avatar.png" />
                              <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`rounded-lg p-3 max-w-[80%] ${msg.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} ${msg.isSystemMessage ? 'border-l-4 border-blue-500' : ''}`} style={{ animation: 'slideInRight 0.3s ease-out forwards' }}>
                            <div className="text-sm whitespace-pre-wrap">
                              {msg.type === 'ai' && isMessageStreaming && msg.id === messages[messages.length - 1]?.id ? 
                                parseMarkdownText(streamingMessage) : 
                                parseMarkdownText(msg.content)
                              }
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 text-right">{format(msg.timestamp, "h:mm a")}</p>
                          </div>
                          {msg.type === 'user' && (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src="/user-avatar.png" />
                              <AvatarFallback>You</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Bot className="w-5 h-5 animate-pulse" />
                          <span>Diana is thinking...</span>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <div className="flex items-center gap-2 px-6 pb-6 flex-shrink-0">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your command or question..."
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={isTyping}>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-1 flex flex-col gap-4 min-h-0 overflow-hidden">
            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  AI Activity Trace
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
                <div className="h-full px-3">
                  <ScrollArea className="h-full" ref={traceScrollAreaRef}>
                    <div className="py-4 space-y-4 pr-2">{/* Extra padding for scrollbar */}
                      {/* Empty state when no activities */}
                      {!isProcessing && !streamingActivity && activityTrace.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          <div className="text-center">
                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Waiting for AI agent activities...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Activity items with streaming integrated */}
                      {activityTrace.map((item, index) => (
                        <div 
                          key={item.id} 
                          data-activity-index={index}
                          className="flex items-start gap-3 animate-in slide-in-from-right-3 fade-in duration-700"
                          style={{ animationDelay: `${index * 150}ms` }}
                        >
                          <div className="w-8 flex justify-center flex-shrink-0">
                            {getActivityTickMark(item, index)}
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex flex-col gap-1">
                              <p className={`font-semibold leading-normal break-words min-w-0 max-w-full ${
                                item.agent === 'Onboarding Planner Agent' ? 'text-base' : 'text-sm'
                              }`}>{item.action}</p>
                              <p className="text-xs text-muted-foreground">{formatDistanceToNow(item.timestamp, { addSuffix: true })}</p>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed break-words pr-1 whitespace-pre-wrap">{item.details}</p>
                            {item.agent && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs transition-all duration-300 w-fit ${
                                  item.status === 'in-progress' ? 'animate-pulse bg-blue-50 border-blue-200' : ''
                                }`}
                              >
                                {item.agent}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Processing/Thinking indicator - appears AFTER completed activities */}
                      {isProcessing && (
                        <div className="flex items-start gap-3 animate-pulse">
                          <div className="w-8 flex justify-center flex-shrink-0">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-blue-600 font-medium break-words leading-normal">{processingMessage}</p>
                            <div className="flex gap-1 mt-1">
                              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Currently streaming activity - appears AFTER completed activities */}
                      {streamingActivity && (
                        <div 
                          className="flex items-start gap-3"
                          data-activity-index={currentStreamingIndex}
                          id="current-streaming"
                        >
                          <div className="w-8 flex justify-center flex-shrink-0">
                            {getActivityTickMark(
                              {
                                ...streamingActivity,
                                timestamp: new Date(),
                                status: 'in-progress'
                              },
                              currentStreamingIndex
                            )}
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex flex-col gap-1">
                              <p className={`font-semibold leading-normal break-words min-w-0 max-w-full ${
                                streamingActivity.agent === 'Onboarding Planner Agent' ? 'text-base' : 'text-sm'
                              }`}>
                                {streamingActivity.streamedAction}
                                {!streamingActivity.isActionComplete && (
                                  <span className="animate-pulse text-blue-500">|</span>
                                )}
                              </p>
                              {streamingActivity.isActionComplete && (
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(), { addSuffix: true })}
                                </p>
                              )}
                            </div>
                            {streamingActivity.isActionComplete && (
                              <p className="text-xs text-muted-foreground leading-relaxed break-words pr-1 whitespace-pre-wrap">
                                {streamingActivity.streamedDetails}
                                {!streamingActivity.isDetailsComplete && (
                                  <span className="animate-pulse text-blue-500">|</span>
                                )}
                              </p>
                            )}
                            {streamingActivity.isDetailsComplete && (
                              <Badge 
                                variant="outline" 
                                className="text-xs transition-all duration-300 w-fit animate-pulse bg-blue-50 border-blue-200"
                              >
                                {streamingActivity.agent}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
      
      {/* Email Popup Dialog */}
      <Dialog open={showEmailPopup} onOpenChange={setShowEmailPopup}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Welcome Email - Alex Morgan
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm leading-relaxed">
              <p><strong>To:</strong> alex.morgan@email.com</p>
              <p><strong>From:</strong> diane.prince@corespectrum.com</p>
              <p><strong>Subject:</strong> Welcome to CoreSpectrum - Next Steps for Your Onboarding</p>
              <hr className="my-3" />
              <div className="whitespace-pre-line">
{`Hi Alex,

Welcome to the CoreSpectrum family! We're excited to have you join us as `}<strong>Senior Software Engineer.</strong>{`

Preboarding (action needed):
Please submit the following within 3 business days by logging into our Candidate Portal <we shall embed the link here of the other Application>:

• Identity proof
• Address proof  
• Educational certificates
• Proof of previous employment(s)

`}<strong>What happens next:</strong>{`

`}<strong>Background Verification (BGC):</strong>{` After we receive your documents, our HR team will run standard checks across identity, address, education, and employment history.

`}<strong>Systems & assets:</strong>{` We'll set up your corporate email and HRMS access and arrange your IT assets.

`}<strong>Day1 details:</strong>{` You'll receive your orientation agenda and joining instructions closer to your start date.

If you have any questions or need support while uploading, just reply to this email—we're here to help.

Welcome aboard!

Warm regards,

Diane Prince
Onboarding Specialist

`}<strong>CoreSpectrum Inc.</strong>{`
`}<strong>1234 Innovation Drive</strong>{`
`}<strong>Suite 500</strong>{`
`}<strong>San Francisco, CA 94105</strong>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
