"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Play, Pause, Volume2 } from 'lucide-react'
import { getVoiceInfo } from '@/lib/voices'

interface VoicePreviewProps {
  voice: string
  className?: string
}

export default function VoicePreview({ voice, className = '' }: VoicePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Get pre-generated audio URL
  const voiceInfo = getVoiceInfo(voice)
  const audioUrl = voiceInfo?.sampleUrl

  // Reset playback when voice changes
  useEffect(() => {
    setIsPlaying(false)
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }, [voice])

  // Handle audio playback events
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const handleEnded = () => setIsPlaying(false)
      const handlePause = () => setIsPlaying(false)
      const handlePlay = () => setIsPlaying(true)
      
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('pause', handlePause)
      audio.addEventListener('play', handlePlay)
      
      return () => {
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('pause', handlePause)
        audio.removeEventListener('play', handlePlay)
      }
    }
  }, [audioUrl])

  const togglePlayback = () => {
    const audio = audioRef.current
    if (audio && audioUrl) {
      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={togglePlayback}
        variant="outline"
        size="sm"
        disabled={!audioUrl}
        className="w-full"
      >
        {audioUrl ? (
          <>
            {isPlaying ? (
              <Pause className="mr-2 h-3 w-3" />
            ) : (
              <Play className="mr-2 h-3 w-3" />
            )}
            {isPlaying ? 'Pause' : 'Play'} Sample
          </>
        ) : (
          <>
            <Volume2 className="mr-2 h-3 w-3" />
            No Sample Available
          </>
        )}
      </Button>
      
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl}
          style={{ display: 'none' }}
        />
      )}
    </div>
  )
}