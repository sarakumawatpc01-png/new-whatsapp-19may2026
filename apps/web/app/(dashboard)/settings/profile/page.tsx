"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Avatar, AvatarFallback } from "@repo/ui";
import { User, Camera, Save, Lock, Bell } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/profile', { name });
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Avatar uploaded');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload avatar');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Profile</h1>
          <p className="text-gray-400 mt-1">Manage your personal information.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Avatar & Name */}
      <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl">
        <CardContent className="p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-white/10">
                <AvatarFallback className="bg-indigo-500/10 text-indigo-400 text-2xl font-bold">
                  {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
              <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              <p className="text-sm text-zinc-500">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-400 outline-none cursor-not-allowed"
              />
              <p className="text-[10px] text-zinc-600">Contact support to change your email address</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl">
        <CardHeader className="border-b border-white/5 p-6">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
                  placeholder="Repeat password"
                />
              </div>
            </div>
            <Button type="submit" variant="outline" className="border-white/10 rounded-xl">
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl">
        <CardHeader className="border-b border-white/5 p-6">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[
            { label: 'Email Notifications', desc: 'Receive email for important updates', value: emailNotifs, setter: setEmailNotifs },
            { label: 'Push Notifications', desc: 'Browser push notifications', value: pushNotifs, setter: setPushNotifs },
            { label: 'Marketing Emails', desc: 'Product updates and feature announcements', value: marketingEmails, setter: setMarketingEmails },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-sm font-medium text-white">{pref.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{pref.desc}</p>
              </div>
              <button
                onClick={() => pref.setter(!pref.value)}
                className={`relative w-12 h-6 rounded-full transition-all ${pref.value ? 'bg-indigo-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${pref.value ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
