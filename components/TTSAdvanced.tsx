"use client"

import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Loader2, Sparkles, AlertCircle } from 'lucide-react'
import VoicePreview from './VoicePreview'
import AITextGenerator from './AITextGenerator'
import AudioVersionCard, { AudioVersion } from './AudioVersionCard'
import { getVoiceOptions } from '@/lib/voices'
import toast from 'react-hot-toast'

const VOICE_OPTIONS = getVoiceOptions()

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

interface TTSAdvancedProps {
  templateText?: string
  historyGeneration?: HistoryGeneration | null
}

export default function TTSAdvanced({ templateText = '', historyGeneration }: TTSAdvancedProps) {
  const [text, setText] = useState(templateText)
  const [voice, setVoice] = useState('alloy')
  const [customInstructions, setCustomInstructions] = useState('')
  const [selectedPresets, setSelectedPresets] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [versions, setVersions] = useState<AudioVersion[]>([])
  const [playingVersionId, setPlayingVersionId] = useState<string | null>(null)
  const lastTextHashRef = useRef<string>('')
  const lastSettingsHashRef = useRef<string>('')

  React.useEffect(() => {
    if (templateText) {
      setText(templateText)
    }
  }, [templateText])

  React.useEffect(() => {
    if (historyGeneration && historyGeneration.mode === 'advanced') {
      setText(historyGeneration.text)
      setVoice(historyGeneration.voice)
      
      // Parse instructions to extract presets and custom instructions
      if (historyGeneration.instructions) {
        const instructions = historyGeneration.instructions
        const foundPresets: string[] = []
        
        // Check for preset instructions in the text
        Object.entries(PRESET_INSTRUCTIONS).forEach(([preset, instruction]) => {
          if (instructions.toLowerCase().includes(instruction.toLowerCase()) ||
              instructions.toLowerCase().includes(preset.toLowerCase())) {
            foundPresets.push(preset)
          }
        })
        
        setSelectedPresets(foundPresets)
        
        // Set custom instructions (removing matched preset instructions)
        let customPart = instructions
        foundPresets.forEach(preset => {
          const presetInstruction = PRESET_INSTRUCTIONS[preset as keyof typeof PRESET_INSTRUCTIONS]
          if (presetInstruction) {
            customPart = customPart.replace(presetInstruction, '').trim()
          }
        })
        setCustomInstructions(customPart)
      }
      
      // Optionally set the filename
      const baseFileName = historyGeneration.fileName.replace(/(_v\d+)?\.wav$/, '')
      setFileName(`${baseFileName}_edited.wav`)
    }
  }, [historyGeneration])

  const getTextHash = (content: string) => {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  const getSettingsHash = (v: string, instr: string) => {
    const combined = `${v}-${instr}`
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  const calculateVersion = (instructions: string) => {
    const currentTextHash = getTextHash(text)
    const currentSettingsHash = getSettingsHash(voice, instructions)
    
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
    
    return `phone_prompt_advanced_v${versionNum}.wav`
  }

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

    if (versions.length >= 10) {
      toast.error('Maximum 10 versions allowed. Please delete some versions to continue.')
      return
    }

    setLoading(true)
    try {
      const versionNum = calculateVersion(instructions)
      const aiFileName = await generateAIFilename(versionNum)
      
      const response = await fetch('/api/tts/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice,
          instructions,
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
          speed: data.generation?.speed || 1.0,
          instructions,
          fileName: aiFileName,
          audioUrl: data.audioUrl,
          timestamp: new Date(),
          isSaved: false,
          mode: 'advanced'
        }
        
        setVersions([...versions, newVersion])
        toast.success(`Advanced audio v${versionNum} generated successfully!`)
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

      <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <label className="text-lg font-semibold text-gray-800">
            Phone System Script
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {text.length} / 4096 characters
            </span>
            <AITextGenerator 
              onTextGenerated={setText}
              currentText={text}
            />
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-5 border-2 border-gray-300 rounded-lg h-80 resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-lg leading-relaxed bg-white"
          placeholder="Enter your phone system prompt text here or use AI to generate one..."
          maxLength={4096}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Base Voice</label>
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