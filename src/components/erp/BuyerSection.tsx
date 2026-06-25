'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Globe, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Buyer { id: string; name: string; country: string; isActive: boolean; contact?: string; email?: string; phone?: string; sales: Sale[]; pricings: BuyerPricing[]; }
interface Sale { id: string; contractNo: string; qtyKg: number; status: string; }
interface BuyerPricing { id: string; lengthInch: number; premiumPct: number; }

const emptyBuyer = { name: '', country: '', contact: '', email: '', phone: '' };

export default function BuyerSection() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Buyer | null>(null);
  const [form, setForm] = useState(emptyBuyer);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchBuyers = useCallback(async () => {
    try {
      const res = await fetch('/api/buyers');
      if (res.ok) { const d = await res.json(); setBuyers(d.data || []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBuyers(); }, [fetchBuyers]);

  const handleSave = async () => {
    try {
      if (editing) {
        await fetch(`/api/buyers/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        toast.success('Buyer updated');
      } else {
        await fetch('/api/buyers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        toast.success('Buyer created');
      }
      setDialogOpen(false); setEditing(null); setForm(emptyBuyer); fetchBuyers();
    } catch { toast.error('Save failed'); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/buyers/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      toast.success('Buyer deleted'); fetchBuyers();
    } catch { toast.error('Delete failed'); }
  };

  const openEdit = (b: Buyer) => { setEditing(b); setForm({ name: b.name, country: b.country, contact: b.contact || '', email: (b as Record<string, unknown>).email as string || '', phone: (b as Record<string, unknown>).phone as string || '' }); setDialogOpen(true); };
  const openAdd = () => { setEditing(null); setForm(emptyBuyer); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Globe className="h-6 w-6" style={{ color: '#C9A227' }} />
          <h2 className="text-2xl font-bold">Buyers</h2>
        </div>
        <Button onClick={openAdd} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Add Buyer</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? <p className="text-muted-foreground py-8 text-center">Loading...</p> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Name</TableHead><TableHead>Country</TableHead><TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead>Sales</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyers.map((b) => (
                    <>
                      <TableRow key={b.id}>
                        <TableCell>
                          <button onClick={() => setExpanded(expanded === b.id ? null : b.id)} className="cursor-pointer">
                            {expanded === b.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </TableCell>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>{b.country}</TableCell>
                        <TableCell>{b.contact || '-'}</TableCell>
                        <TableCell>{(b as Record<string, unknown>).email || '-'}</TableCell>
                        <TableCell>{(b as Record<string, unknown>).phone || '-'}</TableCell>
                        <TableCell><Badge variant={b.isActive ? 'default' : 'secondary'}>{b.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                        <TableCell>{b.sales?.length || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded === b.id && (
                        <TableRow key={`${b.id}-pricing`}>
                          <TableCell colSpan={9} className="bg-muted/30 p-4">
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader><TableRow><TableHead>Length (inch)</TableHead><TableHead>Premium %</TableHead></TableRow></TableHeader>
                                <TableBody>
                                  {b.pricings?.length > 0 ? b.pricings.map((p) => (
                                    <TableRow key={p.id}><TableCell>{p.lengthInch}"</TableCell><TableCell>{p.premiumPct}%</TableCell></TableRow>
                                  )) : <TableRow><TableCell colSpan={2} className="text-muted-foreground text-center">No pricing data</TableCell></TableRow>}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                  {buyers.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No buyers found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Buyer' : 'Add Buyer'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <Input placeholder="Contact Person" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.country}>{editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}