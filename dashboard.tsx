"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { LogOut, Menu, X, AlertTriangle, TrendingUp, Users, CheckCircle, Home } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface OnboardingMetrics {
  totalActive: number
  completed: number
  blockedOrAtRisk: number
  exceptions: number
  avgTimeToComplete: number
}

interface StageData {
  stage: string
  notStarted: number
  inProgress: number
  completed: number
  blocked: number
}

interface DepartmentData {
  department: string
  total: number
  onTrack: number
  atRisk: number
}

interface EmployeesData {
  id: number
  name: string
  department: string
  status: string
  stage: string
}

interface CasesData {
  id: number
  employee: string
  stage: string
  progress: number
  started: string
}

interface ExceptionsData {
  id: string
  employee: string
  type: string
  severity: string
  created: string
}

interface ReportsMetrics {
  month: string
  completed: number
  active: number
  blocked: number
}

type NavSection = "dashboard" | "employees" | "cases" | "exceptions" | "reports"

const DASHBOARD_DATA: OnboardingMetrics = {
  totalActive: 128,
  completed: 456,
  blockedOrAtRisk: 12,
  exceptions: 8,
  avgTimeToComplete: 28,
}

const STAGE_DISTRIBUTION: StageData[] = [
  { stage: "Preboarding", notStarted: 15, inProgress: 28, completed: 185, blocked: 2 },
  { stage: "Day 1", notStarted: 8, inProgress: 22, completed: 198, blocked: 1 },
  { stage: "Week 1", notStarted: 5, inProgress: 35, completed: 188, blocked: 3 },
  { stage: "Day 30", notStarted: 3, inProgress: 22, completed: 201, blocked: 2 },
  { stage: "Day 90", notStarted: 2, inProgress: 21, completed: 202, blocked: 2 },
]

const EXCEPTION_TRENDS = [
  { day: "Mon", documentMismatch: 2, identityExpired: 1, bgvRedFlag: 0, compliancePending: 1 },
  { day: "Tue", documentMismatch: 3, identityExpired: 2, bgvRedFlag: 1, compliancePending: 1 },
  { day: "Wed", documentMismatch: 1, identityExpired: 0, bgvRedFlag: 1, compliancePending: 2 },
  { day: "Thu", documentMismatch: 2, identityExpired: 1, bgvRedFlag: 0, compliancePending: 1 },
  { day: "Fri", documentMismatch: 4, identityExpired: 2, bgvRedFlag: 2, compliancePending: 0 },
]

const DEPARTMENT_DATA: DepartmentData[] = [
  { department: "Manufacturing", total: 45, onTrack: 42, atRisk: 3 },
  { department: "Engineering", total: 38, onTrack: 35, atRisk: 3 },
  { department: "Finance", total: 28, onTrack: 26, atRisk: 2 },
  { department: "HR & Admin", total: 35, onTrack: 33, atRisk: 2 },
  { department: "Sales", total: 22, onTrack: 20, atRisk: 2 },
]

const EMPLOYEES_DATA: EmployeesData[] = [
  { id: 1, name: "John Smith", department: "Manufacturing", status: "Completed", stage: "Day 90" },
  { id: 2, name: "Sarah Johnson", department: "Engineering", status: "In Progress", stage: "Week 1" },
  { id: 3, name: "Mike Chen", department: "Finance", status: "At Risk", stage: "Day 30" },
  { id: 4, name: "Emily Davis", department: "HR & Admin", status: "Completed", stage: "Day 90" },
  { id: 5, name: "Alex Rodriguez", department: "Sales", status: "In Progress", stage: "Day 1" },
]

const CASES_DATA: CasesData[] = [
  { id: 1001, employee: "John Smith", stage: "Day 90", progress: 100, started: "2025-09-15" },
  { id: 1002, employee: "Sarah Johnson", stage: "Week 1", progress: 45, started: "2025-11-20" },
  { id: 1003, employee: "Mike Chen", stage: "Day 30", progress: 55, started: "2025-11-10" },
  { id: 1004, employee: "Emily Davis", stage: "Day 90", progress: 100, started: "2025-09-01" },
  { id: 1005, employee: "Alex Rodriguez", stage: "Day 1", progress: 20, started: "2025-12-05" },
]

const EXCEPTIONS_DATA: ExceptionsData[] = [
  { id: "EXC001", employee: "Mike Chen", type: "Document Mismatch", severity: "High", created: "2025-12-06" },
  { id: "EXC002", employee: "Sarah Johnson", type: "Identity Expired", severity: "Medium", created: "2025-12-05" },
  { id: "EXC003", employee: "John Smith", type: "BGV Red Flag", severity: "Critical", created: "2025-12-04" },
  { id: "EXC004", employee: "Alex Rodriguez", type: "Compliance Pending", severity: "Medium", created: "2025-12-06" },
]

const REPORTS_METRICS: ReportsMetrics[] = [
  { month: "Sep", completed: 45, active: 12, blocked: 2 },
  { month: "Oct", completed: 67, active: 15, blocked: 3 },
  { month: "Nov", completed: 89, active: 18, blocked: 2 },
  { month: "Dec", completed: 45, active: 20, blocked: 1 },
]

const PIE_DATA = [
  { name: "Completed", value: 456 },
  { name: "In Progress", value: 128 },
  { name: "At Risk", value: 12 },
]

const COLORS = ["#4f46e5", "#0ea5e9", "#ef4444"]

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard")

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardContent />
      case "employees":
        return <EmployeesContent />
      case "cases":
        return <CasesContent />
      case "exceptions":
        return <ExceptionsContent />
      case "reports":
        return <ReportsContent />
      default:
        return <DashboardContent />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-foreground hover:bg-muted p-2 rounded"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                CS
              </div>
              <div>
                
                
              </div>
            </div>
          </div>
          <Button variant="ghost" onClick={onLogout} className="text-foreground hover:bg-muted">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-sidebar border-r border-sidebar-border p-6 space-y-4 hidden lg:block">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection("dashboard")}
                className={`w-full text-left px-4 py-2 rounded font-semibold text-sm transition-colors ${
                  activeSection === "dashboard"
                    ? "bg-sidebar-primary/20 text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/10"
                }`}
              >
                <Home className="inline h-4 w-4 mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveSection("employees")}
                className={`w-full text-left px-4 py-2 rounded text-sm transition-colors ${
                  activeSection === "employees"
                    ? "bg-sidebar-primary/20 text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/10"
                }`}
              >
                Employees
              </button>
              <button
                onClick={() => setActiveSection("cases")}
                className={`w-full text-left px-4 py-2 rounded text-sm transition-colors ${
                  activeSection === "cases"
                    ? "bg-sidebar-primary/20 text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/10"
                }`}
              >
                Cases
              </button>
              <button
                onClick={() => setActiveSection("exceptions")}
                className={`w-full text-left px-4 py-2 rounded text-sm transition-colors ${
                  activeSection === "exceptions"
                    ? "bg-sidebar-primary/20 text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/10"
                }`}
              >
                Exceptions
              </button>
              <button
                onClick={() => setActiveSection("reports")}
                className={`w-full text-left px-4 py-2 rounded text-sm transition-colors ${
                  activeSection === "reports"
                    ? "bg-sidebar-primary/20 text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/10"
                }`}
              >
                Reports
              </button>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">{renderContent()}</main>
      </div>
    </div>
  )
}

function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Active Cases</p>
                <p className="text-3xl font-bold text-primary">{DASHBOARD_DATA.totalActive}</p>
              </div>
              <Users className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Completed</p>
                <p className="text-3xl font-bold text-accent">{DASHBOARD_DATA.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-accent/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Blocked / At Risk</p>
                <p className="text-3xl font-bold text-destructive">{DASHBOARD_DATA.blockedOrAtRisk}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Open Exceptions</p>
                <p className="text-3xl font-bold text-orange-500">{DASHBOARD_DATA.exceptions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Onboarding Journey Status</CardTitle>
            <CardDescription>Distribution across all stages</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={STAGE_DISTRIBUTION}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="stage" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                <Legend />
                <Bar dataKey="notStarted" stackId="a" fill="var(--chart-4)" />
                <Bar dataKey="inProgress" stackId="a" fill="var(--chart-1)" />
                <Bar dataKey="completed" stackId="a" fill="var(--chart-2)" />
                <Bar dataKey="blocked" stackId="a" fill="var(--chart-5)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Onboarding Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Status</CardTitle>
            <CardDescription>All active & completed cases</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exception Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Exception Trends (This Week)</CardTitle>
            <CardDescription>By category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={EXCEPTION_TRENDS}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="documentMismatch"
                  stackId="1"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="identityExpired"
                  stackId="1"
                  stroke="var(--chart-3)"
                  fill="var(--chart-3)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="bgvRedFlag"
                  stackId="1"
                  stroke="var(--chart-5)"
                  fill="var(--chart-5)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="compliancePending"
                  stackId="1"
                  stroke="var(--chart-4)"
                  fill="var(--chart-4)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Health */}
        <Card>
          <CardHeader>
            <CardTitle>Department Health</CardTitle>
            <CardDescription>On-track vs at-risk by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DEPARTMENT_DATA.map((dept) => (
                <div key={dept.department}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{dept.department}</span>
                    <span className="text-xs text-muted-foreground">{dept.total} hires</span>
                  </div>
                  <div className="flex h-2 bg-muted rounded-full overflow-hidden">
                    <div className="bg-accent" style={{ width: `${(dept.onTrack / dept.total) * 100}%` }} />
                    <div className="bg-destructive" style={{ width: `${(dept.atRisk / dept.total) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{dept.onTrack} on track</span>
                    <span>{dept.atRisk} at risk</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics & Health Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-muted-foreground text-sm mb-2">Average Time to Complete</p>
              <p className="text-2xl font-bold text-primary">{DASHBOARD_DATA.avgTimeToComplete} days</p>
              <p className="text-xs text-muted-foreground mt-1">From start to finish</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-2">Success Rate</p>
              <p className="text-2xl font-bold text-accent">
                {((DASHBOARD_DATA.completed / (DASHBOARD_DATA.completed + DASHBOARD_DATA.totalActive)) * 100).toFixed(
                  1,
                )}
                %
              </p>
              <p className="text-xs text-muted-foreground mt-1">Completed without blocks</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-2">Exception Resolution Rate</p>
              <p className="text-2xl font-bold text-orange-500">87.5%</p>
              <p className="text-xs text-muted-foreground mt-1">Resolved within SLA</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EmployeesContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Employees</h2>
        <p className="text-muted-foreground">Manage and track all employee onboarding information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Employees</CardTitle>
          <CardDescription>Currently in onboarding process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Name</th>
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Department</th>
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Status</th>
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Current Stage</th>
                </tr>
              </thead>
              <tbody>
                {EMPLOYEES_DATA.map((emp) => (
                  <tr key={emp.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-2 px-4 text-foreground">{emp.name}</td>
                    <td className="py-2 px-4 text-muted-foreground">{emp.department}</td>
                    <td className="py-2 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          emp.status === "Completed"
                            ? "bg-accent/20 text-accent"
                            : emp.status === "At Risk"
                              ? "bg-destructive/20 text-destructive"
                              : "bg-primary/20 text-primary"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-muted-foreground">{emp.stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CasesContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Cases</h2>
        <p className="text-muted-foreground">Monitor ongoing onboarding cases and their progress</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Cases</CardTitle>
          <CardDescription>Current status and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {CASES_DATA.map((caseItem) => (
              <div key={caseItem.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">Case #{caseItem.id}</p>
                    <p className="text-sm text-muted-foreground">{caseItem.employee}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{caseItem.stage}</p>
                    <p className="text-xs text-muted-foreground">Started: {caseItem.started}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${caseItem.progress}%` }} />
                  </div>
                  <span className="text-sm font-medium text-foreground w-12 text-right">{caseItem.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ExceptionsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Exceptions</h2>
        <p className="text-muted-foreground">Track and manage onboarding exceptions</p>
      </div>

      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{EXCEPTIONS_DATA.length} active exceptions require attention</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Exception List</CardTitle>
          <CardDescription>Issues requiring resolution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {EXCEPTIONS_DATA.map((exc) => (
              <div key={exc.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{exc.type}</p>
                    <p className="text-sm text-muted-foreground">{exc.employee}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      exc.severity === "Critical"
                        ? "bg-destructive/20 text-destructive"
                        : exc.severity === "High"
                          ? "bg-orange-500/20 text-orange-500"
                          : "bg-yellow-500/20 text-yellow-500"
                    }`}
                  >
                    {exc.severity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ID: {exc.id} • Created: {exc.created}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ReportsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Reports</h2>
        <p className="text-muted-foreground">Onboarding metrics and engagement surveys</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-2">Total Completed</p>
            <p className="text-3xl font-bold text-accent">246</p>
            <p className="text-xs text-muted-foreground mt-2">In last 4 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-2">Avg. Completion Time</p>
            <p className="text-3xl font-bold text-primary">27.2</p>
            <p className="text-xs text-muted-foreground mt-2">Days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-2">Success Rate</p>
            <p className="text-3xl font-bold text-accent">78.9%</p>
            <p className="text-xs text-muted-foreground mt-2">Completion rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completion Trends</CardTitle>
          <CardDescription>Last 4 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={REPORTS_METRICS}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="var(--chart-2)" strokeWidth={2} />
              <Line type="monotone" dataKey="active" stroke="var(--chart-1)" strokeWidth={2} />
              <Line type="monotone" dataKey="blocked" stroke="var(--chart-5)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
