"use client"

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Download, Loader2, Volume2 } from 'lucide-react'
import toast from 'react-hot-toast'

const VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo', 
  'fable', 'nova', 'onyx', 'sage', 'shimmer'
]

interface TTSBasicProps {
  onTemplateSelect?: (text: string) => void
  templateText?: string
}

export default function TTSBasic({ templateText = '' }: TTSBasicProps) {
  const [text, setText] = useState(templateText)
  const [voice, setVoice] = useState('alloy')
  const [speed, setSpeed] = useState(1.0)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  React.useEffect(() => {
    if (templateText) {
      setText(templateText)
    }
  }, [templateText])

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/tts/basic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice,
          speed,
          fileName: fileName || undefined,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setAudioUrl(data.audioUrl)
        toast.success('Audio generated successfully!')
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
      link.download = fileName || 'phone_prompt.mp3'
      link.click()
    }
  }

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Voice</label>
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
            Speed: {speed}x
          </label>
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0.25x</span>
            <span>4x</span>
          </div>
        </div>
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
          placeholder="my_phone_prompt.mp3"
        />
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={handleGenerate} 
          disabled={loading || !text.trim()}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Audio'
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