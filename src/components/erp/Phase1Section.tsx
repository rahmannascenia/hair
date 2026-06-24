'use client';

import { useState, useEffect, Fragment } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Distribution {
  id: string;
  handoffId: string;
  date: string;
  fromRole: string;
  fromName: string;
  toRole: string;
  toName: string;
  lotId: string;
  qtyKg: number;
  cumulativeKg: number;
  tierMultiplier: number;
  status: string;
  lot: { lotNo: string; colour: string } | null;
}

interface Lot { id: string; lotNo: string; colour: string; rawWeightKg: number; distributedKg: number; }

export default function Phase1Section() {
  const [data, setData] = useState<Distribution[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Distribution | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    handoffId: '', date: '', fromRole: 'PM', fromName: '', toRole: 'Head Leader',
    toName: '', lotId: '', qtyKg: '', cumulativeKg: '', tierMultiplier: '1', status: 'OK',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/distributions?limit=200');
      const json = await res.json();
      setData(json.data || []);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  const fetchLots = async () => {
    try {
      const res = await fetch('/api/lots?limit=200');
      const json = await res.json();
      setLots(json.data || []);
    } catch {}
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); fetchLots(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ handoffId: '', date: new Date().toISOString().split('T')[0], fromRole: 'PM', fromName: '', toRole: 'Head Leader', toName: '', lotId: '', qtyKg: '', cumulativeKg: '', tierMultiplier: '1', status: 'OK' });
    setDialogOpen(true);
  };

  const openEdit = (item: Distribution) => {
    setEditing(item);
    setForm({
      handoffId: item.handoffId, date: item.date?.split('T')[0] || '', fromRole: item.fromRole,
      fromName: item.fromName, toRole: item.toRole, toName: item.toName,
      lotId: item.lotId, qtyKg: String(item.qtyKg), cumulativeKg: String(item.cumulativeKg),
      tierMultiplier: String(item.tierMultiplier), status: item.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.handoffId || !form.date || !form.fromName || !form.toName || !form.lotId || !form.qtyKg) {
      toast.error('Fill all required fields'); return;
    }
    const url = editing ? `/api/distributions/${editing.id}` : '/api/distributions';
    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          qtyKg: parseFloat(form.qtyKg),
          cumulativeKg: parseFloat(form.cumulativeKg) || 0,
          tierMultiplier: parseInt(form.tierMultiplier) || 1,
        }),
      });
      if (res.ok) { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); fetchData(); }
      else { const err = await res.json(); toast.error(err.error || 'Failed'); }
    } catch { toast.error('Request failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this distribution record?')) return;
    try {
      const res = await fetch(`/api/distributions/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Deleted'); fetchData(); }
      else toast.error('Failed');
    } catch { toast.error('Request failed'); }
  };

  const filtered = data.filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return d.handoffId?.toLowerCase().includes(s) || d.fromName?.toLowerCase().includes(s) ||
      d.toName?.toLowerCase().includes(s) || d.lot?.lotNo?.toLowerCase().includes(s);
  });

  // Group by lot for display
  const grouped = filtered.reduce<Record<string, Distribution[]>>((acc, d) => {
    const key = d.lotId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const roles = ['PM', 'Head Leader', 'Line Leader', 'Supervisor', 'Worker'];
  const statuses = ['OK', 'Delayed', 'Short'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1F3864]">Phase 1 Distribution</h2>
          <p className="text-sm text-muted-foreground">Material handoff tracking across the 5-tier hierarchy</p>
        </div>
        <Button onClick={openCreate} className="bg-[#1F3864] hover:bg-[#1F3864]/90">
          <Plus className="h-4 w-4 mr-2" /> Add Distribution
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by handoff ID, name, lot..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Handoff Records
            <Badge variant="secondary">{filtered.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1F3864] text-white hover:bg-[#1F3864]">
                    <TableHead className="text-white">Lot</TableHead>
                    <TableHead className="text-white">Handoff ID</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">From</TableHead>
                    <TableHead className="text-white">To</TableHead>
                    <TableHead className="text-white text-right">Qty (kg)</TableHead>
                    <TableHead className="text-white text-right">Cumulative</TableHead>
                    <TableHead className="text-white text-center">Tier</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(grouped).map(([lotId, items]) => (
                    <Fragment key={lotId}>
                      {items.map((d, idx) => (
                        <TableRow key={d.id} className="border-b">
                          {idx === 0 && (
                            <TableCell rowSpan={items.length} className="font-medium align-top bg-muted/30">
                              <div className="font-mono text-sm">{d.lot?.lotNo}</div>
                              <div className="text-xs text-muted-foreground">{d.lot?.colour}</div>
                            </TableCell>
                          )}
                          <TableCell className="font-mono text-xs">{d.handoffId}</TableCell>
                          <TableCell className="text-sm">{d.date?.split('T')[0]}</TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">{d.fromRole}</div>
                            <div className="font-medium">{d.fromName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">{d.toRole}</div>
                            <div className="font-medium">{d.toName}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono">{d.qtyKg}</TableCell>
                          <TableCell className="text-right font-mono">{d.cumulativeKg}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[#C9A227] border-[#C9A227]">×{d.tierMultiplier}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={d.status === 'OK' ? 'default' : 'destructive'}>{d.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(d)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => handleDelete(d.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No distribution records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1F3864]">{editing ? 'Edit Distribution' : 'New Distribution'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Handoff ID *</Label>
                <Input value={form.handoffId} onChange={(e) => setForm({ ...form, handoffId: e.target.value })} placeholder="HO-001" />
              </div>
              <div className="grid gap-2">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Lot *</Label>
              <Select value={form.lotId} onValueChange={(v) => setForm({ ...form, lotId: v })}>
                <SelectTrigger><SelectValue placeholder="Select lot" /></SelectTrigger>
                <SelectContent>
                  {lots.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.lotNo} — {l.colour} ({l.rawWeightKg} kg)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>From Role</Label>
                <Select value={form.fromRole} onValueChange={(v) => setForm({ ...form, fromRole: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>From Name *</Label>
                <Input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>To Role</Label>
                <Select value={form.toRole} onValueChange={(v) => setForm({ ...form, toRole: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>To Name *</Label>
                <Input value={form.toName} onChange={(e) => setForm({ ...form, toName: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Qty (kg) *</Label>
                <Input type="number" step="0.01" value={form.qtyKg} onChange={(e) => setForm({ ...form, qtyKg: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Cumulative (kg)</Label>
                <Input type="number" step="0.01" value={form.cumulativeKg} onChange={(e) => setForm({ ...form, cumulativeKg: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Tier Multiplier</Label>
                <Input type="number" value={form.tierMultiplier} onChange={(e) => setForm({ ...form, tierMultiplier: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-[#1F3864] hover:bg-[#1F3864]/90">
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}