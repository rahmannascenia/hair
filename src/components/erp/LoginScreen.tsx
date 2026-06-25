'use client';
import React, { useState } from 'react';
import { useErpStore } from '@/lib/store';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function LoginScreen() {
  const { setUser, setActiveSection } = useErpStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password }) });
      const data = await res.json();
      if (res.ok && data.user) { setUser(data.user); setActiveSection('dashboard'); toast.success(`Welcome, ${data.user.displayName}!`); }
      else toast.error('Invalid credentials');
    } catch { toast.error('Connection error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1F3864 0%, #0f1f3a 100%)' }}>
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="items-center text-center pb-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#C9A227' }}><span className="text-white font-bold text-2xl">BI</span></div>
          <CardTitle className="text-2xl" style={{ color: '#1F3864' }}>Barendra International</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">ERP System</p>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" disabled={loading} /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" disabled={loading} /></div>
            <Button type="submit" className="w-full text-white font-semibold h-11 cursor-pointer" style={{ backgroundColor: '#C9A227' }} disabled={loading || !username.trim() || !password.trim()}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Login'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground mb-2">Demo Credentials (9 roles with different access levels)</p>
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="text-xs w-full max-w-sm mx-auto">
                <thead><tr className="text-left text-muted-foreground border-b"><th className="py-1 pr-3">Username</th><th className="py-1 pr-3">Password</th><th className="py-1">Role</th></tr></thead>
                <tbody>
                  {[['owner','owner123','Owner — Full access'],
                    ['admin','admin123','Admin — Full except owner-only'],
                    ['pm','pm123','PM — Production, no financials'],
                    ['accountant','acc123','Accountant — Financials only'],
                    ['head1','head123','Head Leader — Territory read'],
                    ['supervisor1','sup123','Supervisor — Factory only'],
                    ['ll1','ll123','Line Leader — Territory daily'],
                    ['qc1','qc123','QC — Grading only'],
                    ['viewer','viewer123','Viewer — Read-only']
                  ].map(([u,p,r], i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/50 cursor-pointer" onClick={() => { setUsername(u as string); setPassword(p as string); }}>
                      <td className="py-1 pr-3 font-mono" style={{ color: '#C9A227' }}>{u}</td>
                      <td className="py-1 pr-3 font-mono text-muted-foreground">{p}</td>
                      <td className="py-1 text-muted-foreground">{r}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}