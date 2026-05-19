"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@repo/ui";
import { Brain, Save, Trash2, Plus, TestTube, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const providers = [
  { id: 'OPENAI', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'ANTHROPIC', name: 'Anthropic', models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku'] },
  { id: 'GOOGLE', name: 'Google', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
  { id: 'GROQ', name: 'Groq', models: ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768'] },
  { id: 'DEEPSEEK', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { id: 'OPENROUTER', name: 'OpenRouter', models: ['auto', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet'] },
  { id: 'QWEN', name: 'Qwen', models: ['qwen-turbo', 'qwen-plus', 'qwen-max'] },
];

const tones = ['Professional', 'Friendly', 'Casual', 'Formal', 'Helpful', 'Empathetic', 'Custom'];

export default function AISettingsPage() {
  const [provider, setProvider] = useState('OPENAI');
  const [model, setModel] = useState('gpt-4o');
  const [apiKey, setApiKey] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tone, setTone] = useState('Professional');
  const [autoReply, setAutoReply] = useState(true);
  const [confidence, setConfidence] = useState(70);
  const [handoffMessage, setHandoffMessage] = useState('Let me connect you with a human agent who can help you better.');
  const [faqs, setFaqs] = useState<{q: string; a: string}[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  const selectedProvider = providers.find(p => p.id === provider);

  useEffect(() => {
    loadConfig();
    loadFAQs();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await api.get('/ai/config');
      const data = res.data?.data || res.data || {};
      setProvider(data.provider || 'OPENAI');
      setModel(data.model || data.modelChat || 'gpt-4o');
      setInstructions(data.businessOverview || data.instructions || '');
      setTone(data.tone || 'Professional');
      setAutoReply(data.autoReply !== false);
      setConfidence(data.confidenceThreshold || data.confidence || 70);
      setHandoffMessage(data.handoffMessage || 'Let me connect you with a human agent who can help you better.');
      setIsLocked(data.isLocked || false);
      // Don't set API key from response (it's masked)
    } catch (e) {
      // May not have config yet
    } finally {
      setLoading(false);
    }
  };

  const loadFAQs = async () => {
    try {
      const res = await api.get('/ai/faqs');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setFaqs(data.map((f: any) => ({ q: f.question || f.q || '', a: f.answer || f.a || '' })));
      }
    } catch {
      // FAQs may not exist yet
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/ai/config', {
        provider,
        model,
        apiKey: apiKey || undefined,
        businessOverview: instructions,
        tone,
        autoReply,
        confidenceThreshold: confidence,
        handoffMessage,
      });

      // Save FAQs
      for (const faq of faqs) {
        if (faq.q && faq.a) {
          await api.post('/ai/faqs', { question: faq.q, answer: faq.a }).catch(() => {});
        }
      }

      toast.success('AI settings saved');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save AI settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestKey = async () => {
    if (!apiKey) { toast.error('Enter an API key first'); return; }
    setTesting(true);
    try {
      await api.post('/ai/test', { message: 'Hello, test message' });
      toast.success('API key is valid');
    } catch (e: any) {
      toast.error(e?.message || 'API key test failed');
    } finally {
      setTesting(false);
    }
  };

  const addFaq = () => setFaqs([...faqs, { q: '', a: '' }]);
  const removeFaq = (i: number) => setFaqs(faqs.filter((_, idx) => idx !== i));
  const updateFaq = (i: number, field: 'q' | 'a', value: string) => {
    const updated = [...faqs];
    updated[i][field] = value;
    setFaqs(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Configuration</h1>
          <p className="text-gray-400 mt-1">Configure AI behavior for your workspace.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || isLocked} className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {isLocked && (
        <div className="flex items-center gap-3 p-4 rounded-xl border bg-orange-500/10 border-orange-500/20 text-orange-400">
          <Brain className="w-5 h-5" />
          <span className="text-sm font-medium">AI configuration is locked by the platform administrator. Contact support to change settings.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider & Model */}
        <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl">
          <CardHeader className="border-b border-white/5 p-6">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              Provider Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Provider</label>
              <select
                value={provider}
                disabled={isLocked}
                onChange={(e) => {
                  setProvider(e.target.value);
                  const p = providers.find(p => p.id === e.target.value);
                  if (p) setModel(p.models[0]);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 appearance-none disabled:opacity-50"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#0a0a0f]">{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Model</label>
              <select
                value={model}
                disabled={isLocked}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 appearance-none disabled:opacity-50"
              >
                {selectedProvider?.models.map(m => (
                  <option key={m} value={m} className="bg-[#0a0a0f]">{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">API Key (Optional Override)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  disabled={isLocked}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 disabled:opacity-50"
                  placeholder="sk-••••••••••••"
                />
                <Button onClick={handleTestKey} disabled={testing || isLocked} variant="outline" className="border-white/10 rounded-xl px-4">
                  <TestTube className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-zinc-600">Leave empty to use platform shared key</p>
            </div>
          </CardContent>
        </Card>

        {/* Behavior */}
        <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl">
          <CardHeader className="border-b border-white/5 p-6">
            <CardTitle className="text-lg font-semibold text-white">Behavior</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 appearance-none"
              >
                {tones.map(t => (
                  <option key={t} value={t} className="bg-[#0a0a0f]">{t}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-sm font-medium text-white">Auto-Reply</p>
                <p className="text-xs text-zinc-500 mt-0.5">Automatically respond to incoming messages</p>
              </div>
              <button
                onClick={() => setAutoReply(!autoReply)}
                className={`relative w-12 h-6 rounded-full transition-all ${autoReply ? 'bg-indigo-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${autoReply ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Confidence Threshold</label>
                <span className="text-sm font-mono text-indigo-400">{confidence}%</span>
              </div>
              <input
                type="range" min="0" max="100" step="5"
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <p className="text-[10px] text-zinc-600">Below this threshold, the AI hands off to a human agent</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Handoff Message</label>
              <textarea
                value={handoffMessage}
                onChange={(e) => setHandoffMessage(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 text-sm resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Instructions */}
      <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl">
        <CardHeader className="border-b border-white/5 p-6">
          <CardTitle className="text-lg font-semibold text-white">Business Instructions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={5}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 text-sm resize-none"
            placeholder="Describe your business, services, policies, and any specific instructions for the AI..."
          />
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl">
        <CardHeader className="border-b border-white/5 p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white">FAQ Pairs</CardTitle>
            <Button onClick={addFaq} variant="outline" size="sm" className="border-white/10 rounded-xl gap-1 text-xs">
              <Plus className="w-3 h-3" /> Add FAQ
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-1 space-y-2">
                <input
                  value={faq.q}
                  onChange={(e) => updateFaq(i, 'q', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500/50 text-sm"
                  placeholder="Question"
                />
                <textarea
                  value={faq.a}
                  onChange={(e) => updateFaq(i, 'a', e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500/50 text-sm resize-none"
                  placeholder="Answer"
                />
              </div>
              <button onClick={() => removeFaq(i)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors mt-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {faqs.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              <p className="text-sm">No FAQs yet</p>
              <p className="text-xs mt-1">Add question-answer pairs to train your AI</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
