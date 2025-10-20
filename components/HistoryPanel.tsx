"use client"

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Download, Trash2, Volume2, RefreshCw, Edit } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import ConfirmDialog from './ui/ConfirmDialog'

interface Generation {
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

interface HistoryPanelProps {
  onGenerationSelect?: (generation: Generation) => void
}

export default function HistoryPanel({ onGenerationSelect }: HistoryPanelProps) {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    generation: Generation | null
  }>({ isOpen: false, generation: null })

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/history')
      const data = await response.json()
      setGenerations(data.generations)
      setTotal(data.total)
    } catch (error) {
      toast.error('Failed to load history')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (generation: Generation) => {
    setDeleteConfirm({ isOpen: true, generation })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.generation) return

    try {
      const response = await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteConfirm.generation.id }),
      })

      if (response.ok) {
        toast.success('Generation deleted')
        fetchHistory()
      } else {
        toast.error('Failed to delete generation')
      }
    } catch (error) {
      toast.error('Error deleting generation')
      console.error(error)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, generation: null })
  }

  const handleDownload = (generation: Generation) => {
    const link = document.createElement('a')
    link.href = generation.fileUrl
    link.download = generation.fileName
    link.click()
  }

  const handleEdit = (generation: Generation) => {
    if (onGenerationSelect) {
      onGenerationSelect(generation)
      toast.success('Loaded generation into editor')
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading history...</div>
  }

  if (generations.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">No generations yet</p>
        <Button onClick={fetchHistory} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Generation History ({total})</h3>
        <Button onClick={fetchHistory} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {generations.map((generation) => (
          <div
            key={generation.id}
            className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{generation.fileName}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    generation.mode === 'advanced' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {generation.mode}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {generation.text}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>Voice: {generation.voice}</span>
                  {generation.speed && <span>Speed: {generation.speed}x</span>}
                  <span>{format(new Date(generation.createdAt), 'MMM d, yyyy h:mm a')}</span>
                </div>
                {generation.instructions && (
                  <p className="text-xs text-gray-500 mt-1">
                    Instructions: {generation.instructions}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(generation)}
                  variant="outline"
                  size="icon"
                  title="Edit"
                >
                  <Edit className="h-4 w-4 text-blue-500" />
                </Button>
                <Button
                  onClick={() => window.open(generation.fileUrl, '_blank')}
                  variant="outline"
                  size="icon"
                  title="Play"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleDownload(generation)}
                  variant="outline"
                  size="icon"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleDeleteClick(generation)}
                  variant="outline"
                  size="icon"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Generation"
        message={`Are you sure you want to delete "${deleteConfirm.generation?.fileName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}