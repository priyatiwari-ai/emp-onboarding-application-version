"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { 
  ArrowLeft,
  LogOut, 
  Bell,
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  GraduationCap,
  Shield,
  FileText,
  Building2,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Star,
  Calendar,
  Filter,
  Menu,
  X
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  generateSurveyResponses,
  getSurveyMetrics,
  getEngagementFunnel,
  DEPARTMENTS 
} from "@/lib/mockData"
import { 
  SurveyResponse, 
  SurveyMetrics, 
  EngagementFunnel,
  Department 
} from "@/lib/types"

interface SurveyDashboardProps {
  onLogout: () => void
  onViewChange: (view: 'dashboard' | 'survey' | 'journey', caseId?: string) => void
}

export default function SurveyDashboard({ 
  onLogout, 
  onViewChange 
}: SurveyDashboardProps) {
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([])
  const [metrics, setMetrics] = useState<SurveyMetrics | null>(null)
  const [engagementFunnel, setEngagementFunnel] = useState<EngagementFunnel | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'All'>('All')
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30' | '60' | '90'>('90')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const responses = generateSurveyResponses()
    setSurveyResponses(responses)
    setMetrics(getSurveyMetrics())
    setEngagementFunnel(getEngagementFunnel())
  }, [])

  if (!metrics || !engagementFunnel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Filter survey responses
  const filteredResponses = surveyResponses.filter(response => {
    if (selectedDepartment !== 'All' && response.department !== selectedDepartment) {
      return false
    }
    return true
  })

  // Calculate satisfaction by department
  const satisfactionByDept = DEPARTMENTS.map(dept => {
    const deptResponses = surveyResponses.filter(r => r.department === dept)
    const avgSatisfaction = deptResponses.length > 0 
      ? deptResponses.reduce((sum, r) => sum + r.overallSatisfaction, 0) / deptResponses.length
      : 0
    
    return {
      department: dept.split(' & ')[0], // Shorten department names for chart
      satisfaction: Number(avgSatisfaction.toFixed(1)),
      responses: deptResponses.length
    }
  })

  // Top improvement areas
  const improvementAreas = [
    { area: 'Faster IT access', priority: 'High', responses: 23, percentage: 42 },
    { area: 'More manager feedback', priority: 'High', responses: 18, percentage: 33 },
    { area: 'Clearer role expectations', priority: 'Medium', responses: 15, percentage: 27 },
    { area: 'Better onboarding materials', priority: 'Medium', responses: 12, percentage: 22 },
    { area: 'Improved buddy program', priority: 'Low', responses: 8, percentage: 15 }
  ]

  // Culture words data for word cloud simulation
  const cultureWords = [
    { word: 'Innovative', count: 15, size: 'text-3xl' },
    { word: 'Supportive', count: 12, size: 'text-2xl' },
    { word: 'Collaborative', count: 10, size: 'text-xl' },
    { word: 'Professional', count: 8, size: 'text-lg' },
    { word: 'Dynamic', count: 7, size: 'text-lg' },
    { word: 'Inclusive', count: 6, size: 'text-base' },
    { word: 'Challenging', count: 5, size: 'text-base' },
    { word: 'Rewarding', count: 4, size: 'text-sm' }
  ]

  // Sample feedback highlights
  const feedbackHighlights = [
    "Great onboarding experience overall! My manager was very helpful.",
    "IT access was delayed by 2 days, which made the first week challenging.",
    "The buddy program really helped me settle in quickly.",
    "Would appreciate more clarity on performance expectations.",
    "Orientation was well-organized and informative."
  ]

  // Flagged journeys for low engagement
  const flaggedJourneys = surveyResponses
    .filter(r => r.overallSatisfaction <= 3 || r.enps < 0)
    .slice(0, 5)

  const funnelData = [
    { stage: 'Offer', count: engagementFunnel.offer.count, rate: engagementFunnel.offer.conversionRate },
    { stage: 'Preboarding', count: engagementFunnel.preboarding.count, rate: engagementFunnel.preboarding.conversionRate },
    { stage: 'Day 1', count: engagementFunnel.day1.count, rate: engagementFunnel.day1.conversionRate },
    { stage: 'Week 1', count: engagementFunnel.week1.count, rate: engagementFunnel.week1.conversionRate },
    { stage: 'Day 30', count: engagementFunnel.day30.count, rate: engagementFunnel.day30.conversionRate },
    { stage: 'Day 90', count: engagementFunnel.day90.count, rate: engagementFunnel.day90.conversionRate }
  ]

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Survey Dashboard Content with proper spacing */}
      <div className="p-6 pt-20">
        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => onViewChange('dashboard')}
              className="flex items-center space-x-2 hover:text-blue-600 active:text-blue-600 text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">New Hire Engagement Insights</h1>
          </div>

          <div className="flex items-center space-x-2">
              <Select value={selectedDepartment} onValueChange={(value) => setSelectedDepartment(value as Department | "All")}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Departments</SelectItem>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as "30" | "60" | "90")}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center">
                <Star className="h-4 w-4 mr-1" />
                Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{metrics.overallSatisfaction}/5</div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">+0.2 vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                ENPS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">+{metrics.enps}</div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-blue-600">+5 vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-indigo-50 border-indigo-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-600 flex items-center">
                <GraduationCap className="h-4 w-4 mr-1" />
                Training Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700">{metrics.trainingCompletionRate}%</div>
              <div className="flex items-center space-x-1">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-500">-3% vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-600 flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Asset Timeliness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{metrics.assetTimeliness}%</div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">+2% vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-teal-50 border-teal-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-teal-600 flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                Policy Ack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-700">{metrics.policyAckRate}%</div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">+1% vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Turnover Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{metrics.turnoverRate}%</div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-500">+0.5% vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Funnel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Engagement Funnel</CardTitle>
            <CardDescription>Conversion rates through the onboarding journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {funnelData.map((stage, index) => (
                <div 
                  key={stage.stage}
                  className={`text-center p-4 rounded-lg border ${
                    stage.rate < 90 ? 'bg-red-50 border-red-200' : 
                    stage.rate < 95 ? 'bg-yellow-50 border-yellow-200' : 
                    'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="text-2xl font-bold">{stage.count}</div>
                  <div className="text-sm font-medium">{stage.stage}</div>
                  <div className={`text-xs mt-1 ${
                    stage.rate < 90 ? 'text-red-600' : 
                    stage.rate < 95 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {stage.rate}% conversion
                  </div>
                  {index < funnelData.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 text-gray-400">→</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Survey Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Satisfaction by Department */}
          <Card>
            <CardHeader>
              <CardTitle>Satisfaction by Department</CardTitle>
              <CardDescription>Average satisfaction scores across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={satisfactionByDept}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="department" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="satisfaction" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Culture Word Cloud */}
          <Card>
            <CardHeader>
              <CardTitle>Culture Sentiment</CardTitle>
              <CardDescription>"Describe our culture in one word"</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-center h-80 p-4">
                {cultureWords.map((item, index) => (
                  <span 
                    key={item.word}
                    className={`${item.size} font-bold text-blue-600 m-2 opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                    style={{ 
                      color: `hsl(${200 + index * 30}, 60%, ${50 + index * 5}%)` 
                    }}
                  >
                    {item.word}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top 5 Areas to Improve */}
          <Card>
            <CardHeader>
              <CardTitle>Top Areas to Improve</CardTitle>
              <CardDescription>Based on survey feedback and ratings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {improvementAreas.map((area, index) => (
                <div key={area.area} className="flex items-center justify-between p-3 rounded bg-gray-50">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{area.area}</div>
                    <div className="text-xs text-gray-500">{area.responses} responses</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={area.priority === 'High' ? 'destructive' : area.priority === 'Medium' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {area.priority}
                    </Badge>
                    <span className="text-sm font-medium">{area.percentage}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Feedback Highlights */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Key insights from open text responses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedbackHighlights.map((feedback, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-3 py-2">
                  <p className="text-sm text-gray-700">"{feedback}"</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Anonymous feedback • {Math.floor(Math.random() * 7) + 1} days ago
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actionables Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Action Required</CardTitle>
              <CardDescription>Journeys flagged for low engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {flaggedJourneys.map(journey => (
                <div key={journey.id} className="flex items-center justify-between p-3 border border-yellow-200 rounded bg-yellow-50">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{journey.employeeName}</div>
                    <div className="text-xs text-gray-600">{journey.department}</div>
                    <div className="text-xs text-yellow-600 mt-1">
                      Satisfaction: {journey.overallSatisfaction}/5
                      {journey.enps < 0 && ` • ENPS: ${journey.enps}`}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0"
                      onClick={() => onViewChange('journey', journey.caseId)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Automated Recommendations</span>
                </div>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Increase manager check-ins for IT hires</li>
                  <li>• Improve onboarding materials for Finance dept</li>
                  <li>• Expedite asset allocation process</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}