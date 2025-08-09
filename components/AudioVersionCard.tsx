"use client"

import React from 'react'
import { Button } from './ui/button'
import { Play, Pause, Download, ExternalLink, Save, Trash2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export interface AudioVersion {
  id: string
  version: string
  text: string
  textHash: string
  voice: string
  speed: number
  instructions?: string
  fileName: string
  audioUrl: string
  timestamp: Date
  isSaved: boolean
  mode: 'basic' | 'advanced'
}

interface AudioVersionCardProps {
  version: AudioVersion
  onPlay: () => void
  onSave: (version: AudioVersion) => void
  onDelete: (id: string) => void
  isPlaying: boolean
}

export default function AudioVersionCard({ 
  version, 
  onPlay, 
  onSave, 
  onDelete,
  isPlaying 
}: AudioVersionCardProps) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = version.audioUrl
    link.download = version.fileName
    link.click()
    toast.success('Download started')
  }

  const handleOpenInNewTab = () => {
    window.open(version.audioUrl, '_blank')
  }

  const handleSave = () => {
    onSave(version)
  }

  const getVersionBadgeColor = () => {
    if (version.version.includes('.')) {
      return 'bg-blue-100 text-blue-700'
    }
    return 'bg-green-100 text-green-700'
  }

  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-sm font-semibold rounded ${getVersionBadgeColor()}`}>
            v{version.version}
          </span>
          <span className="text-sm text-gray-500">
            {version.fileName}
          </span>
        </div>
        {version.isSaved && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            Saved
          </span>
        )}
      </div>

      <div className="mb-3 space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Clock className="h-3 w-3" />
          {format(new Date(version.timestamp), 'MMM d, h:mm a')}
        </div>
        <div className="text-xs text-gray-600">
          Voice: {version.voice} • Speed: {version.speed}x
        </div>
        {version.mode === 'advanced' && version.instructions && (
          <div className="text-xs text-gray-500 italic">
            Instructions: {version.instructions.substring(0, 50)}...
          </div>
        )}
      </div>

      <audio 
        id={`audio-${version.id}`}
        src={version.audioUrl} 
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          onClick={onPlay}
          size="sm"
          variant="outline"
          className="flex-1"
        >
          {isPlaying ? (
            <>
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-3 w-3 mr-1" />
              Play
            </>
          )}
        </Button>
        
        <Button
          onClick={handleDownload}
          size="icon"
          variant="outline"
          title="Download"
        >
          <Download className="h-3 w-3" />
        </Button>
        
        <Button
          onClick={handleOpenInNewTab}
          size="icon"
          variant="outline"
          title="Open in new tab"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>

        {!version.isSaved && (
          <Button
            onClick={handleSave}
            size="icon"
            variant="outline"
            title="Save to history"
            className="text-green-600 hover:text-green-700"
          >
            <Save className="h-3 w-3" />
          </Button>
        )}

        <Button
          onClick={() => onDelete(version.id)}
          size="icon"
          variant="outline"
          title="Delete"
          className="text-red-500 hover:text-red-600"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}