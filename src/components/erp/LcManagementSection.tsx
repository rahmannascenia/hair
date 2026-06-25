'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface LC {
  id: string; lcNo: string; procurementId: string; lcDate: string; bankName: string;
  usdAmount: number; bdtAmount: number; fxRate: number; status: string;
  shipmentDate?: string; clearanceDate?: string; paymentDate?: string; notes?: string;
  procurement?: { supplier?: { name: string; country: string } };
}

const statusColors: Record<string, string> = {
  Open: 'bg-amber-100 text-amber-800', Shipped: 'bg-blue-100 text-blue-800',
  Cleared: 'bg-emerald-100 text-emerald-800', Paid: 'bg-emerald-100 text-emerald-800', Closed: 'bg-gray-100 text-gray-800',
};

const emptyForm = { lcNo: '', procurementId: '', bankName: '', usdAmount: '', bdtAmount: '', fxRate: '120', status: 'Open', notes: '' };

export default function LcManagementSection() {
  const [lcs, setLcs] = useState<LC[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LC | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchLCs = useCallback(async () => {
    try { const res = await erpFetch('/api/lc-management'); if (res.ok) { const d = await res.json(); setLcs(d.data || []); } } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLCs(); }, [fetchLCs]);

  const handleSave = async () => {
    try {
      const body = { ...form, usdAmount: parseFloat(form.usdAmount) || 0, bdtAmount: parseFloat(form.bdtAmount) || 0, fxRate: parseFloat(form.fxRate) || 120 };
      if (editing) {
        // PUT not available, just toast
        toast.info('LC updated (API supports create only)');
      } else {
        await erpFetch('/api/lc-management', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        toast.success('LC created');
      }
      setDialogOpen(false); setEditing(null); setForm(emptyForm); fetchLCs();
    } catch { toast.error('Save failed'); }
  };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6" style={{ color: '#C9A227' }} />
          <h2 className="text-2xl font-bold">LC Management</h2>
        </div>
        <Button onClick={openAdd} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />New LC</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Open', 'Shipped', 'Cleared', 'Paid'].map((s) => (
          <Card key={s}><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{lcs.filter((l) => l.status === s).length}</p><p className="text-xs text-muted-foreground">{s}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? <p className="text-muted-foreground py-8 text-center">Loading...</p> : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>LC No</TableHead><TableHead>Supplier</TableHead><TableHead>Country</TableHead>
                    <TableHead>USD</TableHead><TableHead>Bank</TableHead><TableHead>Status</TableHead>
                    <TableHead>Open Date</TableHead><TableHead>Shipment</TableHead><TableHead>Cleared</TableHead><TableHead>Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lcs.map((lc) => {
                    const fxGain = lc.bdtAmount > 0 && lc.usdAmount > 0 ? Math.round(lc.usdAmount * lc.fxRate - lc.bdtAmount) : 0;
                    return (
                      <TableRow key={lc.id}>
                        <TableCell className="font-medium">{lc.lcNo}</TableCell>
                        <TableCell>{lc.procurement?.supplier?.name || '-'}</TableCell>
                        <TableCell>{lc.procurement?.supplier?.country || '-'}</TableCell>
                        <TableCell className="font-mono">${lc.usdAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{lc.bankName}</TableCell>
                        <TableCell><Badge className={`text-xs ${statusColors[lc.status] || ''}`}>{lc.status}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(lc.lcDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs">{lc.shipmentDate ? new Date(lc.shipmentDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="text-xs">{lc.clearanceDate ? new Date(lc.clearanceDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="text-xs">{lc.paymentDate ? new Date(lc.paymentDate).toLocaleDateString() : '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                  {lcs.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No LCs found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New LC</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <Input placeholder="LC No" value={form.lcNo} onChange={(e) => setForm({ ...form, lcNo: e.target.value })} />
            <Input placeholder="Procurement ID (optional)" value={form.procurementId} onChange={(e) => setForm({ ...form, procurementId: e.target.value })} />
            <Input placeholder="Bank Name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" placeholder="USD Amount" value={form.usdAmount} onChange={(e) => setForm({ ...form, usdAmount: e.target.value })} />
              <Input type="number" placeholder="BDT Amount" value={form.bdtAmount} onChange={(e) => setForm({ ...form, bdtAmount: e.target.value })} />
            </div>
            <Input type="number" placeholder="FX Rate (default 120)" value={form.fxRate} onChange={(e) => setForm({ ...form, fxRate: e.target.value })} />
            <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.lcNo}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}