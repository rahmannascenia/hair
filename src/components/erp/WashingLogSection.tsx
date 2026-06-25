'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface WashLog {
  id: string;
  washId: string;
  washDate: string;
  operator: string;
  inputKg: number;
  outputKg: number;
  wastageKg: number;
  wastagePct: number;
  chemicalsBdt: number;
  labourBdt: number;
  costPerKgOut: number;
  status: string;
  lot: { lotNo: string; colour: string } | null;
}

interface Lot {
  id: string;
  lotNo: string;
  colour: string;
  washStatus: string;
}

export default function WashingLogSection() {
  const [data, setData] = useState<WashLog[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WashLog | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    lotId: '', washId: '', washDate: '', operator: '', inputKg: '', outputKg: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await erpFetch('/api/wash-logs?limit=200');
      const json = await res.json();
      setData(json.data || []);
    } catch { toast.error('Failed to load wash logs'); }
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
    setForm({ lotId: '', washId: '', washDate: new Date().toISOString().split('T')[0], operator: '', inputKg: '', outputKg: '' });
    setDialogOpen(true);
  };

  const openEdit = (item: WashLog) => {
    setEditing(item);
    setForm({
      lotId: item.lot?.lotNo ? (lots.find((l) => l.lotNo === item.lot?.lotNo)?.id || '') : '',
      washId: item.washId,
      washDate: item.washDate?.split('T')[0] || '',
      operator: item.operator,
      inputKg: String(item.inputKg),
      outputKg: String(item.outputKg),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.lotId || !form.washId || !form.washDate || !form.inputKg || !form.outputKg) {
      toast.error('Fill all required fields'); return;
    }
    const url = editing ? `/api/wash-logs/${editing.id}` : '/api/wash-logs';
    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await erpFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          inputKg: parseFloat(form.inputKg),
          outputKg: parseFloat(form.outputKg),
        }),
      });
      if (res.ok) {
        toast.success(editing ? 'Wash log updated' : 'Wash log created');
        setDialogOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed');
      }
    } catch { toast.error('Request failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this wash log?')) return;
    try {
      const res = await erpFetch(`/api/wash-logs/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Deleted'); fetchData(); }
      else toast.error('Failed to delete');
    } catch { toast.error('Request failed'); }
  };

  const filtered = data.filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.washId?.toLowerCase().includes(s) ||
      d.operator?.toLowerCase().includes(s) ||
      d.lot?.lotNo?.toLowerCase().includes(s)
    );
  });

  const r = (v: number) => Math.round(v * 100) / 100;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1F3864]">Washing & Pre-Processing</h2>
          <p className="text-sm text-muted-foreground">Track wash operations, chemical costs, and wastage rates</p>
        </div>
        <Button onClick={openCreate} className="bg-[#1F3864] hover:bg-[#1F3864]/90">
          <Plus className="h-4 w-4 mr-2" /> Add Wash Log
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by ID, operator, lot..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Wash Records
            <Badge variant="secondary">{filtered.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1F3864] text-white hover:bg-[#1F3864]">
                    <TableHead className="text-white">Wash ID</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Lot</TableHead>
                    <TableHead className="text-white">Operator</TableHead>
                    <TableHead className="text-white text-right">Input (kg)</TableHead>
                    <TableHead className="text-white text-right">Output (kg)</TableHead>
                    <TableHead className="text-white text-right">Wastage (kg)</TableHead>
                    <TableHead className="text-white text-right">Wastage %</TableHead>
                    <TableHead className="text-white text-right">Cost/kg Out</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id} className="border-b">
                      <TableCell className="font-mono text-xs">{d.washId}</TableCell>
                      <TableCell className="text-sm">{d.washDate?.split('T')[0]}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{d.lot?.lotNo}</span>
                          <span className="text-xs text-muted-foreground ml-1">{d.lot?.colour}</span>
                        </div>
                      </TableCell>
                      <TableCell>{d.operator}</TableCell>
                      <TableCell className="text-right font-mono">{r(d.inputKg)}</TableCell>
                      <TableCell className="text-right font-mono">{r(d.outputKg)}</TableCell>
                      <TableCell className="text-right font-mono">{r(d.wastageKg)}</TableCell>
                      <TableCell className="text-right">
                        <span className={d.wastagePct > 0.15 ? 'text-red-600 font-bold' : ''}>
                          {r(d.wastagePct * 100)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">৳{r(d.costPerKgOut)}</TableCell>
                      <TableCell>
                        <Badge variant={d.status === 'INVESTIGATE' ? 'destructive' : 'default'}>
                          {d.status}
                        </Badge>
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
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No wash logs found
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
            <DialogTitle className="text-[#1F3864]">{editing ? 'Edit Wash Log' : 'New Wash Log'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Lot *</Label>
              <Select value={form.lotId} onValueChange={(v) => setForm({ ...form, lotId: v })}>
                <SelectTrigger><SelectValue placeholder="Select lot" /></SelectTrigger>
                <SelectContent>
                  {lots.filter((l) => !editing && l.washStatus !== 'Done').map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.lotNo} — {l.colour}</SelectItem>
                  ))}
                  {editing && lots.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.lotNo} — {l.colour}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Wash ID *</Label>
                <Input value={form.washId} onChange={(e) => setForm({ ...form, washId: e.target.value })} placeholder="W-001" />
              </div>
              <div className="grid gap-2">
                <Label>Date *</Label>
                <Input type="date" value={form.washDate} onChange={(e) => setForm({ ...form, washDate: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Operator *</Label>
              <Input value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} placeholder="Operator name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Input (kg) *</Label>
                <Input type="number" step="0.01" value={form.inputKg} onChange={(e) => setForm({ ...form, inputKg: e.target.value })} placeholder="0.00" />
              </div>
              <div className="grid gap-2">
                <Label>Output (kg) *</Label>
                <Input type="number" step="0.01" value={form.outputKg} onChange={(e) => setForm({ ...form, outputKg: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            {form.inputKg && form.outputKg && parseFloat(form.inputKg) > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p>Wastage: <strong>{r(parseFloat(form.inputKg) - parseFloat(form.outputKg))} kg</strong> ({r(((parseFloat(form.inputKg) - parseFloat(form.outputKg)) / parseFloat(form.inputKg)) * 100)}%)</p>
                <p>Chemicals: <strong>৳{Math.round(parseFloat(form.inputKg) * 12)}</strong> | Labour: <strong>৳{Math.round(parseFloat(form.inputKg) * 8)}</strong></p>
                <p className="text-xs text-muted-foreground">Note: Status auto-set server-side (INVESTIGATE if wastage &gt; 15%)</p>
              </div>
            )}
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