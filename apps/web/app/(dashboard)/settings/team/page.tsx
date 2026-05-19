"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, AvatarFallback, Skeleton } from "@repo/ui";
import { Users, Plus, Mail, Shield, Trash2, UserPlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const roleColors: Record<string, string> = {
  TENANT_OWNER: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  TENANT_ADMIN: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  AGENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  VIEWER: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('AGENT');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const res = await api.get('/team/members');
      setMembers(res.data?.data || res.data || []);
    } catch {
      // Fallback to empty
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post('/team/invite', { email: inviteEmail, role: inviteRole });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail('');
      loadMembers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this team member?')) return;
    try {
      await api.delete(`/team/members/${id}`);
      toast.success('Member removed');
      loadMembers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove member');
    }
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
          <h1 className="text-3xl font-bold text-white tracking-tight">Team Members</h1>
          <p className="text-gray-400 mt-1">Manage your team and their roles.</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl gap-2">
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
          <div className="bg-[#111113] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Invite Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="p-1 hover:bg-white/5 rounded-lg text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
                  placeholder="team@company.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 appearance-none"
                >
                  <option value="TENANT_ADMIN" className="bg-[#111113]">Admin</option>
                  <option value="AGENT" className="bg-[#111113]">Agent</option>
                  <option value="VIEWER" className="bg-[#111113]">Viewer</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowInvite(false)} className="flex-1 border border-white/10 rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={inviting} className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl">
                  {inviting ? 'Sending...' : 'Send Invite'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Member</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Role</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Status</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-white/10">
                        <AvatarFallback className="bg-indigo-500/10 text-indigo-400 text-xs font-bold">
                          {(member.name || member.email || '??').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{member.name || 'Pending'}</p>
                        <p className="text-xs text-zinc-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${roleColors[member.role] || roleColors.VIEWER}`}>
                      {(member.role || '').replace('TENANT_', '')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`} />
                      <span className="text-xs text-zinc-400 capitalize">{member.status || 'active'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {member.role !== 'TENANT_OWNER' && (
                      <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-red-400 h-8 px-2" onClick={() => handleRemove(member.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500 text-sm">
                    No team members yet. Invite your first team member to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
