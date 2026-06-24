'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Bucket { id: string; name: string; weightKg: number; valueBdt: number; unitCostPerKg: number; pctOfTotal: number; }
interface BucketRaw { id: string; bucketName: string; weightKg: number; valueBdt: number; }

export default function InventorySection() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [rawBuckets, setRawBuckets] = useState<BucketRaw[]>([]);
  const [totals, setTotals] = useState({ weightKg: 0, valueBdt: 0, valueUsd: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BucketRaw | null>(null);
  const [form, setForm] = useState({ bucketName: '', weightKg: '', valueBdt: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, rawRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/inventory-buckets'),
      ]);
      const invJson = await invRes.json();
      const rawJson = await rawRes.json();
      setBuckets(invJson.buckets || []);
      setTotals(invJson.totals || { weightKg: 0, valueBdt: 0, valueUsd: 0 });
      setRawBuckets(rawJson.data || []);
    } catch { toast.error('Failed to load inventory'); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ bucketName: '', weightKg: '', valueBdt: '' });
    setDialogOpen(true);
  };

  const openEdit = (item: BucketRaw) => {
    setEditing(item);
    setForm({ bucketName: item.bucketName, weightKg: String(item.weightKg), valueBdt: String(item.valueBdt) });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.bucketName) { toast.error('Bucket name required'); return; }
    try {
      if (editing) {
        const res = await fetch('/api/inventory-buckets', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, bucketName: form.bucketName, weightKg: parseFloat(form.weightKg) || 0, valueBdt: parseFloat(form.valueBdt) || 0 }),
        });
        if (res.ok) { toast.success('Updated'); setDialogOpen(false); fetchData(); }
        else toast.error('Failed');
      } else {
        const res = await fetch('/api/inventory-buckets', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucketName: form.bucketName, weightKg: parseFloat(form.weightKg) || 0, valueBdt: parseFloat(form.valueBdt) || 0 }),
        });
        if (res.ok) { toast.success('Created'); setDialogOpen(false); fetchData(); }
        else toast.error('Failed');
      }
    } catch { toast.error('Request failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this inventory bucket?')) return;
    const res = await fetch(`/api/inventory-buckets?id=${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); fetchData(); }
    else toast.error('Failed');
  };

  const r = (v: number) => Math.round(v * 100) / 100;
  const chartData = buckets.map((b) => ({ name: b.name, value: r(b.valueBdt) }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1F3864]">8-Bucket Inventory</h2>
          <p className="text-sm text-muted-foreground">Inventory tracking across 8 production stages</p>
        </div>
        <Button onClick={openCreate} className="bg-[#1F3864] hover:bg-[#1F3864]/90">
          <Plus className="h-4 w-4 mr-2" /> Add Bucket
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Inventory Buckets</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1F3864] text-white hover:bg-[#1F3864]">
                    <TableHead className="text-white">Bucket</TableHead>
                    <TableHead className="text-white text-right">Weight (kg)</TableHead>
                    <TableHead className="text-white text-right">Value (BDT)</TableHead>
                    <TableHead className="text-white text-right">Unit Cost/kg</TableHead>
                    <TableHead className="text-white">% of Total</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buckets.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="text-right font-mono">{r(b.weightKg)}</TableCell>
                      <TableCell className="text-right font-mono">৳{r(b.valueBdt).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">{b.weightKg > 0 ? `৳${r(b.valueBdt / b.weightKg)}` : '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-[#C9A227] rounded-full" style={{ width: `${Math.min(b.pctOfTotal, 100)}%` }} />
                          </div>
                          <span className="text-sm font-mono">{r(b.pctOfTotal)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(rawBuckets.find((rb) => rb.id === b.id) || b)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => handleDelete(b.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Inventory Value Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Value BDT']} />
                <Bar dataKey="value" fill="#C9A227" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card className="bg-[#1F3864] text-white">
        <CardContent className="p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs opacity-80">Total Weight</p>
            <p className="text-xl font-bold">{r(totals.weightKg)} kg</p>
          </div>
          <div>
            <p className="text-xs opacity-80">Total Value (BDT)</p>
            <p className="text-xl font-bold">৳{r(totals.valueBdt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs opacity-80">Total Value (USD)</p>
            <p className="text-xl font-bold">${r(totals.valueUsd).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1F3864]">{editing ? 'Edit Bucket' : 'New Bucket'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Bucket Name *</Label>
              <Input value={form.bucketName} onChange={(e) => setForm({ ...form, bucketName: e.target.value })} placeholder="e.g. Raw Material" disabled={!!editing} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.01" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Value (BDT)</Label>
                <Input type="number" step="0.01" value={form.valueBdt} onChange={(e) => setForm({ ...form, valueBdt: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-[#1F3864] hover:bg-[#1F3864]/90">{editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}