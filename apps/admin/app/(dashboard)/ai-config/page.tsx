'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Badge } from '@repo/ui/components/badge'
import { 
  Brain, 
  Save, 
  Lock, 
  Unlock, 
  TestTube,
  Loader2,
  Eye,
  EyeOff,
  Plus,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

const providers = [
  { id: 'OPENAI', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'] },
  { id: 'ANTHROPIC', name: 'Anthropic', models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku'] },
  { id: 'GOOGLE', name: 'Google', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'] },
  { id: 'GROQ', name: 'Groq', models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'] },
  { id: 'DEEPSEEK', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { id: 'OPENROUTER', name: 'OpenRouter', models: ['auto', 'openai/gpt-4o', 'meta-llama/llama-3.1-405b', 'anthropic/claude-3.5-sonnet'] },
  { id: 'QWEN', name: 'Qwen', models: ['qwen-turbo', 'qwen-plus', 'qwen-max'] },
]

const aiTasks = [
  { key: 'auto_reply', label: 'Auto Reply', desc: 'Handles inbound customer messages' },
  { key: 'document_analysis', label: 'Document Analysis', desc: 'Processes uploaded documents' },
  { key: 'translation', label: 'Translation', desc: 'Translates messages between languages' },
  { key: 'summary', label: 'Summarization', desc: 'Generates conversation summaries' },
  { key: 'classification', label: 'Classification', desc: 'Classifies intent and sentiment' },
]

export default function AIConfigPage() {
  const [configs, setConfigs] = useState<any[]>([])
  const [defaultProvider, setDefaultProvider] = useState('OPENAI')
  const [defaultModel, setDefaultModel] = useState('gpt-4o')
  const [isLocked, setIsLocked] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful WhatsApp business assistant.')
  const [maxTokens, setMaxTokens] = useState(2048)
  const [temperature, setTemperature] = useState(0.7)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [taskModels, setTaskModels] = useState<Record<string, { provider: string; model: string }>>({})

  const selectedProvider = providers.find(p => p.id === defaultProvider)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await api.get('/admin/ai-config')
      const data = res.data || res
      const configList = Array.isArray(data) ? data : (data.data || [])
      setConfigs(configList)
      
      // Find default config
      const defaultConfig = configList.find((c: any) => c.isDefault) || configList[0]
      if (defaultConfig) {
        setDefaultProvider(defaultConfig.provider || 'OPENAI')
        setDefaultModel(defaultConfig.modelChat || 'gpt-4o')
        setIsLocked(defaultConfig.isLocked || false)
        setSystemPrompt(defaultConfig.systemPrompt || 'You are a helpful WhatsApp business assistant.')
        setMaxTokens(defaultConfig.maxTokens || 2048)
        setTemperature(defaultConfig.temperature || 0.7)
        if (defaultConfig.taskModels) {
          try {
            setTaskModels(typeof defaultConfig.taskModels === 'string' ? JSON.parse(defaultConfig.taskModels) : defaultConfig.taskModels)
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (e) {
      // May not have configs yet, that's ok
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/ai-config', {
        provider: defaultProvider,
        modelChat: defaultModel,
        isDefault: true,
        isLocked,
        systemPrompt,
        maxTokens,
        temperature,
        taskModels: JSON.stringify(taskModels),
      })
      toast.success('AI configuration saved')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save AI configuration')
    } finally {
      setSaving(false)
    }
  }

  const updateTaskModel = (taskKey: string, field: 'provider' | 'model', value: string) => {
    setTaskModels(prev => {
      const existing = prev[taskKey] || { provider: defaultProvider, model: defaultModel }
      const updated = { ...existing, [field]: value }
      // Auto-select first model when provider changes
      if (field === 'provider') {
        const p = providers.find(p => p.id === value)
        if (p) updated.model = p.models[0]
      }
      return { ...prev, [taskKey]: updated }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Configuration</h1>
          <p className="text-zinc-500 mt-1">Global AI provider and model settings for the platform.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Selection */}
        <Card className="bg-[#111113] border-white/5 rounded-2xl">
          <CardHeader className="border-b border-white/5 p-6">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              Default Provider
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Provider</label>
              <select 
                value={defaultProvider}
                onChange={(e) => {
                  setDefaultProvider(e.target.value)
                  const p = providers.find(p => p.id === e.target.value)
                  if (p) setDefaultModel(p.models[0])
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 appearance-none"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#111113]">{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Default Model</label>
              <select 
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 appearance-none"
              >
                {selectedProvider?.models.map(m => (
                  <option key={m} value={m} className="bg-[#111113]">{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-sm font-medium text-white">Lock Configuration</p>
                <p className="text-xs text-zinc-500 mt-0.5">Prevent tenants from overriding AI settings</p>
              </div>
              <button
                onClick={() => setIsLocked(!isLocked)}
                className={`p-2 rounded-lg transition-all ${isLocked ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}
              >
                {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Parameters */}
        <Card className="bg-[#111113] border-white/5 rounded-2xl">
          <CardHeader className="border-b border-white/5 p-6">
            <CardTitle className="text-lg font-semibold text-white">Parameters</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Max Tokens</label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Temperature</label>
                <span className="text-sm font-mono text-indigo-400">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 font-medium">
                <span>Precise</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Task Model Assignment */}
      <Card className="bg-[#111113] border-white/5 rounded-2xl">
        <CardHeader className="border-b border-white/5 p-6">
          <CardTitle className="text-lg font-semibold text-white">Per-Task Model Assignment</CardTitle>
          <p className="text-xs text-zinc-500 mt-1">Assign different providers and models to specific AI tasks. Leave empty to use default.</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {aiTasks.map(task => {
              const taskConfig = taskModels[task.key] || { provider: '', model: '' }
              const taskProvider = providers.find(p => p.id === taskConfig.provider) || selectedProvider
              return (
                <div key={task.key} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-sm font-medium text-white">{task.label}</p>
                    <p className="text-[10px] text-zinc-500">{task.desc}</p>
                  </div>
                  <select
                    value={taskConfig.provider || ''}
                    onChange={(e) => updateTaskModel(task.key, 'provider', e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50 appearance-none min-w-[130px]"
                  >
                    <option value="" className="bg-[#111113]">Default</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#111113]">{p.name}</option>
                    ))}
                  </select>
                  <select
                    value={taskConfig.model || ''}
                    onChange={(e) => updateTaskModel(task.key, 'model', e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50 appearance-none min-w-[180px]"
                  >
                    <option value="" className="bg-[#111113]">Default</option>
                    {(taskProvider?.models || []).map(m => (
                      <option key={m} value={m} className="bg-[#111113]">{m}</option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card className="bg-[#111113] border-white/5 rounded-2xl">
        <CardHeader className="border-b border-white/5 p-6">
          <CardTitle className="text-lg font-semibold text-white">Global System Prompt</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 font-mono text-sm resize-none"
            placeholder="Enter the global system prompt that applies to all tenants..."
          />
          <p className="text-xs text-zinc-500 mt-2">This prompt is prepended to all AI conversations across the platform.</p>
        </CardContent>
      </Card>
    </div>
  )
}
