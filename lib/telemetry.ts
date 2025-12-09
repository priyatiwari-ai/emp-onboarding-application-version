import { AgentActivity, Notification } from './types'

export interface TelemetryEvent {
  id: string
  type: 'bgv_update' | 'compliance_toggle' | 'exception_created' | 'exception_resolved' | 'task_completed' | 'agent_action'
  description: string
  timestamp: string
  caseId: string
  employeeName: string
  agent?: string
  details?: string
}

class TelemetryService {
  private events: TelemetryEvent[] = []
  private listeners: ((events: TelemetryEvent[]) => void)[] = []
  private notificationListeners: ((notification: Notification) => void)[] = []
  private isRunning = false
  private intervalId?: NodeJS.Timeout

  private employeeNames = [
    'Alex Morgan', 'Jordan Lee', 'Taylor Smith', 'Casey Johnson', 'Morgan Davis',
    'Riley Parker', 'Jamie Brooks', 'Avery Collins', 'Dylan Carter', 'Harper Reed',
    'Cameron White', 'Skylar Brown', 'Sage Wilson', 'Blake Martinez', 'Drew Anderson'
  ]

  private eventTemplates = {
    bgv_update: [
      'BGV status updated from Pending → InProgress',
      'BGV status updated from InProgress → Clear',
      'BGV status updated from Pending → Clear',
      'BGV verification completed successfully'
    ],
    compliance_toggle: [
      'NDA acknowledgment completed',
      'Code of Conduct policy acknowledged',
      'Safety policy acknowledgment received',
      'Data privacy policy accepted'
    ],
    exception_created: [
      'Document mismatch exception created',
      'Identity verification exception raised',
      'IT access delay exception flagged',
      'Compliance pending exception created'
    ],
    exception_resolved: [
      'Document mismatch resolved',
      'Identity verification completed',
      'IT access issue resolved',
      'Compliance requirement satisfied'
    ],
    task_completed: [
      'Security awareness training completed',
      'Asset pickup completed',
      'Orientation session finished',
      'Badge creation completed',
      'Workspace assignment completed'
    ],
    agent_action: [
      'DATA_COLLECTION_VALIDATION: Document verification initiated',
      'BGC_VENDOR_COORDINATION: Background check submitted',
      'IT_ACCESS: Email account provisioned',
      'HR_PAYROLL_SETUP: Employee record created',
      'TRAINING_ONBOARDING: Learning path assigned',
      'ENGAGEMENT_FEEDBACK: Welcome survey sent'
    ]
  }

  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    this.generateInitialEvents()
    
    // Generate events every 15 seconds
    this.intervalId = setInterval(() => {
      this.generateRandomEvent()
    }, 15000)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    this.isRunning = false
  }

  private generateInitialEvents() {
    // Generate some initial events to populate the feed
    for (let i = 0; i < 5; i++) {
      this.generateRandomEvent()
    }
  }

  private generateRandomEvent() {
    const eventTypes = Object.keys(this.eventTemplates) as Array<keyof typeof this.eventTemplates>
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const randomEmployee = this.employeeNames[Math.floor(Math.random() * this.employeeNames.length)]
    const randomCaseId = `CS${String(Math.floor(Math.random() * 100) + 1).padStart(4, '0')}`
    const templates = this.eventTemplates[randomType]
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]

    const event: TelemetryEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: randomType,
      description: randomTemplate,
      timestamp: new Date().toISOString(),
      caseId: randomCaseId,
      employeeName: randomEmployee,
      agent: randomType === 'agent_action' ? this.extractAgentFromDescription(randomTemplate) : undefined,
      details: `Auto-generated event for ${randomEmployee}`
    }

    this.events.unshift(event)
    
    // Keep only last 20 events
    if (this.events.length > 20) {
      this.events = this.events.slice(0, 20)
    }

    // Notify listeners
    this.notifyListeners()

    // Generate notification for important events
    if (Math.random() > 0.7) { // 30% chance of generating a notification
      this.generateNotification(event)
    }
  }

  private extractAgentFromDescription(description: string): string {
    const match = description.match(/^([A-Z_]+):/)
    return match ? match[1] : 'SYSTEM'
  }

  private generateNotification(event: TelemetryEvent) {
    let notification: Notification

    switch (event.type) {
      case 'exception_created':
        notification = {
          id: `not_${Date.now()}`,
          type: 'warning',
          title: 'Exception Created',
          message: `${event.employeeName}: ${event.description}`,
          timestamp: event.timestamp,
          read: false,
          actionable: true,
          caseId: event.caseId
        }
        break
      
      case 'bgv_update':
        if (event.description.includes('Clear')) {
          notification = {
            id: `not_${Date.now()}`,
            type: 'success',
            title: 'BGV Completed',
            message: `${event.employeeName}: Background verification cleared`,
            timestamp: event.timestamp,
            read: false,
            actionable: false,
            caseId: event.caseId
          }
        } else {
          return // Don't notify for other BGV updates
        }
        break
      
      case 'compliance_toggle':
        notification = {
          id: `not_${Date.now()}`,
          type: 'info',
          title: 'Compliance Updated',
          message: `${event.employeeName}: ${event.description}`,
          timestamp: event.timestamp,
          read: false,
          actionable: false,
          caseId: event.caseId
        }
        break
      
      default:
        return // Don't notify for other event types
    }

    this.notifyNotificationListeners(notification)
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback([...this.events]))
  }

  private notifyNotificationListeners(notification: Notification) {
    this.notificationListeners.forEach(callback => callback(notification))
  }

  subscribe(callback: (events: TelemetryEvent[]) => void) {
    this.listeners.push(callback)
    // Immediately call with current events
    callback([...this.events])
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  subscribeToNotifications(callback: (notification: Notification) => void) {
    this.notificationListeners.push(callback)
    
    return () => {
      this.notificationListeners = this.notificationListeners.filter(listener => listener !== callback)
    }
  }

  getRecentEvents(count: number = 10): TelemetryEvent[] {
    return this.events.slice(0, count)
  }

  clearEvents() {
    this.events = []
    this.notifyListeners()
  }

  // Simulate specific events for testing
  simulateEvent(type: keyof typeof this.eventTemplates, employeeName?: string, caseId?: string) {
    const employee = employeeName || this.employeeNames[Math.floor(Math.random() * this.employeeNames.length)]
    const case_id = caseId || `CS${String(Math.floor(Math.random() * 100) + 1).padStart(4, '0')}`
    const templates = this.eventTemplates[type]
    const description = templates[Math.floor(Math.random() * templates.length)]

    const event: TelemetryEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      timestamp: new Date().toISOString(),
      caseId: case_id,
      employeeName: employee,
      agent: type === 'agent_action' ? this.extractAgentFromDescription(description) : undefined,
      details: `Simulated event for ${employee}`
    }

    this.events.unshift(event)
    
    if (this.events.length > 20) {
      this.events = this.events.slice(0, 20)
    }

    this.notifyListeners()
    
    if (Math.random() > 0.5) {
      this.generateNotification(event)
    }
  }
}

// Create singleton instance
export const telemetryService = new TelemetryService()

// Auto-start in browser environment
if (typeof window !== 'undefined') {
  // Start with a small delay to ensure components are mounted
  setTimeout(() => {
    telemetryService.start()
  }, 2000)
}