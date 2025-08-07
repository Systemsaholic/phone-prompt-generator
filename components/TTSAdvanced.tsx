"use client"

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Download, Loader2, Volume2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo', 
  'fable', 'nova', 'onyx', 'sage', 'shimmer'
]

const PRESET_INSTRUCTIONS = {
  'British Accent': 'Speak with a clear British accent',
  'American Accent': 'Speak with a standard American accent',
  'Australian Accent': 'Speak with an Australian accent',
  'Enthusiastic': 'Sound very enthusiastic and energetic',
  'Professional': 'Speak in a professional, business-like tone',
  'Friendly': 'Sound warm and friendly',
  'Calm': 'Speak in a calm and soothing voice',
  'Urgent': 'Sound urgent and important',
  'Whisper': 'Whisper softly',
  'Slow and Clear': 'Speak slowly and clearly, enunciating each word',
  'Fast Paced': 'Speak quickly but clearly',
  'Child-Friendly': 'Speak in a way that children would understand and enjoy',
}

interface TTSAdvancedProps {
  templateText?: string
}

export default function TTSAdvanced({ templateText = '' }: TTSAdvancedProps) {
  const [text, setText] = useState(templateText)
  const [voice, setVoice] = useState('alloy')
  const [customInstructions, setCustomInstructions] = useState('')
  const [selectedPresets, setSelectedPresets] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  React.useEffect(() => {
    if (templateText) {
      setText(templateText)
    }
  }, [templateText])

  const togglePreset = (preset: string) => {
    setSelectedPresets((prev) =>
      prev.includes(preset)
        ? prev.filter((p) => p !== preset)
        : [...prev, preset]
    )
  }

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text')
      return
    }

    const instructions = [
      ...selectedPresets.map((p) => PRESET_INSTRUCTIONS[p as keyof typeof PRESET_INSTRUCTIONS]),
      customInstructions,
    ].filter(Boolean).join('. ')

    if (!instructions) {
      toast.error('Please select at least one preset or enter custom instructions')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/tts/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice,
          instructions,
          fileName: fileName || undefined,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setAudioUrl(data.audioUrl)
        toast.success('Advanced audio generated successfully!')
      } else {
        toast.error(data.error || 'Failed to generate audio')
      }
    } catch (error) {
      toast.error('Error generating audio')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a')
      link.href = audioUrl
      link.download = fileName || 'phone_prompt_advanced.mp3'
      link.click()
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">Advanced Mode</h3>
        </div>
        <p className="text-sm text-blue-700">
          Use natural language instructions to control voice characteristics like accent, 
          tone, emotion, and speaking style. This mode uses GPT-4o for enhanced control.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Text to Convert (Max 4096 characters)
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 border rounded-lg h-32 resize-none"
          placeholder="Enter your phone system prompt text here..."
          maxLength={4096}
        />
        <div className="text-sm text-gray-500 mt-1">
          {text.length} / 4096 characters
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Base Voice</label>
        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          {VOICES.map((v) => (
            <option key={v} value={v}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Voice Characteristics (Select Multiple)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.keys(PRESET_INSTRUCTIONS).map((preset) => (
            <button
              key={preset}
              onClick={() => togglePreset(preset)}
              className={`p-2 text-sm rounded-lg border transition-colors ${
                selectedPresets.includes(preset)
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Custom Instructions (Optional)
        </label>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          className="w-full p-3 border rounded-lg h-20 resize-none"
          placeholder="E.g., 'Speak with a slight Southern drawl and pause briefly between sentences'"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Custom Filename (optional)
        </label>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="w-full p-2 border rounded-lg"
          placeholder="my_advanced_prompt.mp3"
        />
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={handleGenerate} 
          disabled={loading || !text.trim() || (selectedPresets.length === 0 && !customInstructions)}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Advanced Audio...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Advanced Audio
            </>
          )}
        </Button>
      </div>

      {audioUrl && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <h3 className="font-medium">Generated Audio</h3>
          <audio controls className="w-full">
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <div className="flex gap-2">
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button 
              onClick={() => window.open(audioUrl, '_blank')} 
              variant="outline"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}