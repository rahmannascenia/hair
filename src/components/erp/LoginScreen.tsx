'use client';

import { useState } from 'react';
import { useErpStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CREDENTIALS = [
  { username: 'owner', password: 'owner123', role: 'Owner' },
  { username: 'admin', password: 'admin123', role: 'Admin' },
  { username: 'pm', password: 'pm123', role: 'Project Manager' },
  { username: 'accountant', password: 'acc123', role: 'Accountant' },
  { username: 'head1', password: 'head123', role: 'Head Leader' },
  { username: 'supervisor1', password: 'sup123', role: 'Supervisor' },
  { username: 'll1', password: 'll123', role: 'Line Leader' },
  { username: 'qc1', password: 'qc123', role: 'QC Inspector' },
  { username: 'viewer', password: 'viewer123', role: 'Viewer' },
];

export default function LoginScreen() {
  const { setUser, setActiveSection } = useErpStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        return;
      }
      setUser(data.user);
      setActiveSection('dashboard');
      toast.success(`Welcome, ${data.user.displayName}!`);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1F3864 0%, #0F1D36 50%, #1F3864 100%)' }}>
      <div className="w-full max-w-md space-y-6">
        {/* Logo Card */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C9A227' }}>
              <span className="text-white font-bold text-2xl">BI</span>
            </div>
            <CardTitle className="text-xl" style={{ color: '#1F3864' }}>
              Barendra International
            </CardTitle>
            <p className="text-sm text-muted-foreground">Human Hair Wig Manufacturing ERP</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full text-white"
                style={{ backgroundColor: '#1F3864' }}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Credential Table */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground text-center mb-3 font-medium">Demo Credentials</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 pr-2 font-medium text-muted-foreground">Username</th>
                    <th className="text-left py-1.5 pr-2 font-medium text-muted-foreground">Password</th>
                    <th className="text-left py-1.5 font-medium text-muted-foreground">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {CREDENTIALS.map((c) => (
                    <tr key={c.username} className="border-b border-muted/50 cursor-pointer hover:bg-muted/50" onClick={() => { setUsername(c.username); setPassword(c.password); }}>
                      <td className="py-1.5 pr-2 font-mono">{c.username}</td>
                      <td className="py-1.5 pr-2 font-mono">{c.password}</td>
                      <td className="py-1.5">{c.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}