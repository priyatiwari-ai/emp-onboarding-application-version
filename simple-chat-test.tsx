"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, Bot, User, Clock, CheckCircle, Activity, Workflow, Zap, Brain, Target, Shield, Play } from "lucide-react"

export function SimpleChatTest() {
  const [messages, setMessages] = useState([
    { id: '1', type: 'ai', content: `🎯 **Welcome to AI-Powered Onboarding!**\n\nI'm Diana Prince, your dedicated AI Onboarding Specialist. I'm here to streamline Alex Morgan's onboarding journey with intelligent automation and real-time assistance.\n\n**Current Status:**\n• Candidate: Alex Morgan\n• Stage: Week 1\n• Mode: 🤝 Assist (I will work with your guidance)\n\n**What I can help you with:**\n✅ Automate onboarding workflows\n✅ Monitor background checks\n✅ Track document submissions\n✅ Generate progress reports\n✅ Handle compliance requirements\n\nHow would you like to proceed today?`, timestamp: new Date() },
    { id: '2', type: 'user', content: 'Hi there! Let\'s get started.', timestamp: new Date() },
    { id: '3', type: 'ai', content: 'Great! What would you like to do first?', timestamp: new Date() },
  ])
  const [inputValue, setInputValue] = useState("")

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="max-w-7xl w-[98vw] h-[95vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Chat Test</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 grid grid-cols-2 min-h-0">
          {/* Left Column */}
          <div className="flex flex-col border-r">
            <div className="p-3 border-b bg-gray-50">Chat Header</div>
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-start gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex-shrink-0 flex items-center justify-center">
                          {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`rounded-lg p-3 shadow-sm min-w-0 ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                          <div className="text-sm whitespace-pre-line break-words">{message.content}</div>
                          <p className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="p-3 border-t bg-gray-50">
              <Input placeholder="Type a message..." />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col">
            <div className="p-3 border-b bg-gray-50">Activity Header</div>
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div key={i} className="py-2 border-b">Activity Item {i + 1}</div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="p-3 border-t bg-gray-50">
              Some footer content
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}