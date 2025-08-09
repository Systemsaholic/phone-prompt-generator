"use client"

import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Download, Loader2, Volume2, AlertCircle } from 'lucide-react'
import VoicePreview from './VoicePreview'
import AITextGenerator from './AITextGenerator'
import AudioVersionCard, { AudioVersion } from './AudioVersionCard'
import { getVoiceOptions } from '@/lib/voices'
import toast from 'react-hot-toast'

const VOICE_OPTIONS = getVoiceOptions()

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
  const [versions, setVersions] = useState<AudioVersion[]>([])
  const [playingVersionId, setPlayingVersionId] = useState<string | null>(null)
  const lastTextHashRef = useRef<string>('')
  const lastSettingsHashRef = useRef<string>('')
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({})

  React.useEffect(() => {
    if (templateText) {
      setText(templateText)
    }
  }, [templateText])

  const getTextHash = (content: string) => {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  const getSettingsHash = (v: string, s: number) => {
    const combined = `${v}-${s}`
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = ((hash << 5) - hash) + char  
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  const calculateVersion = () => {
    const currentTextHash = getTextHash(text)
    const currentSettingsHash = getSettingsHash(voice, speed)
    
    if (versions.length === 0) {
      lastTextHashRef.current = currentTextHash
      lastSettingsHashRef.current = currentSettingsHash
      return '1'
    }
    
    const lastVersion = versions[versions.length - 1]
    const lastVersionParts = lastVersion.version.split('.')
    const majorVersion = parseInt(lastVersionParts[0])
    const minorVersion = lastVersionParts[1] ? parseInt(lastVersionParts[1]) : 0
    
    if (currentTextHash !== lastTextHashRef.current) {
      lastTextHashRef.current = currentTextHash
      lastSettingsHashRef.current = currentSettingsHash
      return `${majorVersion + 1}`
    } else if (currentSettingsHash !== lastSettingsHashRef.current) {
      lastSettingsHashRef.current = currentSettingsHash
      return `${majorVersion}.${minorVersion + 1}`
    }
    
    return `${majorVersion}.${minorVersion + 1}`
  }

  const generateAIFilename = async (versionNum: string) => {
    try {
      const response = await fetch('/api/ai-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'generateFilename',
          input: text.substring(0, 500),
          version: versionNum
        })
      })
      
      const data = await response.json()
      if (data.success && data.filename) {
        return data.filename
      }
    } catch (error) {
      console.error('Failed to generate AI filename:', error)
    }
    
    return `phone_prompt_v${versionNum}.wav`
  }

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text')
      return
    }

    if (versions.length >= 10) {
      toast.error('Maximum 10 versions allowed. Please delete some versions to continue.')
      return
    }

    setLoading(true)
    try {
      const versionNum = calculateVersion()
      const aiFileName = await generateAIFilename(versionNum)
      
      const response = await fetch('/api/tts/basic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice,
          speed,
          fileName: aiFileName,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        const newVersion: AudioVersion = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          version: versionNum,
          text,
          textHash: getTextHash(text),
          voice,
          speed,
          fileName: aiFileName,
          audioUrl: data.audioUrl,
          timestamp: new Date(),
          isSaved: false,
          mode: 'basic'
        }
        
        setVersions([...versions, newVersion])
        setAudioUrl(data.audioUrl)
        toast.success(`Audio v${versionNum} generated successfully!`)
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

  const handlePlayVersion = (versionId: string) => {
    const audio = document.getElementById(`audio-${versionId}`) as HTMLAudioElement
    
    if (playingVersionId === versionId && audio && !audio.paused) {
      audio.pause()
      setPlayingVersionId(null)
    } else {
      // Pause any currently playing audio
      if (playingVersionId) {
        const currentAudio = document.getElementById(`audio-${playingVersionId}`) as HTMLAudioElement
        if (currentAudio) currentAudio.pause()
      }
      
      if (audio) {
        audio.play()
        setPlayingVersionId(versionId)
        
        audio.onended = () => {
          setPlayingVersionId(null)
        }
      }
    }
  }

  const handleSaveVersion = async (version: AudioVersion) => {
    try {
      const response = await fetch('/api/audio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(version)
      })
      
      if (response.ok) {
        setVersions(versions.map(v => 
          v.id === version.id ? { ...v, isSaved: true } : v
        ))
        toast.success('Version saved to history!')
      } else {
        toast.error('Failed to save version')
      }
    } catch (error) {
      toast.error('Error saving version')
      console.error(error)
    }
  }

  const handleDeleteVersion = (id: string) => {
    setVersions(versions.filter(v => v.id !== id))
    if (playingVersionId === id) {
      setPlayingVersionId(null)
    }
    toast.success('Version deleted')
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">
            Text to Convert (Max 4096 characters)
          </label>
          <AITextGenerator 
            onTextGenerated={setText}
            currentText={text}
          />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 border rounded-lg h-32 resize-none"
          placeholder="Enter your phone system prompt text here or use AI to generate one..."
          maxLength={4096}
        />
        <div className="text-sm text-gray-500 mt-1">
          {text.length} / 4096 characters
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Voice</label>
          <div className="space-y-2">
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              {VOICE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} title={option.description}>
                  {option.label}
                </option>
              ))}
            </select>
            <VoicePreview voice={voice} />
          </div>
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

      {versions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Generated Versions</h3>
            {versions.length >= 10 && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="h-4 w-4" />
                Maximum versions reached
              </div>
            )}
          </div>
          <div className="grid gap-3">
            {versions.map(version => (
              <AudioVersionCard
                key={version.id}
                version={version}
                onPlay={() => handlePlayVersion(version.id)}
                onSave={handleSaveVersion}
                onDelete={handleDeleteVersion}
                isPlaying={playingVersionId === version.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}