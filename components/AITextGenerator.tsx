"use client"

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Sparkles, Wand2, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface AITextGeneratorProps {
  onTextGenerated: (text: string) => void
  currentText?: string
}

interface GenerateModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (prompt: string) => void
  loading: boolean
}

function GenerateModal({ isOpen, onClose, onGenerate, loading }: GenerateModalProps) {
  const [prompt, setPrompt] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim()) {
      onGenerate(prompt.trim())
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Generate Phone Prompt</h2>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Describe your phone prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'customer support hold message with options to press 1 for sales, 2 for billing'"
              className="w-full p-3 border rounded-lg h-24 resize-none"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Be specific about the type of prompt, intended use, and any menu options needed.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AITextGenerator({ onTextGenerated, currentText }: AITextGeneratorProps) {
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async (prompt: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'generate',
          input: prompt
        })
      })

      const data = await response.json()

      if (data.success) {
        onTextGenerated(data.text)
        setGenerateModalOpen(false)
        toast.success('Phone prompt generated successfully!')
        if (data.truncated) {
          toast('Text was truncated to fit character limit', { icon: '✂️' })
        }
      } else {
        toast.error(data.error || 'Failed to generate text')
      }
    } catch (error) {
      toast.error('Error generating text')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handlePolish = async () => {
    if (!currentText?.trim()) {
      toast.error('No text to polish')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ai-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'polish',
          input: currentText
        })
      })

      const data = await response.json()

      if (data.success) {
        onTextGenerated(data.text)
        toast.success('Text polished successfully!')
        if (data.truncated) {
          toast('Text was truncated to fit character limit', { icon: '✂️' })
        }
      } else {
        toast.error(data.error || 'Failed to polish text')
      }
    } catch (error) {
      toast.error('Error polishing text')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => setGenerateModalOpen(true)}
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Generate Phone Prompt
        </Button>
        
        {currentText?.trim() && (
          <Button
            onClick={handlePolish}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Polish Text
          </Button>
        )}
      </div>

      <GenerateModal
        isOpen={generateModalOpen}
        onClose={() => !loading && setGenerateModalOpen(false)}
        onGenerate={handleGenerate}
        loading={loading}
      />
    </>
  )
}