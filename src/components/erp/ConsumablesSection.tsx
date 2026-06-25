'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Droplets, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Consumable { id: string; itemName: string; category: string; unit: string; stockQty: number; reorderLevel: number; costPerUnit: number; supplierName?: string; lastOrderDate?: string }

const CATEGORIES = ['All', 'Chemical', 'Packaging', 'Adhesive', 'Equipment'];
const emptyForm = { itemName: '', category: 'Chemical', unit: 'pcs', stockQty: '0', reorderLevel: '0', costPerUnit: '0', supplierName: '' };

export default function ConsumablesSection() {
  const [items, setItems] = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchItems = useCallback(async () => {
    try { const res = await fetch('/api/consumables'); if (res.ok) { const d = await res.json(); setItems(d.data || []); } } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = catFilter === 'All' ? items : items.filter((i) => i.category === catFilter);
  const lowStockCount = items.filter((i) => i.stockQty < i.reorderLevel).length;

  const handleSave = async () => {
    try {
      await fetch('/api/consumables', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, stockQty: parseFloat(form.stockQty) || 0, reorderLevel: parseFloat(form.reorderLevel) || 0, costPerUnit: parseFloat(form.costPerUnit) || 0 }),
      });
      toast.success('Item added'); setDialogOpen(false); setForm(emptyForm); fetchItems();
    } catch { toast.error('Save failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Droplets className="h-6 w-6" style={{ color: '#C9A227' }} />
          <h2 className="text-2xl font-bold">Consumables</h2>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Add</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{items.length}</p><p className="text-xs text-muted-foreground">Total Items</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{lowStockCount}</p><p className="text-xs text-muted-foreground">Low Stock</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">৳{items.reduce((s, i) => s + i.stockQty * i.costPerUnit, 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Stock Value</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{new Set(items.map((i) => i.category)).size}</p><p className="text-xs text-muted-foreground">Categories</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? <p className="text-muted-foreground py-8 text-center">Loading...</p> : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Unit</TableHead><TableHead>Cost/Unit</TableHead><TableHead>Stock</TableHead><TableHead>Reorder Level</TableHead><TableHead>Supplier</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => {
                    const isLow = item.stockQty < item.reorderLevel;
                    return (
                      <TableRow key={item.id} className={isLow ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">{isLow && <AlertTriangle className="h-3 w-3 text-red-500 inline mr-1" />}{item.itemName}</TableCell>
                        <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>৳{item.costPerUnit}</TableCell>
                        <TableCell className={isLow ? 'text-red-600 font-bold' : ''}>{item.stockQty}</TableCell>
                        <TableCell>{item.reorderLevel}</TableCell>
                        <TableCell className="text-xs">{item.supplierName || '-'}</TableCell>
                        <TableCell><Badge className={isLow ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}>{isLow ? 'Low Stock' : 'OK'}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No items found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Consumable</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <Input placeholder="Item Name" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{['Chemical', 'Packaging', 'Adhesive', 'Equipment'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" placeholder="Cost/Unit BDT" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} />
              <Input type="number" placeholder="Stock Qty" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
            </div>
            <Input type="number" placeholder="Reorder Level" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
            <Input placeholder="Supplier Name" value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.itemName}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}