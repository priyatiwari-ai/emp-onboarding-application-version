// Core data types for the onboarding application

export interface OnboardingCase {
  id: string
  employeeId: string
  employeeName: string
  department: string
  role: string
  stage: OnboardingStage
  progressPercent: number
  status: CaseStatus
  dueNext: string
  dueDate: string
  exceptionCount: number
  exceptions: Exception[]
  createdDate: string
  manager: string
}

export interface Task {
  id: string
  caseId: string
  title: string
  stage: OnboardingStage
  dueDate: string
  status: TaskStatus
  priority: Priority
  assignedAgent: AgentType
  description?: string
}

export interface Exception {
  id: string
  caseId: string
  type: ExceptionType
  description: string
  createdOn: string
  status: ExceptionStatus
  severity: 'high' | 'medium' | 'low'
}

export interface BGVStatus {
  caseId: string
  state: 'Pending' | 'InProgress' | 'Clear' | 'Flagged'
  vendor: string
  lastUpdated: string
}

export interface ComplianceItem {
  caseId: string
  policy: string
  acknowledged: boolean
  acknowledgedDate?: string
  mandatory: boolean
}

export interface AgentActivity {
  id: string
  caseId: string
  agent: AgentType
  action: string
  timestamp: string
  status: 'success' | 'pending' | 'failed'
  details?: string
}

export interface SurveyResponse {
  id: string
  caseId: string
  employeeName: string
  department: string
  overallSatisfaction: number // 1-5 scale
  enps: number // -100 to +100
  excitementToJoin: number
  feelingOfBelonging: number
  clarityOfObjectives: number
  managerSupport: number
  cultureWord: string
  openFeedback: string
  completedDate: string
  stage: OnboardingStage
}

// Enums
export type OnboardingStage = 'Not Started' | 'Documents Pending' | 'Pulling BGC Reports' | 'Onboarding to be initiated' | 'Preboarding' | 'BGC Pending' | 'Day 1' | 'Week 1' | 'Day 30' | 'Day 90'

export type CaseStatus = 'NotStarted' | 'InProgress' | 'Completed' | 'Blocked' | 'At Risk' | 'Onboarding to be initiated' | 'Pending'

export type TaskStatus = 'NotStarted' | 'InProgress' | 'Completed' | 'Blocked'

export type Priority = 'High' | 'Medium' | 'Low'

export type ExceptionType = 'Document Mismatch' | 'Identity Expired' | 'BGV Red Flag' | 'Compliance Pending' | 'IT Access Delayed' | 'Asset Allocation Pending'

export type ExceptionStatus = 'Open' | 'In Review' | 'Resolved' | 'Escalated'

export type AgentType = 
  | 'ONBOARDING_PLANNER'
  | 'DATA_COLLECTION_VALIDATION'
  | 'BGC_VENDOR_COORDINATION'
  | 'COMPLIANCE_POLICY'
  | 'HR_PAYROLL_SETUP'
  | 'IT_ACCESS'
  | 'TRAINING_ONBOARDING'
  | 'ENGAGEMENT_FEEDBACK'
  | 'HUMAN_IN_THE_LOOP'

export type Department = 'Manufacturing Ops' | 'Quality & Safety' | 'IT & Automation' | 'Finance & Procurement' | 'HR'

// Journey Step Definition
export interface JourneyStep {
  id: string
  title: string
  agent: AgentType
  description: string
  status: TaskStatus
  estimatedDuration: string
  dependencies?: string[]
  actions: string[]
}

// Dashboard Metrics
export interface DashboardMetrics {
  activeJourneys: number
  completedJourneys: number
  dueToday: number
  overdue: number
  stuck: number
  bgvPending: number
  compliancePending: number
  totalExceptions: number
}

export interface StageDistribution {
  stage: OnboardingStage
  count: number
  percentage: number
}

export interface DepartmentMetrics {
  department: Department
  active: number
  completed: number
  atRisk: number
  averageDays: number
}

// Survey Dashboard Metrics
export interface SurveyMetrics {
  overallSatisfaction: number
  enps: number
  trainingCompletionRate: number
  assetTimeliness: number
  policyAckRate: number
  turnoverRate: number
  responseRate: number
}

export interface EngagementFunnel {
  offer: { count: number; conversionRate: number }
  preboarding: { count: number; conversionRate: number }
  day1: { count: number; conversionRate: number }
  week1: { count: number; conversionRate: number }
  day30: { count: number; conversionRate: number }
  day90: { count: number; conversionRate: number }
}

// Filter Types
export interface DashboardFilters {
  stage?: OnboardingStage[]
  status?: CaseStatus[]
  department?: Department[]
  dateRange?: {
    start: string
    end: string
  }
  exceptionType?: ExceptionType[]
  manager?: string[]
}

// Notification Types
export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionable?: boolean
  caseId?: string
}

// User Types
export interface User {
  email: string
  name: string
  role: 'onboarding_specialist' | 'hr_admin'
  department: Department
  permissions: string[]
}