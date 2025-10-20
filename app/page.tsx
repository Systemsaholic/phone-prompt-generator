"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TTSBasic from '@/components/TTSBasic'
import TTSAdvanced from '@/components/TTSAdvanced'
import TemplateManager from '@/components/TemplateManager'
import HistoryPanel from '@/components/HistoryPanel'
import { Phone, Sparkles, FileText, History, Settings, LogOut } from 'lucide-react'

interface HistoryGeneration {
  id: string
  text: string
  mode: string
  voice: string
  speed?: number
  instructions?: string
  format: string
  fileName: string
  fileUrl: string
  templateUsed?: string
  createdAt: string
}

export default function Home() {
  const router = useRouter()
  const [templateText, setTemplateText] = useState('')
  const [activeTab, setActiveTab] = useState('generate')
  const [ttsMode, setTtsMode] = useState('basic')
  const [historyGeneration, setHistoryGeneration] = useState<HistoryGeneration | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleTemplateSelect = (text: string) => {
    setTemplateText(text)
    setActiveTab('generate')
  }

  const handleHistorySelect = (generation: HistoryGeneration) => {
    setHistoryGeneration(generation)
    setTtsMode(generation.mode === 'advanced' ? 'advanced' : 'basic')
    setActiveTab('generate')
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/login')
        router.refresh()
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Phone className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Phone Prompt Generator
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 hidden sm:block">
                Professional Audio for Phone Systems
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Generate Audio
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setTtsMode('basic')}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                      ttsMode === 'basic'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Settings className="h-4 w-4" />
                      Basic Mode
                    </div>
                    <p className="text-xs mt-1 text-gray-500">
                      Simple voice and speed controls
                    </p>
                  </button>
                  <button
                    onClick={() => setTtsMode('advanced')}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                      ttsMode === 'advanced'
                        ? 'bg-white shadow text-purple-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Advanced Mode
                    </div>
                    <p className="text-xs mt-1 text-gray-500">
                      Natural language voice control
                    </p>
                  </button>
                </div>
              </div>

              {ttsMode === 'basic' ? (
                <TTSBasic 
                  templateText={templateText} 
                  historyGeneration={historyGeneration}
                />
              ) : (
                <TTSAdvanced 
                  templateText={templateText}
                  historyGeneration={historyGeneration}
                />
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                3CX Phone System Format
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                For optimal compatibility with 3CX and other phone systems, audio will be automatically converted to:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Format: WAV</li>
                <li>• Channel: Mono</li>
                <li>• Sample Rate: 8 kHz</li>
                <li>• Bit Depth: 16-bit</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="bg-white rounded-lg shadow p-6">
              <TemplateManager onTemplateSelect={handleTemplateSelect} />
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="bg-white rounded-lg shadow p-6">
              <HistoryPanel onGenerationSelect={handleHistorySelect} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}