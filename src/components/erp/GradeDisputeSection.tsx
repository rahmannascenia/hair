'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Scale, Plus, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Dispute { id: string; entryId: string; workerId?: string; reason: string; status: string; resolution?: string; createdAt: string; worker?: { name: string; factory?: { name: string } } }
interface Worker { id: string; workerId: string; name: string; factory: { name: string } }

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800', UnderReview: 'bg-blue-100 text-blue-800',
  Upheld: 'bg-emerald-100 text-emerald-800', Overturned: 'bg-red-100 text-red-800',
};

export default function GradeDisputeSection() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ entryId: '', workerId: '', reason: '' });

  const fetchData = useCallback(async () => {
    try {
      const [dRes, wRes] = await Promise.all([fetch('/api/grade-dispute'), fetch('/api/workers?limit=200')]);
      if (dRes.ok) { const d = await dRes.json(); setDisputes(d.data || []); }
      if (wRes.ok) { const d = await wRes.json(); setWorkers(d.data || []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const counts = {
    total: disputes.length, pending: disputes.filter((d) => d.status === 'Pending').length,
    review: disputes.filter((d) => d.status === 'UnderReview').length,
    upheld: disputes.filter((d) => d.status === 'Upheld').length,
    overturned: disputes.filter((d) => d.status === 'Overturned').length,
  };

  const handleFile = async () => {
    if (!form.workerId || !form.reason) { toast.error('Worker and reason required'); return; }
    try {
      await erpFetch('/api/grade-dispute', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: form.entryId, workerId: form.workerId, reason: form.reason }),
      });
      toast.success('Dispute filed'); setDialogOpen(false); setForm({ entryId: '', workerId: '', reason: '' }); fetchData();
    } catch { toast.error('Failed'); }
  };

  const handleReview = async (id: string, status: string) => {
    try {
      await erpFetch('/api/grade-dispute', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, resolution: status === 'Upheld' ? 'Grade upheld after review' : 'Grade overturned, will be re-assessed' }),
      });
      toast.success(`Dispute ${status.toLowerCase()}`); fetchData();
    } catch { toast.error('Failed'); }
  };

  const openNewDispute = () => { setForm({ entryId: '', workerId: '', reason: '' }); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Scale className="h-6 w-6" style={{ color: '#C9A227' }} />
          <h2 className="text-2xl font-bold">Grade Disputes</h2>
        </div>
        <Button onClick={openNewDispute} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />File Dispute</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: counts.total, color: '' },
          { label: 'Pending', value: counts.pending, color: 'text-amber-600' },
          { label: 'Under Review', value: counts.review, color: 'text-blue-600' },
          { label: 'Upheld', value: counts.upheld, color: 'text-emerald-600' },
          { label: 'Overturned', value: counts.overturned, color: 'text-red-600' },
        ].map((c) => (
          <Card key={c.label}><CardContent className="p-4 text-center"><p className={`text-2xl font-bold ${c.color}`}>{c.value}</p><p className="text-xs text-muted-foreground">{c.label}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? <p className="text-muted-foreground py-8 text-center">Loading...</p> : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Worker</TableHead><TableHead className="hidden md:table-cell">Factory</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead><TableHead>Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.worker?.name || d.workerId || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{d.worker?.factory?.name || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{d.reason}</TableCell>
                      <TableCell><Badge className={`text-xs ${statusColors[d.status] || ''}`}>{d.status}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {d.status === 'Pending' && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600" onClick={() => handleReview(d.id, 'Upheld')}><CheckCircle className="h-3 w-3 mr-1" />Uphold</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => handleReview(d.id, 'Overturned')}><XCircle className="h-3 w-3 mr-1" />Overturn</Button>
                          </div>
                        )}
                        {d.status === 'Pending' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600" onClick={() => handleReview(d.id, 'UnderReview')}>Review</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {disputes.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No disputes.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>File Grade Dispute</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <Select value={form.workerId} onValueChange={(v) => setForm({ ...form, workerId: v })}>
              <SelectTrigger><SelectValue placeholder="Select Worker" /></SelectTrigger>
              <SelectContent>
                {workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.workerId} — {w.name} ({w.factory?.name})</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Entry ID (optional)" value={form.entryId} onChange={(e) => setForm({ ...form, entryId: e.target.value })} />
            <Textarea placeholder="Reason for dispute..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleFile} disabled={!form.workerId || !form.reason}>File Dispute</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}