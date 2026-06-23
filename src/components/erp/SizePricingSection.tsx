'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface SizePrice { id: string; lengthInch: number; bdtPerKg: number; usdPerKg: number; marketSegment: string; minMarginBdt: number; minMarginPct: number; }
interface BuyerPrice { id: string; buyerId: string; lengthInch: number; premiumPct: number; buyer: { id: string; name: string } | null; }
interface Buyer { id: string; name: string; country: string; }

export default function SizePricingSection() {
  const [sizePricing, setSizePricing] = useState<SizePrice[]>([]);
  const [buyerPricing, setBuyerPricing] = useState<BuyerPrice[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [dialogType, setDialogType] = useState<'base' | 'buyer'>('base');
  const [form, setForm] = useState({ lengthInch: '', bdtPerKg: '', usdPerKg: '', marketSegment: 'Short', minMarginBdt: '', minMarginPct: '', buyerId: '', premiumPct: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/size-pricing');
      const json = await res.json();
      setSizePricing(json.sizePricing || []);
      setBuyerPricing(json.buyerPricing || []);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  const fetchBuyers = async () => {
    try {
      const res = await fetch('/api/buyers');
      const json = await res.json();
      setBuyers(json.data || []);
    } catch {}
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); fetchBuyers(); }, []);

  const openCreateBase = () => {
    setEditing(null); setDialogType('base');
    setForm({ lengthInch: '', bdtPerKg: '', usdPerKg: '', marketSegment: 'Short', minMarginBdt: '0', minMarginPct: '0', buyerId: '', premiumPct: '' });
    setDialogOpen(true);
  };

  const openEditBase = (item: SizePrice) => {
    setEditing(item); setDialogType('base');
    setForm({ lengthInch: String(item.lengthInch), bdtPerKg: String(item.bdtPerKg), usdPerKg: String(item.usdPerKg), marketSegment: item.marketSegment, minMarginBdt: String(item.minMarginBdt), minMarginPct: String(item.minMarginPct), buyerId: '', premiumPct: '' });
    setDialogOpen(true);
  };

  const openCreateBuyer = () => {
    setEditing(null); setDialogType('buyer');
    setForm({ lengthInch: '', bdtPerKg: '', usdPerKg: '', marketSegment: '', minMarginBdt: '', minMarginPct: '', buyerId: '', premiumPct: '' });
    setDialogOpen(true);
  };

  const openEditBuyer = (item: BuyerPrice) => {
    setEditing(item); setDialogType('buyer');
    setForm({ lengthInch: String(item.lengthInch), bdtPerKg: '', usdPerKg: '', marketSegment: '', minMarginBdt: '', minMarginPct: '', buyerId: item.buyerId, premiumPct: String(item.premiumPct) });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (dialogType === 'base') {
      if (!form.lengthInch || !form.bdtPerKg) { toast.error('Length and BDT/kg required'); return; }
      const body = {
        lengthInch: parseInt(form.lengthInch), bdtPerKg: parseFloat(form.bdtPerKg),
        usdPerKg: parseFloat(form.usdPerKg) || 0, marketSegment: form.marketSegment,
        minMarginBdt: parseFloat(form.minMarginBdt) || 0, minMarginPct: parseFloat(form.minMarginPct) || 0,
      };
      const res = editing
        ? await fetch('/api/size-pricing', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/size-pricing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); fetchData(); }
      else toast.error('Failed');
    } else {
      if (!form.buyerId || !form.lengthInch || !form.premiumPct) { toast.error('All fields required'); return; }
      if (editing) {
        const res = await fetch('/api/size-pricing', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'buyer-pricing', id: editing.id, premiumPct: parseFloat(form.premiumPct) }) });
        if (res.ok) { toast.success('Updated'); setDialogOpen(false); fetchData(); }
        else toast.error('Failed');
      } else {
        const res = await fetch('/api/size-pricing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'buyer-pricing', buyerId: form.buyerId, lengthInch: parseInt(form.lengthInch), premiumPct: parseFloat(form.premiumPct) }) });
        if (res.ok) { toast.success('Created'); setDialogOpen(false); fetchData(); }
        else toast.error('Failed');
      }
    }
  };

  const handleDeleteBase = async (lengthInch: number) => {
    if (!confirm(`Delete ${lengthInch}" pricing?`)) return;
    const res = await fetch(`/api/size-pricing?lengthInch=${lengthInch}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); fetchData(); }
    else toast.error('Failed');
  };

  const handleDeleteBuyer = async (id: string) => {
    if (!confirm('Delete this buyer pricing?')) return;
    const res = await fetch(`/api/buyer-pricing/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); fetchData(); }
    else toast.error('Failed');
  };

  const r = (v: number) => Math.round(v * 100) / 100;
  const refRate = sizePricing.find((sp) => sp.lengthInch === 8)?.bdtPerKg || 0;
  const segments = ['Short', 'Medium', 'Long', 'Extra Long'];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3864]">Size Pricing Master</h2>
        <p className="text-sm text-muted-foreground">Base rates per hair length and buyer-specific premiums</p>
      </div>

      <Tabs defaultValue="rate-master">
        <TabsList>
          <TabsTrigger value="rate-master">Rate Master</TabsTrigger>
          <TabsTrigger value="buyer-pricing">Buyer Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="rate-master">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Base Rates by Length</CardTitle>
              <Button onClick={openCreateBase} className="bg-[#1F3864] hover:bg-[#1F3864]/90" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Size
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#1F3864] text-white hover:bg-[#1F3864]">
                        <TableHead className="text-white">Length</TableHead>
                        <TableHead className="text-white text-right">BDT/kg</TableHead>
                        <TableHead className="text-white text-right">USD/kg</TableHead>
                        <TableHead className="text-white text-right">vs 8&quot; Premium</TableHead>
                        <TableHead className="text-white">Segment</TableHead>
                        <TableHead className="text-white text-right">Min Margin BDT</TableHead>
                        <TableHead className="text-white text-right">Min Margin %</TableHead>
                        <TableHead className="text-white text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sizePricing.map((sp) => {
                        const premium = refRate > 0 ? ((sp.bdtPerKg - refRate) / refRate * 100) : 0;
                        return (
                          <TableRow key={sp.lengthInch}>
                            <TableCell className="font-bold">{sp.lengthInch}&quot;</TableCell>
                            <TableCell className="text-right font-mono text-[#C9A227] font-bold">৳{r(sp.bdtPerKg)}</TableCell>
                            <TableCell className="text-right font-mono">${r(sp.usdPerKg)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={premium >= 0 ? 'default' : 'destructive'}>
                                {premium >= 0 ? '+' : ''}{r(premium)}%
                              </Badge>
                            </TableCell>
                            <TableCell><Badge variant="outline">{sp.marketSegment}</Badge></TableCell>
                            <TableCell className="text-right font-mono">৳{r(sp.minMarginBdt)}</TableCell>
                            <TableCell className="text-right font-mono">{r(sp.minMarginPct)}%</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditBase(sp)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => handleDeleteBase(sp.lengthInch)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buyer-pricing">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Buyer-Specific Premiums</CardTitle>
              <Button onClick={openCreateBuyer} className="bg-[#1F3864] hover:bg-[#1F3864]/90" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Buyer Pricing
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#1F3864] text-white hover:bg-[#1F3864]">
                        <TableHead className="text-white">Buyer</TableHead>
                        <TableHead className="text-white">Length</TableHead>
                        <TableHead className="text-white text-right">Premium %</TableHead>
                        <TableHead className="text-white text-right">Base BDT/kg</TableHead>
                        <TableHead className="text-white text-right">Final BDT/kg</TableHead>
                        <TableHead className="text-white text-right">Final USD/kg</TableHead>
                        <TableHead className="text-white text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buyerPricing.map((bp) => {
                        const base = sizePricing.find((sp) => sp.lengthInch === bp.lengthInch);
                        const finalBdt = base ? base.bdtPerKg * (1 + bp.premiumPct / 100) : 0;
                        return (
                          <TableRow key={bp.id}>
                            <TableCell className="font-medium">{bp.buyer?.name || 'Unknown'}</TableCell>
                            <TableCell>{bp.lengthInch}&quot;</TableCell>
                            <TableCell className="text-right font-mono text-[#C9A227] font-bold">+{r(bp.premiumPct)}%</TableCell>
                            <TableCell className="text-right font-mono">৳{base ? r(base.bdtPerKg) : '—'}</TableCell>
                            <TableCell className="text-right font-mono font-bold">৳{r(finalBdt)}</TableCell>
                            <TableCell className="text-right font-mono">${base ? r(base.usdPerKg * (1 + bp.premiumPct / 100)) : '—'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditBuyer(bp)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => handleDeleteBuyer(bp.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {buyerPricing.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No buyer pricing entries</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1F3864]">
              {dialogType === 'base' ? (editing ? 'Edit Size Pricing' : 'New Size Pricing') : (editing ? 'Edit Buyer Pricing' : 'New Buyer Pricing')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {dialogType === 'base' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Length (inch) *</Label>
                    <Input type="number" value={form.lengthInch} onChange={(e) => setForm({ ...form, lengthInch: e.target.value })} disabled={!!editing} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Market Segment</Label>
                    <Select value={form.marketSegment} onValueChange={(v) => setForm({ ...form, marketSegment: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{segments.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>BDT/kg *</Label>
                    <Input type="number" step="0.01" value={form.bdtPerKg} onChange={(e) => setForm({ ...form, bdtPerKg: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>USD/kg</Label>
                    <Input type="number" step="0.01" value={form.usdPerKg} onChange={(e) => setForm({ ...form, usdPerKg: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Min Margin BDT</Label>
                    <Input type="number" step="0.01" value={form.minMarginBdt} onChange={(e) => setForm({ ...form, minMarginBdt: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Min Margin %</Label>
                    <Input type="number" step="0.01" value={form.minMarginPct} onChange={(e) => setForm({ ...form, minMarginPct: e.target.value })} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Buyer *</Label>
                  <Select value={form.buyerId} onValueChange={(v) => setForm({ ...form, buyerId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select buyer" /></SelectTrigger>
                    <SelectContent>{buyers.map((b) => <SelectItem key={b.id} value={b.id}>{b.name} ({b.country})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Length (inch) *</Label>
                    <Input type="number" value={form.lengthInch} onChange={(e) => setForm({ ...form, lengthInch: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Premium % *</Label>
                    <Input type="number" step="0.01" value={form.premiumPct} onChange={(e) => setForm({ ...form, premiumPct: e.target.value })} />
                  </div>
                </div>
              </>
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