'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect } from 'react';
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

interface Phase2Job {
  id: string; jobId: string; date: string; lotId: string; inputKg: number;
  size5Kg: number; size6Kg: number; size8Kg: number; size10Kg: number; size12Kg: number;
  size14Kg: number; size16Kg: number; size18Kg: number; size20Kg: number; size24Kg: number; size30Kg: number;
  totalSizedKg: number; combingLossKg: number; lossPct: number;
  realisableValueBdt: number; costBdt: number; marginBdt: number;
  lot: { lotNo: string; colour: string } | null;
}

interface Lot { id: string; lotNo: string; colour: string; }

const SIZES = [5, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30] as const;
const sizeKey = (s: number) => `size${s}Kg`;

export default function Phase2Section() {
  const [data, setData] = useState<Phase2Job[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Phase2Job | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Record<string, string>>({
    jobId: '', lotId: '', date: '', inputKg: '',
    ...Object.fromEntries(SIZES.map((s) => [sizeKey(s), ''])),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await erpFetch('/api/phase2?limit=200');
      const json = await res.json();
      setData(json.data || []);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  const fetchLots = async () => {
    try {
      const res = await erpFetch('/api/lots?limit=200');
      const json = await res.json();
      setLots(json.data || []);
    } catch {}
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); fetchLots(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ jobId: '', lotId: '', date: new Date().toISOString().split('T')[0], inputKg: '',
      ...Object.fromEntries(SIZES.map((s) => [sizeKey(s), ''])),
    });
    setDialogOpen(true);
  };

  const openEdit = (item: Phase2Job) => {
    setEditing(item);
    setForm({
      jobId: item.jobId, lotId: item.lotId, date: item.date?.split('T')[0] || '',
      inputKg: String(item.inputKg),
      ...Object.fromEntries(SIZES.map((s) => [sizeKey(s), String((item as Record<string, unknown>)[sizeKey(s)] ?? 0)])),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.jobId || !form.lotId || !form.date || !form.inputKg) {
      toast.error('Fill required fields'); return;
    }
    const body: Record<string, unknown> = {
      jobId: form.jobId, lotId: form.lotId, date: new Date(form.date),
      inputKg: parseFloat(form.inputKg),
    };
    SIZES.forEach((s) => { body[sizeKey(s)] = parseFloat(form[sizeKey(s)]) || 0; });

    const url = editing ? `/api/phase2/${editing.id}` : '/api/phase2';
    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await erpFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); fetchData(); }
      else { const err = await res.json(); toast.error(err.error || 'Failed'); }
    } catch { toast.error('Request failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this Phase 2 job?')) return;
    try {
      const res = await erpFetch(`/api/phase2/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Deleted'); fetchData(); }
      else toast.error('Failed');
    } catch { toast.error('Request failed'); }
  };

  const filtered = data.filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return d.jobId?.toLowerCase().includes(s) || d.lot?.lotNo?.toLowerCase().includes(s);
  });

  const r = (v: number) => Math.round(v * 100) / 100;

  const totals = {
    inputKg: r(filtered.reduce((s, d) => s + d.inputKg, 0)),
    totalSizedKg: r(filtered.reduce((s, d) => s + d.totalSizedKg, 0)),
    combingLossKg: r(filtered.reduce((s, d) => s + d.combingLossKg, 0)),
    realisableValueBdt: r(filtered.reduce((s, d) => s + d.realisableValueBdt, 0)),
    costBdt: r(filtered.reduce((s, d) => s + d.costBdt, 0)),
    marginBdt: r(filtered.reduce((s, d) => s + d.marginBdt, 0)),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1F3864]">Phase 2 Production</h2>
          <p className="text-sm text-muted-foreground">Factory processing, size sorting & margin analysis</p>
        </div>
        <Button onClick={openCreate} className="bg-[#1F3864] hover:bg-[#1F3864]/90">
          <Plus className="h-4 w-4 mr-2" /> Add Phase 2 Job
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by job ID, lot..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Sizing & Combing Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1F3864] text-white hover:bg-[#1F3864]">
                    <TableHead className="text-white">Job ID</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Lot</TableHead>
                    <TableHead className="text-white text-right">Input</TableHead>
                    {SIZES.map((s) => <TableHead key={s} className="text-white text-right">{s}&quot;</TableHead>)}
                    <TableHead className="text-white text-right">Total Sized</TableHead>
                    <TableHead className="text-white text-right">Loss%</TableHead>
                    <TableHead className="text-white text-right">Realisable</TableHead>
                    <TableHead className="text-white text-right">Margin</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id} className="border-b">
                      <TableCell className="font-mono text-xs">{d.jobId}</TableCell>
                      <TableCell className="text-sm">{d.date?.split('T')[0]}</TableCell>
                      <TableCell>
                        <span className="font-medium">{d.lot?.lotNo}</span>
                        <span className="text-xs text-muted-foreground ml-1">{d.lot?.colour}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{r(d.inputKg)}</TableCell>
                      {SIZES.map((s) => (
                        <TableCell key={s} className="text-right font-mono text-xs">
                          {r((d as Record<string, unknown>)[sizeKey(s)] as number)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-mono font-medium">{r(d.totalSizedKg)}</TableCell>
                      <TableCell className="text-right font-mono">{r(d.lossPct * 100)}%</TableCell>
                      <TableCell className="text-right font-mono">৳{r(d.realisableValueBdt)}</TableCell>
                      <TableCell className={`text-right font-mono font-bold ${d.marginBdt >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ৳{r(d.marginBdt)}
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
                  {filtered.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={3} className="text-[#1F3864]">TOTALS ({filtered.length})</TableCell>
                      <TableCell className="text-right font-mono">{totals.inputKg}</TableCell>
                      {SIZES.map((s) => (
                        <TableCell key={s} className="text-right font-mono text-xs">
                          {r(filtered.reduce((sum, d) => sum + ((d as Record<string, unknown>)[sizeKey(s)] as number), 0))}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-mono">{totals.totalSizedKg}</TableCell>
                      <TableCell className="text-right font-mono">{totals.inputKg > 0 ? r((totals.combingLossKg / totals.inputKg) * 100) : 0}%</TableCell>
                      <TableCell className="text-right font-mono">৳{totals.realisableValueBdt}</TableCell>
                      <TableCell className={`text-right font-mono ${totals.marginBdt >= 0 ? 'text-green-600' : 'text-red-600'}`}>৳{totals.marginBdt}</TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={SIZES.length + 9} className="text-center py-8 text-muted-foreground">
                        No Phase 2 jobs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Input', value: `${totals.inputKg} kg`, color: '' },
            { label: 'Total Sized', value: `${totals.totalSizedKg} kg`, color: '' },
            { label: 'Realisable Value', value: `৳${totals.realisableValueBdt}`, color: 'text-green-700' },
            { label: 'Total Margin', value: `৳${totals.marginBdt}`, color: totals.marginBdt >= 0 ? 'text-green-700' : 'text-red-600' },
          ].map((c) => (
            <Card key={c.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1F3864]">{editing ? 'Edit Phase 2 Job' : 'New Phase 2 Job'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Job ID *</Label>
                <Input value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value })} placeholder="P2-001" />
              </div>
              <div className="grid gap-2">
                <Label>Lot *</Label>
                <Select value={form.lotId} onValueChange={(v) => setForm({ ...form, lotId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select lot" /></SelectTrigger>
                  <SelectContent>
                    {lots.map((l) => <SelectItem key={l.id} value={l.id}>{l.lotNo} — {l.colour}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Input (kg) *</Label>
              <Input type="number" step="0.01" value={form.inputKg} onChange={(e) => setForm({ ...form, inputKg: e.target.value })} />
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-sm font-medium mb-3 text-[#1F3864]">Size Distribution (kg)</p>
              <div className="grid grid-cols-4 gap-3">
                {SIZES.map((s) => (
                  <div key={s} className="grid gap-1">
                    <Label className="text-xs">{s}&quot;</Label>
                    <Input type="number" step="0.01" placeholder="0"
                      value={form[sizeKey(s)] || ''} onChange={(e) => setForm({ ...form, [sizeKey(s)]: e.target.value })}
                      className="h-8 text-sm" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              Total sized, combing loss, realisable value, and margin are auto-computed server-side from the size pricing master.
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