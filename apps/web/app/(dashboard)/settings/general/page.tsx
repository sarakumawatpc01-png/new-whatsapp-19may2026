"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@repo/ui";
import { Building2, Save, Globe, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const timezones = [
  'Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 
  'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney'
];

export default function GeneralSettingsPage() {
  const [companyName, setCompanyName] = useState('Acme Corporation');
  const [website, setWebsite] = useState('https://acme.com');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [awayMessage, setAwayMessage] = useState('Thanks for reaching out! We are currently away and will respond during business hours.');
  const [businessHoursStart, setBusinessHoursStart] = useState('09:00');
  const [businessHoursEnd, setBusinessHoursEnd] = useState('18:00');
  const [workDays, setWorkDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings/general');
      const data = res.data?.data || res.data || {};
      if (data.companyName) setCompanyName(data.companyName);
      if (data.website) setWebsite(data.website);
      if (data.timezone) setTimezone(data.timezone);
      if (data.awayMessage) setAwayMessage(data.awayMessage);
      if (data.businessHoursStart) setBusinessHoursStart(data.businessHoursStart);
      if (data.businessHoursEnd) setBusinessHoursEnd(data.businessHoursEnd);
      if (data.workDays) setWorkDays(data.workDays);
    } catch { /* first load may not have data */ }
    finally { setLoading(false); }
  };

  const toggleDay = (day: string) => {
    setWorkDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/general', {
        companyName, website, timezone, awayMessage,
        businessHoursStart, businessHoursEnd, workDays,
      });
      toast.success('Settings saved');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">General Settings</h1>
          <p className="text-gray-400 mt-1">Configure your workspace basics.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Company Info */}
      <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl">
        <CardHeader className="border-b border-white/5 p-6">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
              placeholder="https://yourcompany.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 appearance-none"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz} className="bg-[#0a0a0f]">{tz}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl">
        <CardHeader className="border-b border-white/5 p-6">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Business Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Working Days</label>
            <div className="flex gap-2">
              {allDays.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    workDays.includes(day) 
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                      : 'bg-white/5 text-zinc-500 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Start Time</label>
              <input
                type="time"
                value={businessHoursStart}
                onChange={(e) => setBusinessHoursStart(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">End Time</label>
              <input
                type="time"
                value={businessHoursEnd}
                onChange={(e) => setBusinessHoursEnd(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Away Message</label>
            <textarea
              value={awayMessage}
              onChange={(e) => setAwayMessage(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 text-sm resize-none"
              placeholder="Message sent outside business hours..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
