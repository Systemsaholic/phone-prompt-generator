"use client"

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { FileText, Plus, Edit, Trash2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface Template {
  id: string
  name: string
  category: string
  content: string
  variables: string
  isDefault: boolean
}

interface TemplateManagerProps {
  onTemplateSelect: (text: string) => void
}

export default function TemplateManager({ onTemplateSelect }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      toast.error('Failed to load templates')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    const vars = JSON.parse(template.variables)
    const initialVars: Record<string, string> = {}
    vars.forEach((v: string) => {
      initialVars[v] = ''
    })
    setVariables(initialVars)
  }

  const applyTemplate = () => {
    if (!selectedTemplate) return

    let text = selectedTemplate.content
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      text = text.replace(regex, value || `{${key}}`)
    })

    onTemplateSelect(text)
    toast.success('Template applied!')
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, Template[]>)

  if (loading) {
    return <div className="p-8 text-center">Loading templates...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Templates</h3>
          <div className="space-y-4">
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-600 uppercase mb-2">
                  {category.replace('_', ' ')}
                </h4>
                <div className="space-y-2">
                  {categoryTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{template.name}</span>
                        </div>
                        {template.isDefault && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {selectedTemplate ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customize Template</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">{selectedTemplate.name}</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {selectedTemplate.content}
                </p>
              </div>

              {Object.keys(variables).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Fill in Variables:</h4>
                  {Object.keys(variables).map((variable) => (
                    <div key={variable}>
                      <label className="block text-sm font-medium mb-1">
                        {variable.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </label>
                      <input
                        type="text"
                        value={variables[variable]}
                        onChange={(e) =>
                          setVariables((prev) => ({
                            ...prev,
                            [variable]: e.target.value,
                          }))
                        }
                        className="w-full p-2 border rounded-lg"
                        placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={applyTemplate} className="w-full">
                <Check className="mr-2 h-4 w-4" />
                Apply Template
              </Button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a template to customize</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}