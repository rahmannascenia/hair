'use client';

import { erpFetch } from '@/lib/api-client';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  name: string;
  country: string;
}

interface ProcItem {
  id: string;
  voucherNo: string;
  date: string;
  supplierId: string;
  supplier: { name: string; country: string } | null;
  originCountry: string;
  rawWeightKg: number;
  usdPerKg: number;
  costPerKgBdt: number;
  goodsUsd: number;
  freightUsd: number;
  dutyUsd: number;
  bankChargesUsd: number;
  landedUsd: number;
  totalLandedCostBdt: number;
  landedCostPerKgBdt: number;
  lcNo: string | null;
  paymentMode: string | null;
  qualityGrade: string | null;
  fxRate: number;
  status: string;
  notes: string | null;
}

interface FormData {
  supplierId: string;
  date: string;
  voucherNo: string;
  lcNo: string;
  originCountry: string;
  rawWeightKg: string;
  usdPerKg: string;
  costPerKgBdt: string;
  paymentMode: string;
  qualityGrade: string;
  status: string;
  notes: string;
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';

const STATUS_OPTIONS = ['Received', 'In Transit', 'Cleared', 'Partial'];

const emptyForm = (): FormData => ({
  supplierId: '',
  date: new Date().toISOString().split('T')[0],
  voucherNo: '',
  lcNo: '',
  originCountry: '',
  rawWeightKg: '',
  usdPerKg: '',
  costPerKgBdt: '',
  paymentMode: '',
  qualityGrade: '',
  status: 'Received',
  notes: '',
});

export default function ProcurementSection() {
  const [data, setData] = useState<ProcItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProcItem | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [activeTab, setActiveTab] = useState('import');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await erpFetch('/api/procurement?limit=200');
      const json = await res.json();
      setData(json.data || []);
    } catch {
      toast.error('Failed to fetch procurements');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await erpFetch('/api/suppliers?limit=200');
      const json = await res.json();
      setSuppliers(json.data || []);
    } catch {
      toast.error('Failed to fetch suppliers');
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSuppliers();
  }, [fetchData, fetchSuppliers]);

  // Computed values for imports (client-side preview)
  const isImport = !!form.lcNo.trim();
  const weight = parseFloat(form.rawWeightKg) || 0;
  const usdRate = parseFloat(form.usdPerKg) || 0;
  const localCostRate = parseFloat(form.costPerKgBdt) || 0;

  const computedImport = (() => {
    if (!isImport || weight === 0 || usdRate === 0) {
      return { goods: 0, freight: 0, duty: 0, bank: 0, landed: 0, bdt: 0, perKg: 0 };
    }
    const goods = weight * usdRate;
    const freight = Math.round(goods * 0.03 * 100) / 100;
    const duty = Math.round(goods * 0.12 * 100) / 100;
    const bank = Math.round(goods * 0.01 * 100) / 100;
    const landed = goods + freight + duty + bank;
    const bdt = landed * 120;
    const perKg = weight > 0 ? bdt / weight : 0;
    return { goods, freight, duty, bank, landed, bdt, perKg };
  })();

  const computedLocal = {
    totalBdt: weight * localCostRate,
  };

  const openCreateDialog = (isImportTab: boolean) => {
    const f = emptyForm();
    if (isImportTab) {
      // leave lcNo empty — user must fill it
    }
    setEditing(null);
    setForm(f);
    setDialogOpen(true);
  };

  const openEditDialog = (item: ProcItem) => {
    setEditing(item);
    setForm({
      supplierId: item.supplierId || '',
      date: item.date ? item.date.split('T')[0] : '',
      voucherNo: item.voucherNo || '',
      lcNo: item.lcNo || '',
      originCountry: item.originCountry || '',
      rawWeightKg: String(item.rawWeightKg || ''),
      usdPerKg: String(item.usdPerKg || ''),
      costPerKgBdt: String(item.costPerKgBdt || ''),
      paymentMode: item.paymentMode || '',
      qualityGrade: item.qualityGrade || '',
      status: item.status || 'Received',
      notes: item.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.supplierId) { toast.error('Please select a supplier'); return; }
    if (!form.date) { toast.error('Please select a date'); return; }
    if (!form.voucherNo.trim()) { toast.error('Voucher No is required'); return; }
    const w = parseFloat(form.rawWeightKg);
    if (!w || w <= 0) { toast.error('Raw weight must be a positive number'); return; }

    if (isImport) {
      if (!form.lcNo.trim()) { toast.error('LC No is required for imports'); return; }
      const u = parseFloat(form.usdPerKg);
      if (!u || u <= 0) { toast.error('USD/kg must be a positive number for imports'); return; }
    } else {
      const c = parseFloat(form.costPerKgBdt);
      if (!c || c <= 0) { toast.error('Cost per kg BDT is required for local purchases'); return; }
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        supplierId: form.supplierId,
        date: form.date,
        voucherNo: form.voucherNo.trim(),
        lcNo: isImport ? form.lcNo.trim() : null,
        originCountry: form.originCountry.trim(),
        rawWeightKg: w,
        usdPerKg: isImport ? parseFloat(form.usdPerKg) : 0,
        costPerKgBdt: isImport ? 0 : parseFloat(form.costPerKgBdt),
        paymentMode: form.paymentMode.trim() || null,
        qualityGrade: form.qualityGrade.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      if (editing) {
        // For PUT, we need to send computed values too
        if (isImport) {
          body.goodsUsd = computedImport.goods;
          body.freightUsd = computedImport.freight;
          body.dutyUsd = computedImport.duty;
          body.bankChargesUsd = computedImport.bank;
          body.landedUsd = computedImport.landed;
          body.totalLandedCostBdt = computedImport.bdt;
          body.landedCostPerKgBdt = computedImport.perKg;
          body.fxRate = 120;
        } else {
          body.totalLandedCostBdt = computedLocal.totalBdt;
          body.goodsUsd = 0;
          body.freightUsd = 0;
          body.dutyUsd = 0;
          body.bankChargesUsd = 0;
          body.landedUsd = 0;
          body.landedCostPerKgBdt = 0;
        }

        const res = await erpFetch(`/api/procurement/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast.success('Procurement updated successfully');
          fetchData();
          setDialogOpen(false);
          setEditing(null);
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || 'Failed to update procurement');
        }
      } else {
        const res = await erpFetch('/api/procurement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast.success('Procurement created successfully');
          fetchData();
          setDialogOpen(false);
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || 'Failed to create procurement');
        }
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this procurement?')) return;
    try {
      const res = await erpFetch(`/api/procurement/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Procurement deleted successfully');
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to delete procurement');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const imports = data.filter(d => d.lcNo);
  const locals = data.filter(d => !d.lcNo);

  const filteredImports = searchTerm
    ? imports.filter(i =>
        i.lcNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.originCountry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.voucherNo?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : imports;

  const filteredLocals = searchTerm
    ? locals.filter(i =>
        i.voucherNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.originCountry?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : locals;

  const impTotals = imports.reduce((a, i) => ({
    weight: a.weight + (i.rawWeightKg || 0), goods: a.goods + (i.goodsUsd || 0),
    freight: a.freight + (i.freightUsd || 0), duty: a.duty + (i.dutyUsd || 0),
    bank: a.bank + (i.bankChargesUsd || 0), landed: a.landed + (i.landedUsd || 0),
    bdt: a.bdt + (i.totalLandedCostBdt || 0),
  }), { weight: 0, goods: 0, freight: 0, duty: 0, bank: 0, landed: 0, bdt: 0 });

  const locTotals = locals.reduce((a, i) => ({
    weight: a.weight + (i.rawWeightKg || 0), bdt: a.bdt + (i.totalLandedCostBdt || 0),
  }), { weight: 0, bdt: 0 });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Procurement</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 w-48 h-9 text-sm"
            />
          </div>
          <Button
            onClick={() => openCreateDialog(activeTab === 'import')}
            size="sm"
            style={{ backgroundColor: NAVY, color: '#fff' }}
            className="hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-1" /> Add New
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import">Import LC ({imports.length})</TabsTrigger>
          <TabsTrigger value="local">Local Purchase ({locals.length})</TabsTrigger>
        </TabsList>

        {/* ==================== IMPORT TAB ==================== */}
        <TabsContent value="import">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Import LC Register</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ScrollArea className="max-h-[500px] w-full">
                  <div className="min-w-[1200px] overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          {['LC No', 'Date', 'Supplier', 'Country', 'Qty (kg)', 'USD/kg', 'Goods USD', 'Freight 3%', 'Duty 12%', 'Bank 1%', 'Landed USD', 'Landed BDT', 'BDT/kg', 'Status', 'Actions'].map(h => (
                            <TableHead key={h} className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredImports.length === 0 && (
                          <TableRow><TableCell colSpan={15} className="text-center text-muted-foreground py-8">No import LCs found</TableCell></TableRow>
                        )}
                        {filteredImports.map(i => (
                          <TableRow key={i.id}>
                            <TableCell className="text-xs font-medium whitespace-nowrap">{i.lcNo}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{new Date(i.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{i.supplier?.name || '-'}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{i.originCountry}</TableCell>
                            <TableCell className="text-xs text-right">{i.rawWeightKg.toFixed(1)}</TableCell>
                            <TableCell className="text-xs text-right">${i.usdPerKg.toFixed(2)}</TableCell>
                            <TableCell className="text-xs text-right">${(i.goodsUsd || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right">${(i.freightUsd || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right">${(i.dutyUsd || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right">${(i.bankChargesUsd || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right font-medium">${(i.landedUsd || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right font-medium" style={{ color: GOLD }}>৳{(i.totalLandedCostBdt || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right font-bold" style={{ color: GOLD }}>৳{(i.landedCostPerKgBdt || 0).toLocaleString()}</TableCell>
                            <TableCell><Badge className="bg-green-100 text-green-800 hover:bg-green-100">{i.status}</Badge></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(i)} title="Edit">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(i.id)} title="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {imports.length > 0 && (
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell colSpan={4} className="text-xs" style={{ color: NAVY }}>TOTAL</TableCell>
                            <TableCell className="text-xs text-right">{impTotals.weight.toFixed(1)}</TableCell>
                            <TableCell colSpan={2}></TableCell>
                            <TableCell className="text-xs text-right">${impTotals.goods.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right">${impTotals.freight.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right">${impTotals.duty.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right">${impTotals.bank.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right">${impTotals.landed.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{impTotals.bdt.toLocaleString()}</TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== LOCAL TAB ==================== */}
        <TabsContent value="local">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Local Purchase Register</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ScrollArea className="max-h-[500px] w-full">
                  <div className="min-w-[1000px] overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          {['Voucher #', 'Date', 'Supplier', 'Region', 'Qty (kg)', 'BDT/kg', 'Total BDT', 'Payment', 'Quality', 'Status', 'Actions'].map(h => (
                            <TableHead key={h} className="text-xs font-bold" style={{ color: NAVY }}>{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLocals.length === 0 && (
                          <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">No local purchases found</TableCell></TableRow>
                        )}
                        {filteredLocals.map(i => (
                          <TableRow key={i.id}>
                            <TableCell className="text-xs font-medium">{i.voucherNo}</TableCell>
                            <TableCell className="text-xs">{new Date(i.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-xs">{i.supplier?.name || '-'}</TableCell>
                            <TableCell className="text-xs">{i.originCountry}</TableCell>
                            <TableCell className="text-xs text-right">{i.rawWeightKg.toFixed(1)}</TableCell>
                            <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{i.costPerKgBdt.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right font-medium" style={{ color: GOLD }}>৳{(i.totalLandedCostBdt || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-xs">{i.paymentMode || '-'}</TableCell>
                            <TableCell className="text-xs">{i.qualityGrade || '-'}</TableCell>
                            <TableCell><Badge className="bg-green-100 text-green-800 hover:bg-green-100">{i.status}</Badge></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(i)} title="Edit">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(i.id)} title="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {locals.length > 0 && (
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell colSpan={4} className="text-xs" style={{ color: NAVY }}>TOTAL</TableCell>
                            <TableCell className="text-xs text-right">{locTotals.weight.toFixed(1)}</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{locTotals.bdt.toLocaleString()}</TableCell>
                            <TableCell colSpan={4}></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== CREATE/EDIT DIALOG ==================== */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditing(null); setForm(emptyForm()); }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: NAVY }}>
              {editing ? 'Edit Procurement' : 'New Procurement'}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({isImport ? 'Import LC' : 'Local Purchase'})
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {/* Row 1: Type indicator & Supplier */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>
                Type <span className="text-muted-foreground font-normal">(LC No filled = Import)</span>
              </Label>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>Supplier *</Label>
              <Select value={form.supplierId} onValueChange={v => setForm(f => ({ ...f, supplierId: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.country})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: Date & Voucher */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>Voucher No *</Label>
              <Input value={form.voucherNo} onChange={e => setForm(f => ({ ...f, voucherNo: e.target.value }))} placeholder="e.g. V-2024-001" className="h-9 text-sm" />
            </div>

            {/* Row 3: LC No (Import) */}
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>
                LC No {isImport ? '*' : ''} <span className="text-muted-foreground font-normal">(Leave empty for Local Purchase)</span>
              </Label>
              <Input value={form.lcNo} onChange={e => setForm(f => ({ ...f, lcNo: e.target.value }))} placeholder="e.g. LC-2024-001" className="h-9 text-sm" />
            </div>

            {/* Conditional: Import-specific fields */}
            {isImport && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold" style={{ color: NAVY }}>Origin Country</Label>
                  <Input value={form.originCountry} onChange={e => setForm(f => ({ ...f, originCountry: e.target.value }))} placeholder="e.g. India" className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold" style={{ color: NAVY }}>Raw Weight (kg) *</Label>
                  <Input type="number" step="0.1" value={form.rawWeightKg} onChange={e => setForm(f => ({ ...f, rawWeightKg: e.target.value }))} placeholder="0.0" className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold" style={{ color: NAVY }}>USD per kg *</Label>
                  <Input type="number" step="0.01" value={form.usdPerKg} onChange={e => setForm(f => ({ ...f, usdPerKg: e.target.value }))} placeholder="0.00" className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold" style={{ color: NAVY }}>Payment Mode</Label>
                  <Input value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))} placeholder="e.g. LC, TT" className="h-9 text-sm" />
                </div>

                {/* Computed import values (read-only) */}
                <div className="sm:col-span-2 rounded-lg border p-3 bg-muted/30 space-y-2">
                  <p className="text-xs font-semibold mb-2" style={{ color: GOLD }}>Auto-Computed Landed Cost (FX Rate: 120)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Goods USD:</span> <span className="font-medium">${computedImport.goods.toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">Freight 3%:</span> <span className="font-medium">${computedImport.freight.toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">Duty 12%:</span> <span className="font-medium">${computedImport.duty.toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">Bank 1%:</span> <span className="font-medium">${computedImport.bank.toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">Landed USD:</span> <span className="font-medium">${computedImport.landed.toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">Total BDT:</span> <span className="font-bold" style={{ color: GOLD }}>৳{computedImport.bdt.toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">BDT/kg:</span> <span className="font-bold" style={{ color: GOLD }}>৳{computedImport.perKg.toLocaleString()}</span></div>
                  </div>
                </div>
              </>
            )}

            {/* Conditional: Local-specific fields */}
            {!isImport && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold" style={{ color: NAVY }}>Origin Country</Label>
                  <Input value={form.originCountry} onChange={e => setForm(f => ({ ...f, originCountry: e.target.value }))} placeholder="e.g. Narayanganj" className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold" style={{ color: NAVY }}>Raw Weight (kg) *</Label>
                  <Input type="number" step="0.1" value={form.rawWeightKg} onChange={e => setForm(f => ({ ...f, rawWeightKg: e.target.value }))} placeholder="0.0" className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold" style={{ color: NAVY }}>Cost per kg (BDT) *</Label>
                  <Input type="number" step="0.01" value={form.costPerKgBdt} onChange={e => setForm(f => ({ ...f, costPerKgBdt: e.target.value }))} placeholder="0.00" className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold" style={{ color: NAVY }}>Payment Mode</Label>
                  <Input value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))} placeholder="e.g. Cash, Credit" className="h-9 text-sm" />
                </div>

                {/* Computed local values */}
                <div className="sm:col-span-2 rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs font-semibold mb-1" style={{ color: GOLD }}>Auto-Computed Total</p>
                  <p className="text-xs"><span className="text-muted-foreground">Total Landed Cost:</span> <span className="font-bold" style={{ color: GOLD }}>৳{computedLocal.totalBdt.toLocaleString()}</span></p>
                </div>
              </>
            )}

            {/* Quality Grade & Status */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>Quality Grade</Label>
              <Input value={form.qualityGrade} onChange={e => setForm(f => ({ ...f, qualityGrade: e.target.value }))} placeholder="e.g. A, B, Premium" className="h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={3} className="text-sm" />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); setForm(emptyForm()); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} style={{ backgroundColor: NAVY, color: '#fff' }} className="hover:opacity-90">
              {submitting ? 'Saving...' : editing ? 'Update Procurement' : 'Create Procurement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}