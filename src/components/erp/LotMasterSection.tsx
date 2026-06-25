'use client';

import { erpFetch } from '@/lib/api-client';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Procurement {
  id: string;
  voucherNo: string;
  lcNo: string | null;
  originCountry: string;
  supplier: { name: string } | null;
}

interface LotItem {
  id: string;
  lotNo: string;
  procurementId: string | null;
  procurement: Procurement | null;
  colour: string;
  rawWeightKg: number;
  landedCostPerKg: number;
  totalLandedCost: number;
  washStatus: string;
  distributedKg: number;
  returnedKg: number;
  finishedKg: number;
  status: string;
}

interface FormData {
  lotNo: string;
  procurementId: string;
  colour: string;
  rawWeightKg: string;
  landedCostPerKg: string;
  status: string;
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';

const STATUS_OPTIONS = ['Active', 'Phase 1 Active', 'Washed Stock', 'Raw Material', 'Finished', 'In Production'];

const statusStyles: Record<string, string> = {
  'Active': 'bg-green-100 text-green-800 hover:bg-green-100',
  'Phase 1 Active': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  'Washed Stock': 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  'Raw Material': 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  'Finished': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  'In Production': '',
};

const emptyForm = (): FormData => ({
  lotNo: '',
  procurementId: '',
  colour: '',
  rawWeightKg: '',
  landedCostPerKg: '',
  status: 'Active',
});

export default function LotMasterSection() {
  const [data, setData] = useState<LotItem[]>([]);
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LotItem | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await erpFetch('/api/lots?limit=200');
      const json = await res.json();
      setData(json.data || []);
    } catch {
      toast.error('Failed to fetch lots');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProcurements = useCallback(async () => {
    try {
      const res = await erpFetch('/api/procurement?limit=200');
      const json = await res.json();
      setProcurements(json.data || []);
    } catch {
      toast.error('Failed to fetch procurements');
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchProcurements();
  }, [fetchData, fetchProcurements]);

  // Auto-compute totalLandedCost
  const weight = parseFloat(form.rawWeightKg) || 0;
  const costPerKg = parseFloat(form.landedCostPerKg) || 0;
  const computedTotal = weight * costPerKg;

  const openCreateDialog = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEditDialog = (item: LotItem) => {
    setEditing(item);
    setForm({
      lotNo: item.lotNo || '',
      procurementId: item.procurementId || '',
      colour: item.colour || '',
      rawWeightKg: String(item.rawWeightKg || ''),
      landedCostPerKg: String(item.landedCostPerKg || ''),
      status: item.status || 'Active',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.lotNo.trim()) { toast.error('Lot No is required'); return; }
    if (!form.colour.trim()) { toast.error('Colour is required'); return; }
    const w = parseFloat(form.rawWeightKg);
    if (!w || w <= 0) { toast.error('Raw weight must be a positive number'); return; }
    const c = parseFloat(form.landedCostPerKg);
    if (!c || c <= 0) { toast.error('Landed cost per kg must be a positive number'); return; }

    setSubmitting(true);
    try {
      const body = {
        lotNo: form.lotNo.trim(),
        procurementId: form.procurementId || null,
        colour: form.colour.trim(),
        rawWeightKg: w,
        landedCostPerKg: c,
        totalLandedCost: w * c,
        status: form.status,
      };

      if (editing) {
        const res = await erpFetch(`/api/lots/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast.success('Lot updated successfully');
          fetchData();
          setDialogOpen(false);
          setEditing(null);
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || 'Failed to update lot');
        }
      } else {
        const res = await erpFetch('/api/lots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast.success('Lot created successfully');
          fetchData();
          setDialogOpen(false);
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || 'Failed to create lot');
        }
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lot? This will fail if the lot has related records (wash logs, distributions, etc.).')) return;
    try {
      const res = await erpFetch(`/api/lots/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Lot deleted successfully');
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to delete lot');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const filteredData = searchTerm
    ? data.filter(i =>
        i.lotNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.colour?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.procurement?.voucherNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.procurement?.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Lot Master</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lots..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 w-48 h-9 text-sm"
            />
          </div>
          <Button
            onClick={openCreateDialog}
            size="sm"
            style={{ backgroundColor: NAVY, color: '#fff' }}
            className="hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-1" /> Add New
          </Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>All Lots ({data.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Lot No</TableHead>
                      <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Procurement</TableHead>
                      <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Colour</TableHead>
                      <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Raw Wt (kg)</TableHead>
                      <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Cost/kg</TableHead>
                      <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Total Cost (BDT)</TableHead>
                      <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Wash Status</TableHead>
                      <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Distributed (kg)</TableHead>
                      <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Returned (kg)</TableHead>
                      <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Finished (kg)</TableHead>
                      <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Status</TableHead>
                      <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                          {searchTerm ? 'No matching lots found' : 'No lots found'}
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredData.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-xs whitespace-nowrap">{item.lotNo}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {item.procurement?.lcNo || item.procurement?.voucherNo || '-'}
                          {item.procurement?.supplier && (
                            <span className="text-muted-foreground ml-1">({item.procurement.supplier.name})</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-xs font-normal">{item.colour}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right">{item.rawWeightKg.toFixed(1)}</TableCell>
                        <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{item.landedCostPerKg.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right font-medium" style={{ color: GOLD }}>৳{item.totalLandedCost.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">
                          <Badge
                            variant="secondary"
                            className={
                              item.washStatus === 'Done'
                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                            }
                          >
                            {item.washStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right">{item.distributedKg.toFixed(1)}</TableCell>
                        <TableCell className="text-xs text-right">{item.returnedKg.toFixed(1)}</TableCell>
                        <TableCell className="text-xs text-right">{item.finishedKg.toFixed(1)}</TableCell>
                        <TableCell>
                          <Badge
                            className={statusStyles[item.status] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'}
                            style={item.status === 'In Production' ? { backgroundColor: NAVY, color: '#fff' } : undefined}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditDialog(item)}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(item.id)}
                              title="Delete"
                            >
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

      {/* ==================== CREATE/EDIT DIALOG ==================== */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setEditing(null); setForm(emptyForm()); }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: NAVY }}>
              {editing ? 'Edit Lot' : 'New Lot'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {/* Lot No */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>Lot No *</Label>
              <Input
                value={form.lotNo}
                onChange={e => setForm(f => ({ ...f, lotNo: e.target.value }))}
                placeholder="e.g. LOT-2024-001"
                className="h-9 text-sm"
              />
            </div>

            {/* Procurement */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>Procurement</Label>
              <Select value={form.procurementId} onValueChange={v => setForm(f => ({ ...f, procurementId: v }))}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select procurement" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {procurements.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.lcNo || p.voucherNo}
                      {p.supplier ? ` — ${p.supplier.name}` : ''}
                      {p.lcNo ? ' (Import)' : ' (Local)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Colour */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>Colour *</Label>
              <Input
                value={form.colour}
                onChange={e => setForm(f => ({ ...f, colour: e.target.value }))}
                placeholder="e.g. Natural White"
                className="h-9 text-sm"
              />
            </div>

            {/* Raw Weight */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>Raw Weight (kg) *</Label>
              <Input
                type="number"
                step="0.1"
                value={form.rawWeightKg}
                onChange={e => setForm(f => ({ ...f, rawWeightKg: e.target.value }))}
                placeholder="0.0"
                className="h-9 text-sm"
              />
            </div>

            {/* Landed Cost per kg */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>Landed Cost per kg (BDT) *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.landedCostPerKg}
                onChange={e => setForm(f => ({ ...f, landedCostPerKg: e.target.value }))}
                placeholder="0.00"
                className="h-9 text-sm"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold" style={{ color: NAVY }}>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Auto-computed total */}
            <div className="sm:col-span-2 rounded-lg border p-3 bg-muted/30">
              <p className="text-xs font-semibold mb-1" style={{ color: GOLD }}>Auto-Computed Total</p>
              <p className="text-xs">
                <span className="text-muted-foreground">Total Landed Cost:</span>{' '}
                <span className="font-bold text-sm" style={{ color: GOLD }}>
                  ৳{computedTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); setEditing(null); setForm(emptyForm()); }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ backgroundColor: NAVY, color: '#fff' }}
              className="hover:opacity-90"
            >
              {submitting ? 'Saving...' : editing ? 'Update Lot' : 'Create Lot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}