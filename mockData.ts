import { 
  OnboardingCase, 
  Task, 
  Exception, 
  BGVStatus, 
  ComplianceItem, 
  AgentActivity,
  SurveyResponse,
  DashboardMetrics,
  StageDistribution,
  DepartmentMetrics,
  SurveyMetrics,
  EngagementFunnel,
  JourneyStep,
  Notification,
  OnboardingStage,
  Department,
  AgentType
} from './types'

// US Names Pool
export const US_NAMES = [
  'Alex Morgan', 'Jordan Lee', 'Taylor Smith', 'Casey Johnson', 'Morgan Davis',
  'Riley Parker', 'Jamie Brooks', 'Avery Collins', 'Dylan Carter', 'Harper Reed',
  'Cameron White', 'Skylar Brown', 'Sage Wilson', 'Blake Martinez', 'Drew Anderson',
  'Emery Thompson', 'Quinn Garcia', 'River Rodriguez', 'Reese Lewis', 'Dakota Clark',
  'Peyton Hall', 'Rowan Allen', 'Phoenix Wright', 'Hayden Young', 'Finley King',
  'Parker Scott', 'Emerson Green', 'Remy Adams', 'Charlie Baker', 'Indigo Nelson'
]


export const DEPARTMENTS: Department[] = [
  'Manufacturing Ops',
  'Quality & Safety', 
  'IT & Automation',
  'Finance & Procurement',
  'HR'
]

export const ROLES = [
  'Programmer', 'Quality Inspector', 'Software Developer', 'Financial Analyst', 'HR Specialist',
  'Manufacturing Supervisor', 'Safety Coordinator', 'DevOps Engineer', 'Procurement Specialist', 'Recruiter',
  'Production Operator', 'QA Engineer', 'Data Analyst', 'Accountant', 'Training Coordinator',
  'Maintenance Technician', 'Compliance Officer', 'Network Engineer', 'Buyer', 'Employee Relations Specialist'
]

// Journey Steps Definition
export const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 'step1',
    title: 'Onboarding Planning',
    agent: 'ONBOARDING_PLANNER',
    description: 'Pull new hire data, plan document requirements, plan background check requirements, plan IT & asset allocation, generate & trigger onboarding workflow',
    status: 'Completed',
    estimatedDuration: '1 day',
    actions: [
      'Pull new hire data for onboarding',
      'Plan document requirements',
      'Plan background check requirements',
      'Plan IT & asset allocation',
      'Generate & trigger onboarding workflow'
    ]
  },
  {
    id: 'step2',
    title: 'Data Collection & Validation',
    agent: 'DATA_COLLECTION_VALIDATION',
    description: 'Document upload by candidate, document verification, flag document discrepancies',
    status: 'InProgress',
    estimatedDuration: '2-3 days',
    dependencies: ['step1'],
    actions: [
      'Document upload (by candidate)',
      'Document verification (by agent)',
      'Flag document discrepancies (exceptions)'
    ]
  },
  {
    id: 'step3',
    title: 'Background Check (BGC) Coordination',
    agent: 'BGC_VENDOR_COORDINATION',
    description: 'Submit BGC request to vendor, receive BGC status updates, adjudicate BGC results',
    status: 'InProgress',
    estimatedDuration: '5-7 days',
    dependencies: ['step2'],
    actions: [
      'Submit BGC request to vendor',
      'Receive BGC status updates',
      'Adjudicate BGC results (Clear / Flagged)'
    ]
  },
  {
    id: 'step4',
    title: 'Compliance & Policy',
    agent: 'COMPLIANCE_POLICY',
    description: 'Share mandatory company policies, digital signature/acknowledgment',
    status: 'NotStarted',
    estimatedDuration: '1-2 days',
    dependencies: ['step1'],
    actions: [
      'Share mandatory company policies (NDA, Code of Conduct, etc.)',
      'Digital signature/acknowledgment'
    ]
  },
  {
    id: 'step5',
    title: 'HR & Payroll Setup',
    agent: 'HR_PAYROLL_SETUP',
    description: 'Set up new hire data in HRMS/payroll, create employee record',
    status: 'NotStarted',
    estimatedDuration: '1-2 days',
    dependencies: ['step3', 'step4'],
    actions: [
      'Set up new hire data in HRMS/payroll',
      'Create employee record'
    ]
  },
  {
    id: 'step6',
    title: 'IT Access & Asset Allocation',
    agent: 'IT_ACCESS',
    description: 'Allocate ID, desk, and other assets, set up email & IT application access, set up Active Directory access',
    status: 'NotStarted',
    estimatedDuration: '1-2 days',
    dependencies: ['step5'],
    actions: [
      'Allocate ID, desk, and other assets',
      'Set up email & IT application access',
      'Set up Active Directory access'
    ]
  },
  {
    id: 'step7',
    title: 'Training & Onboarding',
    agent: 'TRAINING_ONBOARDING',
    description: 'Mandatory training enrollment, role-based learning path selection, buddy/mentor assignment',
    status: 'NotStarted',
    estimatedDuration: 'Ongoing',
    dependencies: ['step6'],
    actions: [
      'Mandatory training enrollment',
      'Role-based learning path selection',
      'Buddy/mentor assignment'
    ]
  },
  {
    id: 'step8',
    title: 'Engagement & Feedback',
    agent: 'ENGAGEMENT_FEEDBACK',
    description: 'Generate survey for engagement experience, welcome messages and FAQ bot',
    status: 'NotStarted',
    estimatedDuration: 'Ongoing',
    dependencies: ['step7'],
    actions: [
      'Generate survey for engagement experience',
      'Welcome messages and FAQ bot'
    ]
  },
  // Removed 'Agentic AI Intervention & Human-in-the-Loop' step per request
]

// Mock Data Generation Functions
export const generateOnboardingCases = (): OnboardingCase[] => {
  const cases: OnboardingCase[] = []
  const stages: OnboardingStage[] = ['Preboarding', 'Day 1', 'Week 1', 'Day 30', 'Day 90']
  const statuses = ['InProgress', 'Blocked', 'Completed', 'At Risk'] as const
  
  // Generate the specific cases from the document
  const specificCases = [
    { name: 'Alex Morgan', dept: 'IT & Automation', stage: 'Onboarding to be initiated', progress: 0, dueNext: 'Today', status: 'Pending', exceptions: 0 },
    { name: 'Jordan Lee', dept: 'Manufacturing Ops', stage: 'BGC Pending', progress: 15, dueNext: 'BGC Review', status: 'Pending', exceptions: 0 },
    { name: 'Taylor Smith', dept: 'Quality & Safety', stage: 'Day 1', progress: 22, dueNext: 'Orientation Agenda (Today)', status: 'InProgress', exceptions: 0 },
    { name: 'Casey Johnson', dept: 'Finance & Procurement', stage: 'Day 30', progress: 54, dueNext: 'Policy Acknowledgment (Tomorrow)', status: 'InProgress', exceptions: 2 },
    { name: 'Morgan Davis', dept: 'HR', stage: 'Day 90', progress: 88, dueNext: 'Final Survey (Next Week)', status: 'InProgress', exceptions: 0 },
    { name: 'Riley Parker', dept: 'Manufacturing Ops', stage: 'Week 1', progress: 61, dueNext: 'Asset Pickup (Today)', status: 'Blocked', exceptions: 1 },
    { name: 'Jamie Brooks', dept: 'IT & Automation', stage: 'Preboarding', progress: 12, dueNext: 'BGV Form (Today)', status: 'InProgress', exceptions: 0 },
    { name: 'Avery Collins', dept: 'Quality & Safety', stage: 'Day 1', progress: 19, dueNext: 'Safety Induction (Today)', status: 'InProgress', exceptions: 0 },
    { name: 'Dylan Carter', dept: 'Finance & Procurement', stage: 'Week 1', progress: 47, dueNext: 'Tax Forms (Tomorrow)', status: 'InProgress', exceptions: 1 },
    { name: 'Harper Reed', dept: 'Manufacturing Ops', stage: 'Day 30', progress: 59, dueNext: 'Compliance Training (Today)', status: 'InProgress', exceptions: 0 }
  ]

  specificCases.forEach((caseData, index) => {
    const caseId = `CS${String(index + 1).padStart(4, '0')}`

    // If we have static definitions for CS0001 or CS0002, use them to ensure deterministic data
    if (caseId === 'CS0001') {
      cases.push(STATIC_CASES.CS0001)
      return
    }

    if (caseId === 'CS0002') {
      cases.push(STATIC_CASES.CS0002)
      return
    }

    cases.push({
      id: caseId,
      employeeId: `EMP${String(index + 1).padStart(4, '0')}`,
      employeeName: caseData.name,
      department: caseData.dept as Department,
      role: ROLES[Math.floor(Math.random() * ROLES.length)],
      stage: caseData.stage as OnboardingStage,
      progressPercent: caseData.progress,
      status: caseData.status as any,
      dueNext: caseData.dueNext,
      dueDate: getDueDate(),
      exceptionCount: caseData.exceptions,
      exceptions: generateExceptions(caseId, caseData.exceptions),
      createdDate: getRandomDate(),
      manager: getRandomManager()
    })
  })

  // Generate additional random cases to reach desired counts
  const usedNames = specificCases.map(sc => sc.name) // Track already used names
  const availableNames = US_NAMES.filter(name => !usedNames.includes(name)) // Exclude used names
  
  for (let i = 10; i < 58; i++) {
    const caseId = `CS${String(i + 1).padStart(4, '0')}`
    const randomName = availableNames[Math.floor(Math.random() * availableNames.length)]
    const randomDept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)]
    const randomStage = stages[Math.floor(Math.random() * stages.length)]
    
    cases.push({
      id: caseId,
      employeeId: `EMP${String(i + 1).padStart(4, '0')}`,
      employeeName: randomName,
      department: randomDept,
      role: ROLES[Math.floor(Math.random() * ROLES.length)],
      stage: randomStage,
      progressPercent: Math.floor(Math.random() * 100),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      dueNext: getRandomTask(),
      dueDate: getDueDate(),
      exceptionCount: Math.floor(Math.random() * 3),
      exceptions: [],
      createdDate: getRandomDate(),
      manager: getRandomManager()
    })
  }

  return cases
}

const generateExceptions = (caseId: string, count: number): Exception[] => {
  const exceptionTypes = ['Document Mismatch', 'Identity Expired', 'BGV Red Flag', 'Compliance Pending'] as const
  const exceptions: Exception[] = []
  
  for (let i = 0; i < count; i++) {
    exceptions.push({
      id: `EXC${Math.random().toString(36).substr(2, 9)}`,
      caseId,
      type: exceptionTypes[Math.floor(Math.random() * exceptionTypes.length)] as any,
      description: 'Auto-generated exception for demo purposes',
      createdOn: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.5 ? 'Open' : 'In Review',
      severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
    })
  }
  
  return exceptions
}

const getDueDate = (): string => {
  const today = new Date()
  const daysOffset = Math.floor(Math.random() * 10) - 3 // -3 to +7 days from today
  const dueDate = new Date(today.getTime() + daysOffset * 24 * 60 * 60 * 1000)
  return dueDate.toISOString().split('T')[0]
}

const getRandomDate = (): string => {
  const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const end = new Date()
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return randomDate.toISOString()
}

const getRandomTask = (): string => {
  const tasks = [
    'Security Awareness Training',
    'ID Upload',
    'Orientation Agenda',
    'Policy Acknowledgment',
    'Final Survey',
    'Asset Pickup',
    'BGV Form',
    'Safety Induction',
    'Tax Forms',
    'Compliance Training',
    'Equipment Setup',
    'Badge Creation',
    'Access Card Assignment'
  ]
  return tasks[Math.floor(Math.random() * tasks.length)]
}

const getRandomManager = (): string => {
  const managers = [
    'Sarah Johnson', 'Michael Chen', 'Lisa Rodriguez', 'David Kim', 'Emily Brown',
    'James Wilson', 'Maria Garcia', 'Robert Taylor', 'Jennifer Lee', 'Christopher Davis'
  ]
  return managers[Math.floor(Math.random() * managers.length)]
}

// Dashboard Metrics
export const getDashboardMetrics = (): DashboardMetrics => ({
  activeJourneys: 58,
  completedJourneys: 142,
  dueToday: 27,
  overdue: 13,
  stuck: 9,
  bgvPending: 18,
  compliancePending: 18,
  totalExceptions: 23
})

export const getStageDistribution = (): StageDistribution[] => [
  { stage: 'Onboarding to be initiated', count: 1, percentage: 1.7 },
  { stage: 'Preboarding', count: 15, percentage: 25.0 },
  { stage: 'BGC Pending', count: 1, percentage: 1.7 },
  { stage: 'Day 1', count: 12, percentage: 20.0 },
  { stage: 'Week 1', count: 10, percentage: 16.7 },
  { stage: 'Day 30', count: 10, percentage: 16.7 },
  { stage: 'Day 90', count: 9, percentage: 15.0 }
]

export const getDepartmentMetrics = (): DepartmentMetrics[] => [
  { department: 'Manufacturing Ops', active: 20, completed: 45, atRisk: 3, averageDays: 28 },
  { department: 'Quality & Safety', active: 8, completed: 22, atRisk: 1, averageDays: 25 },
  { department: 'IT & Automation', active: 12, completed: 35, atRisk: 2, averageDays: 32 },
  { department: 'Finance & Procurement', active: 10, completed: 25, atRisk: 2, averageDays: 30 },
  { department: 'HR', active: 8, completed: 15, atRisk: 1, averageDays: 22 }
]

// Survey Data
export const generateSurveyResponses = (): SurveyResponse[] => {
  const cases = generateOnboardingCases()
  return cases.slice(0, 25).map(onboardingCase => ({
    id: `SUR${Math.random().toString(36).substr(2, 9)}`,
    caseId: onboardingCase.id,
    employeeName: onboardingCase.employeeName,
    department: onboardingCase.department,
    overallSatisfaction: Math.floor(Math.random() * 5) + 1,
    enps: Math.floor(Math.random() * 200) - 100,
    excitementToJoin: Math.floor(Math.random() * 5) + 1,
    feelingOfBelonging: Math.floor(Math.random() * 5) + 1,
    clarityOfObjectives: Math.floor(Math.random() * 5) + 1,
    managerSupport: Math.floor(Math.random() * 5) + 1,
    cultureWord: getCultureWord(),
    openFeedback: getRandomFeedback(),
    completedDate: getRandomDate(),
    stage: onboardingCase.stage
  }))
}

const getCultureWord = (): string => {
  const words = ['Innovative', 'Supportive', 'Collaborative', 'Professional', 'Dynamic', 'Inclusive', 'Challenging', 'Rewarding']
  return words[Math.floor(Math.random() * words.length)]
}

const getRandomFeedback = (): string => {
  const feedback = [
    'Great onboarding experience overall!',
    'IT access was delayed by 2 days.',
    'My manager is very supportive.',
    'Could use better onboarding materials.',
    'Buddy program was helpful.',
    'Orientation was well-organized.',
    'Would like more clarity on role expectations.'
  ]
  return feedback[Math.floor(Math.random() * feedback.length)]
}

export const getSurveyMetrics = (): SurveyMetrics => ({
  overallSatisfaction: 4.2,
  enps: 38,
  trainingCompletionRate: 92,
  assetTimeliness: 98,
  policyAckRate: 100,
  turnoverRate: 3.5,
  responseRate: 87
})

export const getEngagementFunnel = (): EngagementFunnel => ({
  offer: { count: 75, conversionRate: 92 },
  preboarding: { count: 69, conversionRate: 88 },
  day1: { count: 61, conversionRate: 95 },
  week1: { count: 58, conversionRate: 93 },
  day30: { count: 54, conversionRate: 91 },
  day90: { count: 49, conversionRate: 89 }
})

// Agent Activity
export const generateAgentActivity = (caseId: string): AgentActivity[] => {
  // Deterministic static traces for specific caseIds to ensure stable UI for drilldown
  if (caseId === 'CS0001') {
    const now = Date.now()
    const staticActs: AgentActivity[] = [
      {
        id: 'ACT-CS0001-1',
        caseId,
        agent: 'ONBOARDING_PLANNER',
        action: 'Strategic Planner AI Agent — Synthesized onboarding plan and prioritized actions',
        timestamp: new Date(now - 4 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: 'ACT-CS0001-2',
        caseId,
        agent: 'DATA_COLLECTION_VALIDATION',
        action: 'Data Query Agent — Executed cross-source retrieval and resolved identity matches',
        timestamp: new Date(now - 3 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: 'ACT-CS0001-3',
        caseId,
        agent: 'TRAINING_ONBOARDING',
        action: 'Content Generation AI Agent — Crafted role-ready content and welcome materials',
        timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: 'ACT-CS0001-4',
        caseId,
        agent: 'ENGAGEMENT_FEEDBACK',
        action: 'Communication Delivery Agent — Dispatched onboarding notifications and confirmations',
        timestamp: new Date(now - 60 * 1000).toISOString(),
        status: 'success'
      }
    ]

    return staticActs
  }

  if (caseId === 'CS0002') {
    const now = Date.now()
    const staticActs: AgentActivity[] = [
      {
        id: 'ACT-CS0002-1',
        caseId,
        agent: 'ONBOARDING_PLANNER',
        action: 'AI Orchestrator invoking BGC adjudication Agent',
        timestamp: new Date(now - 30 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: 'ACT-CS0002-2',
        caseId,
        agent: 'BGC_VENDOR_COORDINATION',
        action: 'Analyzing the BGC report for Jordan Smith',
        timestamp: new Date(now - 90 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: 'ACT-CS0002-3',
        caseId,
        agent: 'HUMAN_IN_THE_LOOP',
        action: 'Summarizing checks and identifying education verification gap',
        timestamp: new Date(now - 3 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: 'ACT-CS0002-4',
        caseId,
        agent: 'DATA_COLLECTION_VALIDATION',
        action: 'Invoking Data Search Agent: Searching for information about The College of Saint Rose',
        timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: 'ACT-CS0002-5',
        caseId,
        agent: 'DATA_COLLECTION_VALIDATION',
        action: 'Found credible sources: last semester Spring 2024; declining enrollment noted',
        timestamp: new Date(now - 8 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: 'ACT-CS0002-6',
        caseId,
        agent: 'COMPLIANCE_POLICY',
        action: 'Consulting Compliance Agent: Checking state guidance',
        timestamp: new Date(now - 12 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: 'ACT-CS0002-7',
        caseId,
        agent: 'ONBOARDING_PLANNER',
        action: 'Cross-verifying Accreditation Agent',
        timestamp: new Date(now - 16 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: 'ACT-CS0002-8',
        caseId,
        agent: 'HUMAN_IN_THE_LOOP',
        action: 'Synthesizing evidence',
        timestamp: new Date(now - 20 * 60 * 1000).toISOString(),
        status: 'success'
      }
    ]

    return staticActs
  }

  const activities: AgentActivity[] = []
  const agents: AgentType[] = ['DATA_COLLECTION_VALIDATION', 'BGC_VENDOR_COORDINATION', 'COMPLIANCE_POLICY', 'IT_ACCESS', 'TRAINING_ONBOARDING', 'ENGAGEMENT_FEEDBACK', 'HUMAN_IN_THE_LOOP']
  
  agents.forEach(agent => {
    const activityCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < activityCount; i++) {
      activities.push({
        id: `ACT${Math.random().toString(36).substr(2, 9)}`,
        caseId,
        agent,
        action: getAgentAction(agent),
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: Math.random() > 0.2 ? 'success' : 'pending'
      })
    }
  })
  
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

const getAgentAction = (agent: AgentType): string => {
  const actions: Record<AgentType, string[]> = {
    'ONBOARDING_PLANNER': ['Workflow generated', 'Requirements planned', 'Timeline created'],
    'DATA_COLLECTION_VALIDATION': ['Document upload requested', 'Document verified', 'Validation completed'],
    'BGC_VENDOR_COORDINATION': ['BGC request submitted', 'Status updated', 'Results received'],
    'COMPLIANCE_POLICY': ['NDA sent for signature', 'Policy acknowledged', 'Compliance verified'],
    'HR_PAYROLL_SETUP': ['HRMS record created', 'Payroll setup completed', 'Employee ID assigned'],
    'IT_ACCESS': ['Email setup scheduled', 'Access provisioned', 'Equipment allocated'],
    'TRAINING_ONBOARDING': ['Training assigned', 'Buddy matched', 'Learning path created'],
    'ENGAGEMENT_FEEDBACK': ['Welcome message sent', 'Survey triggered', 'Feedback collected'],
    'HUMAN_IN_THE_LOOP': ['Exception flagged', 'Manual review initiated', 'Escalation created']
  }
  
  const agentActions = actions[agent] || ['Action performed']
  return agentActions[Math.floor(Math.random() * agentActions.length)]
}

export const generateNotifications = (): Notification[] => [
  {
    id: 'not1',
    type: 'warning',
    title: '3 journeys flagged for low engagement',
    message: 'Alex Morgan, Jordan Lee, and Taylor Smith require attention',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    actionable: true
  },
  {
    id: 'not2',
    type: 'error',
    title: 'BGV verification failed',
    message: 'Casey Johnson - BGV Red Flag detected',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    read: false,
    actionable: true,
    caseId: 'CS0004'
  },
  {
    id: 'not3',
    type: 'info',
    title: 'Asset allocation completed',
    message: '5 new assets allocated successfully',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionable: false
  }
]

// Static cases: deterministic data for specific caseIds to keep journey/drilldown stable
export const STATIC_CASES: { [key: string]: OnboardingCase } = {
  CS0001: {
    id: 'CS0001',
    employeeId: 'EMP0001',
    employeeName: 'Alex Morgan',
    department: 'IT & Automation',
    role: 'Senior Software Engineer',
    stage: 'Preboarding',
    progressPercent: 5,
    status: 'Pending' as any,
    dueNext: 'Today',
    dueDate: new Date().toISOString().split('T')[0],
    exceptionCount: 0,
    exceptions: [],
    createdDate: new Date().toISOString(),
    manager: 'Sarah Johnson'
  },
  CS0002: {
    id: 'CS0002',
    employeeId: 'EMP0002',
    employeeName: 'Jordan Lee',
    department: 'Manufacturing Ops',
    role: 'Quality Inspector',
    stage: 'BGC Pending',
    progressPercent: 15,
    status: 'Pending' as any,
    dueNext: 'BGC Review',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    exceptionCount: 0,
    exceptions: [],
    createdDate: new Date().toISOString(),
    manager: 'Michael Chen'
  }
}