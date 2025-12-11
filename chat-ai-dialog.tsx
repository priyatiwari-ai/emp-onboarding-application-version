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
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  .streaming-text {
    overflow: hidden;
    white-space: nowrap;
    animation: typewriter 2s steps(30, end);
  }
  
  .streaming-cursor::after {
    content: '|';
    animation: blink 1s infinite;
    color: #3b82f6;
    font-weight: bold;
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
  const [welcomeStreamingMessage, setWelcomeStreamingMessage] = useState<string>('')
  const [isMessageStreaming, setIsMessageStreaming] = useState<boolean>(false)
  const [currentTypingMessageId, setCurrentTypingMessageId] = useState<string | null>(null)
  const [isAutonomous, setIsAutonomous] = useState(false)
  const [isExecutingPlan, setIsExecutingPlan] = useState(false)
  const [exceptionScenario, setExceptionScenario] = useState<1 | 2 | 3 | null>(null)
  const [jordanScenario, setJordanScenario] = useState<boolean>(false)
  const [jordanBGCReportShown, setJordanBGCReportShown] = useState<boolean>(false)
  const [jordanActivityStarted, setJordanActivityStarted] = useState<boolean>(false)
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
      // Notify other parts of the app (journey page) in same-tab flows
      try { window.dispatchEvent(new Event('alexMorganUpdate')) } catch (e) { /* noop */ }
      // NOTE: Automatic progression from the email popup to the BGC workflow
      // was removed to prevent surprising auto-close/auto-open behavior.
      // Progress to File Upload Pending is set above; further workflow
      // progression requires explicit user action in the chat.
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
      setJordanBGCReportShown(false)
      setJordanActivityStarted(false)
      setIsProcessing(false)
      setProcessingMessage("")
      setStreamingActivity(null)
      setCurrentStreamingIndex(-1)
      setEmailTimer(0)
      setIsTimerRunning(false)
      setShowEmailPopup(false)
      setShowViewMailButton(false)
      setAlexMorganWorkflowStarted(false)
      setWelcomeStreamingMessage('')
      setIsMessageStreaming(false)
      setCurrentTypingMessageId(null)
      
      // Note: We don't clear sessionStorage here as it should persist across dialog opens
      // Only clear on actual logout/login when hasCompletedInteraction is reset
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
    
    // Check if user has completed a meaningful interaction in this session
    const hasCompletedInteraction = sessionStorage.getItem('hasCompletedInteraction')
    const isFirstInteractionInSession = !hasCompletedInteraction
    
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

      // Previously we auto-started the Alex BGC activity stream here when a stored
      // flag was present; that produced unexpected automatic activity traces and
      // auto-opened chats. To avoid surprising the user we no longer auto-start
      // the activity stream — instead the user must explicitly request BGC
      // analysis or the app can trigger it via a deliberate action.
      console.log('Alex Morgan BGC ready flag detected; auto-start suppressed to avoid unsolicited activity traces')
    }
    // Show candidate list ONLY for first interaction AND Alex Morgan scenario
    else if (candidateName === 'Alex Morgan' && isFirstInteractionInSession) {
      const welcomeText = `Hi, 👋

I am here to assist you with your onboarding journeys.

Here are 5 candidates for whom onboarding needs to be initiated as their joining date is in next 7 days:

🔸 **Sarah Wilson** - Engineering Lead (Joins Jan 16)
🔸 **Michael Chen** - Product Designer (Joins Dec 17)  
🔸 **Emma Davis** - Data Analyst (Joins Dec 18)
🔸 **James Rodriguez** - DevOps Engineer (Joins Dec 19)
🔸 **Alex Morgan** - Senior Software Engineer (Joins Dec 16)

Please confirm if I can start onboarding process for these candidates.`

      welcomeMessage = {
        id: `msg-${Date.now()}`,
        type: 'ai',
        content: '', // Start with empty content for streaming
        timestamp: new Date(),
        isSystemMessage: false
      }
      
      // Initialize with empty message and start streaming
      setMessages([welcomeMessage])
      
      // Start streaming the welcome text character by character
      setTimeout(() => {
        streamWelcomeMessage(welcomeText, welcomeMessage.id)
      }, 500)
      
      // Don't process further as we're handling the message specially
      return
    } else {
      // Show basic intro for all other cases (subsequent interactions or other candidates)
      const basicIntroText = `Hi, 👋

I am here to assist you with your onboarding journeys.`
      
      welcomeMessage = {
        id: `msg-${Date.now()}`,
        type: 'ai',
        content: '', // Start with empty content for streaming
        timestamp: new Date(),
        isSystemMessage: false
      }
      
      // Initialize with empty message and start streaming
      setMessages([welcomeMessage])
      
      // Start streaming the basic intro
      setTimeout(() => {
        streamWelcomeMessage(basicIntroText, welcomeMessage.id)
      }, 500)
      
      return
    }
    
    // Only initialize activity trace for Alex Morgan BGC scenario
    if (candidateName === 'Alex Morgan' && alexBGCReady === 'true') {
      initializeActivityTrace()
      initializePlanning()
    }

    // Only start streaming for Alex Morgan BGC scenario if this is NOT the first interaction in session
    if (candidateName === 'Alex Morgan' && alexBGCReady === 'true' && !isFirstInteractionInSession) {
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
    } else if (candidateName === 'Alex Morgan' && alexBGCReady === 'true' && isFirstInteractionInSession) {
      // Defer automatic streaming; we initialized planning and trace but will wait for explicit user action
      console.log('Deferring Alex Morgan activity stream until user initiates an action')
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
    // Always start with empty trace - activities will be populated by user interactions only
    setActivityTrace([])
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
    if (inputValue.trim() === "") return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const userInput = userMessage.content.toLowerCase();
      
      // SIMPLE LOGIC: If user asks for recommendations, immediately start Jordan activity trace
      const isRecommendationRequest = (
        userInput.includes('recommend') ||
        userInput.includes('next step') ||
        userInput.includes('analyze') ||
        userInput.includes('what should') ||
        userInput.includes('suggestion') ||
        userInput.includes('advice') ||
        userInput.includes('proceed') ||
        userInput.includes('action') ||
        userInput.includes('decision') ||
        userInput.includes('approve') ||
        userInput.includes('deny') ||
        userInput.includes('risk') ||
        userInput.includes('evaluate') ||
        userInput.includes('assessment') ||
        userInput.includes('guidance') ||
        userInput.includes('help') ||
        userInput.includes('what now') ||
        userInput.includes('next move') ||
        userInput.includes('best approach')
      );
      
      // Handle Jordan approval responses
      if (jordanActivityStarted && (userInput.includes('yes') || userInput.includes('approve') || userInput.includes('go ahead'))) {
        const approvalMessage = `Thanks! ✅ BGC exception approved successfully.

**Next steps triggered automatically:**
• Employee ID creation initiated
• Payroll system setup in progress
• IT asset allocation workflow started
• Security access provisioning scheduled

All systems are now processing Jordan Smith's onboarding. You'll receive updates as each step completes.`
        
        const aiMessageId = `msg-${Date.now()}-jordan-approval`
        const approvalResponse: ChatMessage = {
          id: aiMessageId,
          type: 'ai',
          content: '',
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, approvalResponse])
        typeMessage(approvalMessage, aiMessageId)
        setIsTyping(false)
        return
      }
      
      // Trigger Jordan activity trace immediately for any recommendation request
      if (isRecommendationRequest && !jordanActivityStarted) {
        console.log('🚀 TRIGGERING JORDAN ACTIVITY TRACE - Recommendation request detected!');
        console.log('📋 User input:', userInput);
        setJordanActivityStarted(true);
        setIsTyping(false);
        startJordanBGCActivityStream();
        return; // Exit early
      }

      // Prevent other activity streams if Jordan activity is already running
      if (jordanActivityStarted) {
        const aiResponse = generateAIResponse(userMessage.content);
        if (aiResponse.message) {
          const aiMessageId = `msg-${Date.now()}-ai`;
          const aiMessage: ChatMessage = {
            id: aiMessageId,
            type: 'ai',
            content: '', // Start with empty content for streaming
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          typeMessage(aiResponse.message, aiMessageId);
        }
        setIsTyping(false);
        return;
      }

      // For all other cases, generate a response
      const aiResponse = generateAIResponse(userMessage.content);
      if (aiResponse.message) {
        const aiMessageId = `msg-${Date.now()}-ai`;
        const aiMessage: ChatMessage = {
          id: aiMessageId,
          type: 'ai',
          content: '', // Start with empty content for streaming
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        typeMessage(aiResponse.message, aiMessageId);
      }
      setIsTyping(false);

      // Update activity trace based on the interaction
      if (aiResponse.activities) {
        setActivityTrace(prev => [...prev, ...aiResponse.activities!]);
      }

      // Jordan BGC Report - Show report immediately after "I'll pull the BGC report" message
      if (userMessage.content.toLowerCase().includes('jordan') && 
          (userMessage.content.toLowerCase().includes('pull') || userMessage.content.toLowerCase().includes('bgc') || userMessage.content.toLowerCase().includes('background'))) {
        console.log('Jordan BGC request - showing report after initial response');
        setTimeout(() => showJordanBGCReport(), 3000); // Show report after initial message
      }

      // Special streaming for Alex Morgan - only when user explicitly mentions Alex AND onboarding/initiate
      if (candidateName === 'Alex Morgan' && userMessage.content.toLowerCase().includes('alex') && 
          (userMessage.content.toLowerCase().includes('initiate') || userMessage.content.toLowerCase().includes('start') || userMessage.content.toLowerCase().includes('onboard'))) {
        if (exceptionScenario === 1) {
          setTimeout(() => startAlexMorganActivityStream(), 2000);
        } else if (exceptionScenario === 2) {
          setTimeout(() => startBGCExceptionActivityStream(), 2000);
        }
      }
      
      // Special streaming for Alex Morgan BGC scenario - only when explicitly requested
      if (userMessage.content.toLowerCase().includes('alex') && userMessage.content.toLowerCase().includes('morgan') && 
          (userMessage.content.toLowerCase().includes('bgc') || userMessage.content.toLowerCase().includes('background') || userMessage.content.toLowerCase().includes('pull'))) {
        setTimeout(() => startAlexMorganBGCActivityStream(), 2000);
      }
    }, 1500);
  };

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
        details: "Pulling Alex's data from Applicant Tracking System, Analyzing Alex Morgan's role specification and work location\n\nDetermining documentation requirements, BGC checks required for role.",
        agent: "Data Query Agent",
        ticketId: "QRY-AM-2024-001"
      },
      {
        action: "🧠 Understanding immediate actions",
        status: "completed" as const,
        details: "Identifying critical dependencies for December 16th start date, prioritizing task sequence, creating onboarding steps and defining timeline.",
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
            
            // Mark that user has completed their first meaningful interaction
            sessionStorage.setItem('hasCompletedInteraction', 'true')
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

  const showJordanBGCReport = () => {
    console.log('showJordanBGCReport function called')
    setJordanBGCReportShown(true) // Mark that Jordan's BGC report was shown
    // Show BGC report without starting activity trace
    const messageContent = `Here's an update on the onboarding journey Candidate Jordan Smith.
Jordan has successfully uploaded the required documents, and we've received the Background Check (BGC) report from our verification partner.

📋 **Background Check Report**

**Candidate Name:** Jordan Smith  
**Address:** 12, Ballwin Road, MO 60131  
**Report Date:** ${new Date().toLocaleDateString()}  
**Prepared By:** VerifyTech Solutions  

📊 **Summary of Verification**

**Education:** Degree Certificate: ❌ Could not be verified – The College of St. Rose could not be contacted

**Proof of Identity:** Passport: ✅ Verified

**Employment Verification:** ✅ Completed

**Proof of Address:** Utility Bill: ✅ Verified

📝 **BGC Check Notes:**

**Issue Identified:** Degree certificate verification incomplete due to inability to contact The College of St. Rose.

**Risk Assessment:** Low to moderate risk – All other identity and employment checks are verified.

💡 *Ask me to analyze or recommend next steps for Jordan's onboarding process.*`

    const aiMessageId = `msg-${Date.now()}-jordan-report`
    const reportMessage: ChatMessage = {
      id: aiMessageId,
      type: 'ai',
      content: '', // Start with empty content for streaming
      timestamp: new Date(),
      isSystemMessage: false
    }
    
    console.log('Adding Jordan BGC report message to chat')
    setMessages(prev => [...prev, reportMessage])
    
    // Start character-by-character streaming
    typeMessage(messageContent, aiMessageId)
  }

  const startJordanBGCActivityStream = () => {
    // Clear existing activity trace first
    setActivityTrace([])
    setIsProcessing(false)
    setStreamingActivity(null)
    
    // If Jordan BGC report wasn't shown yet, show it first
    if (!jordanBGCReportShown) {
      const reportContent = `Here's an update on the onboarding journey for Candidate Jordan Smith.
Jordan has successfully uploaded the required documents, and we've received the Background Check (BGC) report from our verification partner.

📋 **Background Check Report**

**Candidate Name:** Jordan Smith  
**Address:** 12, Ballwin Road, MO 60131  
**Report Date:** ${new Date().toLocaleDateString()}  
**Prepared By:** VerifyTech Solutions  

📊 **Summary of Verification**

**Education:** Degree Certificate: ❌ Could not be verified – The College of St. Rose could not be contacted

**Proof of Identity:** Passport: ✅ Verified

**Employment Verification:** ✅ Completed

**Proof of Address:** Utility Bill: ✅ Verified

📝 **BGC Check Notes:**

**Issue Identified:** Degree certificate verification incomplete due to inability to contact The College of St. Rose.

**Risk Assessment:** Low to moderate risk – All other identity and employment checks are verified.

Let me analyze this further and provide recommendations...`

      const aiMessageId = `msg-${Date.now()}-jordan-report`
      const reportMessage: ChatMessage = {
        id: aiMessageId,
        type: 'ai',
        content: '', // Start with empty content for streaming
        timestamp: new Date(),
        isSystemMessage: false
      }
      
      setJordanBGCReportShown(true)
      setMessages(prev => [...prev, reportMessage])
      
      // Start character-by-character streaming
      typeMessage(reportContent, aiMessageId)
      
      // Start activity trace after report is shown
      setTimeout(() => startJordanActivityTrace(), 3000)
    } else {
      // BGC report already shown, just start activity trace
      startJordanActivityTrace()
    }
  }
  
  const startJordanActivityTrace = () => {
    const currentTime = Date.now()
    
    const jordanBGCUpdates = [
      {
        action: "AI Orchestrator invoking BGC adjudication Agent",
        status: "completed" as const,
        details: "",
        agent: "AI Orchestrator",
        ticketId: "AI-ORK-JO-2024-000"
      },
      {
        action: "Analyzing the BGC report for Jordan Smith…",
        status: "completed" as const,
        details: "Source: Background Check Report – [BGC Vendor]\n\nSummarizing checks and identifying education verification gap.\nIdentity ✅ | Address ✅ | Employment ✅ | Education ❌",
        agent: "BGC Analysis Agent",
        ticketId: "BGC-ANA-2024-001"
      },
      {
        action: "Invoking Data Search Agent: Searching for information about The College of Saint Rose…",
        status: "completed" as const,
        details: "Source: Accreditation registry, state education portal\n\nFound credible sources: last semester Spring 2024; declining enrollment noted.\nReasoning: Institution closure explains contact failure.",
        agent: "Data Search Agent",
        ticketId: "DAT-SRC-2024-002"
      },
      {
        action: "Consulting Compliance Agent: Checking state guidance…",
        status: "completed" as const,
        details: "Source: NY State Higher Education Board\nResult: Teach-out and transcript services handled via SUNY Albany.",
        agent: "Compliance Agent",
        ticketId: "COM-CHK-2024-003"
      },
      {
        action: "Cross-verifying Accreditation Agent:",
        status: "completed" as const,
        details: "Accreditation valid through 2019; no fraud indicators detected.",
        agent: "Accreditation Agent",
        ticketId: "ACC-VER-2024-004"
      },
      {
        action: "Synthesizing evidence…",
        status: "completed" as const,
        details: "Risk: Low | Compliance: Exception path available.",
        agent: "Accreditation Agent",
        ticketId: "ACC-VER-2024-005"
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
        // Jordan BGC activity trace completed, show final recommendation
        setCurrentStreamingIndex(-1)
        setIsProcessing(false)
        setStreamingActivity(null)
        
        setTimeout(() => {
          const messageContent = `**Recommendation:**
Approve onboarding with exception or request notarized transcript from SUNY Albany

**Risk of Denying**

Delaying approval may impact onboarding for a business-critical role.

**Next Actions Available:**
• Approve with educational exception
• Request alternative verification via SUNY Albany
• Escalate to compliance team for review

---

**Do you want to approve this exception?**`

          const aiMessageId = `msg-${Date.now()}-jordan-recommendation`
          const completionMessage: ChatMessage = {
            id: aiMessageId,
            type: 'ai',
            content: '', // Start with empty content for streaming
            timestamp: new Date(),
            isSystemMessage: false
          }
          
          setMessages(prev => [...prev, completionMessage])
          
          // Start character-by-character streaming
          typeMessage(messageContent, aiMessageId)
          
          // Set flag in localStorage when Jordan BGC is completed
          localStorage.setItem('jordanBGCCompleted', 'true')
          
          // Set specific Jordan BGC completion flag for dashboard monitoring
          sessionStorage.setItem('jordanBGCCompleted', 'true')
          
          // Mark that user has completed their first meaningful interaction
          sessionStorage.setItem('hasCompletedInteraction', 'true')
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
        
        // Mark that user has completed their first meaningful interaction
        sessionStorage.setItem('hasCompletedInteraction', 'true')
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
        setStreamingMessage(message.substring(0, index + 1))
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
        
        // Variable speed typing - similar to activity trace
        let delay = 30 // Base speed similar to activity trace details
        if (message[index - 1] === ' ') delay = 15 // Faster for spaces
        if (['.', '!', '?'].includes(message[index - 1])) delay = 200 // Longer pause for sentence endings
        if ([',', ';', ':'].includes(message[index - 1])) delay = 100 // Medium pause for other punctuation
        if (message[index - 1] === '\n') delay = 100 // Pause for line breaks
        
        const timeout = setTimeout(typeNextChar, delay)
        streamTimeoutsRef.current.push(timeout)
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
    
    const initialTimeout = setTimeout(typeNextChar, 300)
    streamTimeoutsRef.current.push(initialTimeout)
  }

  const streamWelcomeMessage = (message: string, messageId: string) => {
    setIsMessageStreaming(true)
    setWelcomeStreamingMessage('')
    setCurrentTypingMessageId(messageId)
    
    let index = 0
    const streamNextChar = () => {
      if (index < message.length) {
        setWelcomeStreamingMessage(message.substring(0, index + 1))
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
        
        // Stream at 40ms per character like activity trace
        const timeout = setTimeout(streamNextChar, 40)
        streamTimeoutsRef.current.push(timeout)
      } else {
        // Streaming complete, update the actual message
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, content: message } : msg
        ))
        setIsMessageStreaming(false)
        setCurrentTypingMessageId(null)
        setWelcomeStreamingMessage('')
      }
    }
    
    const initialTimeout = setTimeout(streamNextChar, 100)
    streamTimeoutsRef.current.push(initialTimeout)
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
    
    // Handle bold text (**text**) including employee names
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove the ** markers and make text bold
        const boldText = part.slice(2, -2)
        return <strong key={index}>{boldText}</strong>
      }
      return part
    })
  }

  const generateAIResponse = (userInput: string): { message: string, activities?: ActivityTraceItem[] } => {
    const input = userInput.toLowerCase()
    
    console.log(`🔍 Input: "${input}", Candidate: "${candidateName}"`)

    // NOTE: The primary "Jordan recommend" check is now in handleSendMessage.
    // This function handles standard responses.

    if (input.includes('start') || input.includes('initiate') || input.includes('begin')) {
      setTimeout(() => {
        sessionStorage.setItem('hasCompletedInteraction', 'true')
      }, 2000)
      
      // Don't return activities for Alex Morgan when specific streaming will handle it
      const willTriggerAlexStream = candidateName === 'Alex Morgan' && input.includes('alex') && 
          (input.includes('initiate') || input.includes('start') || input.includes('onboard'))
      
      return {
        message: `Perfect! I'll start the onboarding process for ${candidateName}.`,
        activities: willTriggerAlexStream ? [] : [
          {
            id: `activity-${Date.now()}-auto`,
            action: "Sending welcome email",
            status: "in-progress",
            timestamp: new Date(),
            details: "Automated welcome email being sent to candidate",
            agent: "Communication Agent",
            ticketId: "WEL-2024-AUTO"
          }
        ]
      }
    }

    // Alex Morgan handling
    if (candidateName === 'Alex Morgan' && exceptionScenario === 1 && input.includes('alex')) {
      return {
        message: ``,
        activities: []
      }
    }

    if (candidateName === 'Alex Morgan' && exceptionScenario === 2 && (input.includes('yes') || input.includes('approve') || input.includes('accept'))) {
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

    if ((input.includes('bgc') || input.includes('background') || input.includes('check')) && 
        (input.includes('jordan') || input.includes('alex') || input.includes('show') || input.includes('review'))) {
      return {
        message: `I'll pull the BGC report details for you.`,
        activities: []
      }
    }

    if (input.includes('yes') || input.includes('approve') || input.includes('proceed')) {
      return {
        message: `Thank you! ${isAutonomous ? 'Autonomously proceeding' : 'I\'m proceeding'} with the next steps. Launching AI agents for ID creation, payroll setup, and asset allocation processes. I'll keep you updated on the progress.`,
        activities: []
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
        activities: []
      }
    }

    if (input.includes('autonomous') || input.includes('assist')) {
      const mode = input.includes('autonomous') ? 'autonomous' : 'assist'
      setIsAutonomous(mode === 'autonomous')
      return {
        message: `Switching to ${mode.toUpperCase()} mode. ${mode === 'autonomous' ? 'I will now take independent actions and provide updates.' : 'I will now wait for your guidance before taking actions.'}`
      }
    }

    if (input.includes('alex') && input.includes('morgan') && (input.includes('bgc') || input.includes('background') || input.includes('pull'))) {
      return {
        message: ``,
        activities: []
      }
    }

    // Default response
    return {
      message: `I'm here to help you with onboarding tasks! You can ask me to:

• **Start onboarding** for any candidate
• **Review BGC reports** for specific candidates  
• **Check status** of ongoing processes
• **Generate reports** or documentation

${isAutonomous ? 'In autonomous mode, I can take actions automatically.' : 'In assist mode, I\'ll work with your guidance.'}

What would you like me to help you with today?`
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
                  <div className="flex items-center gap-2">
                    /* Lines 2132-2134 omitted */
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
      
      <DialogContent showCloseButton={false} className="sm:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Bot className="w-7 h-7 text-primary" />
                <span>AI Onboarding Assistant:</span>
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
                  {/* Assist Mode badge and Toggle Mode button removed per request */}
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
                              {msg.type === 'ai' && isMessageStreaming && msg.id === currentTypingMessageId ? 
                                <>
                                  <span>{welcomeStreamingMessage || streamingMessage}</span>
                                  <span className="animate-pulse text-blue-500 font-bold">|</span>
                                </> : 
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
                          <span>Agent is thinking...</span>
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
Please submit the following within 3 business days by logging into our Candidate Portal `}
<a href="https://ecbohroaiapps.edemoapps.com/HRO_Employee_Onboarding/#/login" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://ecbohroaiapps.edemoapps.com/HRO_Employee_Onboarding/#/login</a>
{`:

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