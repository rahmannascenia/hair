'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SaleItem {
  id: string;
  contractNo: string;
  contractDate: string;
  buyer: { name: string; country: string } | null;
  productSpec: string;
  lengthInch: number;
  qtyKg: number;
  usdPerKg: number;
  usdValue: number;
  bdtValue: number;
  costPerKgBdt: number;
  totalCostBdt: number;
  marginPerKgBdt: number;
  totalMarginBdt: number;
  marginPct: number;
  status: string;
  buyerId: string;
}

interface Buyer {
  id: string;
  name: string;
  country: string;
}

interface FxExposure {
  totalUsdValue: number;
  totalBdtValue: number;
  effectiveRate: number;
  bookedRate: number;
  fxGainLossPerUsd: number;
  fxGainLossTotal: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const NAVY = '#1F3864';
const GOLD = '#C9A227';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SalesSection() {
  const [data, setData] = useState<SaleItem[]>([]);
  const [fx, setFx] = useState<FxExposure | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SaleItem | null>(null);

  // Form state
  const [formBuyerId, setFormBuyerId] = useState('');
  const [formContractNo, setFormContractNo] = useState('');
  const [formContractDate, setFormContractDate] = useState('');
  const [formProductSpec, setFormProductSpec] = useState('');
  const [formLengthInch, setFormLengthInch] = useState('');
  const [formQtyKg, setFormQtyKg] = useState('');
  const [formUsdPerKg, setFormUsdPerKg] = useState('');

  /* ---- Data fetching ---- */

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/sales?limit=200');
      const json = await res.json();
      setData(json.data || []);
      setFx(json.fxExposure || null);
    } catch {
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBuyers = useCallback(async () => {
    try {
      const res = await fetch('/api/buyers');
      const json = await res.json();
      setBuyers(json.data || []);
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchBuyers();
  }, [fetchData, fetchBuyers]);

  /* ---- CRUD helpers ---- */

  const resetForm = () => {
    setFormBuyerId('');
    setFormContractNo('');
    setFormContractDate('');
    setFormProductSpec('');
    setFormLengthInch('');
    setFormQtyKg('');
    setFormUsdPerKg('');
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: SaleItem) => {
    setEditing(item);
    setFormBuyerId(item.buyerId || '');
    setFormContractNo(item.contractNo || '');
    setFormContractDate(item.contractDate ? item.contractDate.slice(0, 10) : '');
    setFormProductSpec(item.productSpec || '');
    setFormLengthInch(item.lengthInch != null ? String(item.lengthInch) : '');
    setFormQtyKg(item.qtyKg != null ? String(item.qtyKg) : '');
    setFormUsdPerKg(item.usdPerKg != null ? String(item.usdPerKg) : '');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formBuyerId) { toast.error('Please select a buyer'); return; }
    if (!formContractNo.trim()) { toast.error('Contract number is required'); return; }

    const body = {
      buyerId: formBuyerId,
      contractNo: formContractNo.trim(),
      contractDate: formContractDate || null,
      productSpec: formProductSpec.trim(),
      lengthInch: formLengthInch ? parseInt(formLengthInch, 10) : null,
      qtyKg: formQtyKg ? parseFloat(formQtyKg) : null,
      usdPerKg: formUsdPerKg ? parseFloat(formUsdPerKg) : null,
    };

    setSubmitting(true);
    try {
      if (editing) {
        const res = await fetch(`/api/sales/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Update failed'); }
        toast.success('Sale contract updated');
      } else {
        const res = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Create failed'); }
        toast.success('Sale contract created');
      }
      setDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: SaleItem) => {
    if (!confirm(`Delete contract "${item.contractNo}"?`)) return;
    try {
      const res = await fetch(`/api/sales/${item.id}`, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Delete failed'); }
      toast.success('Sale contract deleted');
      await fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  /* ---- Derived data ---- */

  const totals = data.reduce(
    (a, s) => ({
      qty: a.qty + (s.qtyKg || 0),
      usd: a.usd + (s.usdValue || 0),
      bdt: a.bdt + (s.bdtValue || 0),
      cost: a.cost + (s.totalCostBdt || 0),
      margin: a.margin + (s.totalMarginBdt || 0),
    }),
    { qty: 0, usd: 0, bdt: 0, cost: 0, margin: 0 },
  );

  /* ---- Render ---- */

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold" style={{ color: NAVY }}>
          Sales &amp; Export
        </h2>
        <Button onClick={openCreate} size="sm" className="gap-1.5" style={{ backgroundColor: NAVY }}>
          <Plus className="size-4" />
          New Contract
        </Button>
      </div>

      {/* Contracts Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>
            Export Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {[
                        'Contract #',
                        'Date',
                        'Buyer',
                        'Country',
                        'Spec',
                        'Length',
                        'Qty (kg)',
                        'USD/kg',
                        'USD Value',
                        'BDT Value',
                        'Cost/kg',
                        'Total Cost',
                        'Margin/kg',
                        'Total Margin',
                        'Margin %',
                        'Status',
                        'Actions',
                      ].map((h) => (
                        <TableHead
                          key={h}
                          className="text-xs font-bold whitespace-nowrap"
                          style={{ color: NAVY }}
                        >
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={17} className="text-center text-muted-foreground py-8">
                          No sales contracts found. Click &quot;New Contract&quot; to add one.
                        </TableCell>
                      </TableRow>
                    )}

                    {data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs font-medium whitespace-nowrap">
                          {item.contractNo}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {item.contractDate ? new Date(item.contractDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{item.buyer?.name ?? '-'}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{item.buyer?.country ?? '-'}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{item.productSpec}</TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap">{item.lengthInch}"</TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap">
                          {item.qtyKg?.toFixed(1) ?? '-'}
                        </TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap">
                          ${item.usdPerKg?.toFixed(2) ?? '-'}
                        </TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap">
                          ${item.usdValue?.toLocaleString() ?? '-'}
                        </TableCell>
                        <TableCell
                          className="text-xs text-right whitespace-nowrap font-medium"
                          style={{ color: GOLD }}
                        >
                          ৳{item.bdtValue?.toLocaleString() ?? '-'}
                        </TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap">
                          ৳{item.costPerKgBdt?.toLocaleString() ?? '-'}
                        </TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap">
                          ৳{item.totalCostBdt?.toLocaleString() ?? '-'}
                        </TableCell>
                        <TableCell
                          className="text-xs text-right whitespace-nowrap"
                          style={{ color: (item.marginPerKgBdt ?? 0) >= 0 ? GOLD : '#C0392B' }}
                        >
                          ৳{item.marginPerKgBdt?.toLocaleString() ?? '-'}
                        </TableCell>
                        <TableCell
                          className="text-xs text-right whitespace-nowrap font-bold"
                          style={{ color: (item.totalMarginBdt ?? 0) >= 0 ? GOLD : '#C0392B' }}
                        >
                          ৳{item.totalMarginBdt?.toLocaleString() ?? '-'}
                        </TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap">
                          {item.marginPct?.toFixed(1) ?? '-'}%
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            className={
                              item.status === 'Healthy'
                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 hover:bg-muted"
                              onClick={() => openEdit(item)}
                              aria-label="Edit"
                            >
                              <Pencil className="size-3.5" style={{ color: NAVY }} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 hover:bg-red-50"
                              onClick={() => handleDelete(item)}
                              aria-label="Delete"
                            >
                              <Trash2 className="size-3.5 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Totals row */}
                    {data.length > 0 && (
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={6} className="text-xs" style={{ color: NAVY }}>
                          TOTAL
                        </TableCell>
                        <TableCell className="text-xs text-right">{totals.qty.toFixed(1)}</TableCell>
                        <TableCell />
                        <TableCell className="text-xs text-right">
                          ${totals.usd.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-right" style={{ color: GOLD }}>
                          ৳{totals.bdt.toLocaleString()}
                        </TableCell>
                        <TableCell />
                        <TableCell className="text-xs text-right">
                          ৳{totals.cost.toLocaleString()}
                        </TableCell>
                        <TableCell />
                        <TableCell
                          className="text-xs text-right font-bold"
                          style={{ color: totals.margin >= 0 ? GOLD : '#C0392B' }}
                        >
                          ৳{totals.margin.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {totals.bdt > 0 ? ((totals.margin / totals.bdt) * 100).toFixed(1) + '%' : '-'}
                        </TableCell>
                        <TableCell />
                        <TableCell />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* FX Exposure Summary */}
      {fx && (
        <Card className="border shadow-sm" style={{ backgroundColor: '#F4F6FB' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>
              FX Exposure Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Revenue (USD)', value: `$${fx.totalUsdValue.toLocaleString()}` },
                { label: 'Total Revenue (BDT)', value: `৳${fx.totalBdtValue.toLocaleString()}`, accent: true },
                { label: 'Effective Rate', value: fx.effectiveRate.toFixed(2) },
                { label: 'Booked FX Rate', value: fx.bookedRate.toFixed(2) },
                {
                  label: 'FX Gain/Loss per USD',
                  value: `${fx.fxGainLossPerUsd >= 0 ? '+' : ''}${fx.fxGainLossPerUsd.toFixed(2)}`,
                  warn: fx.fxGainLossPerUsd < 0,
                },
                {
                  label: 'FX Gain/Loss Total',
                  value: `৳${fx.fxGainLossTotal.toLocaleString()}`,
                  warn: fx.fxGainLossTotal < 0,
                },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p
                    className="text-sm font-bold mt-0.5"
                    style={{
                      color: item.accent ? GOLD : item.warn ? '#C0392B' : NAVY,
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Create / Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: NAVY }}>
              {editing ? 'Edit Sale Contract' : 'New Sale Contract'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the contract details below. Financial fields are auto-computed server-side.'
                : 'Fill in the contract details. Financial fields are auto-computed server-side.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Buyer */}
            <div className="grid gap-2">
              <Label htmlFor="sale-buyer">Buyer *</Label>
              <Select value={formBuyerId} onValueChange={setFormBuyerId}>
                <SelectTrigger id="sale-buyer" className="w-full">
                  <SelectValue placeholder="Select a buyer" />
                </SelectTrigger>
                <SelectContent>
                  {buyers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} — {b.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contract No */}
            <div className="grid gap-2">
              <Label htmlFor="sale-contractNo">Contract Number *</Label>
              <Input
                id="sale-contractNo"
                placeholder="e.g. SC-2025-001"
                value={formContractNo}
                onChange={(e) => setFormContractNo(e.target.value)}
              />
            </div>

            {/* Contract Date */}
            <div className="grid gap-2">
              <Label htmlFor="sale-date">Contract Date</Label>
              <Input
                id="sale-date"
                type="date"
                value={formContractDate}
                onChange={(e) => setFormContractDate(e.target.value)}
              />
            </div>

            {/* Product Spec */}
            <div className="grid gap-2">
              <Label htmlFor="sale-spec">Product Specification</Label>
              <Input
                id="sale-spec"
                placeholder="e.g. 100% Cotton Yarn 30/1"
                value={formProductSpec}
                onChange={(e) => setFormProductSpec(e.target.value)}
              />
            </div>

            {/* Length & Qty row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sale-length">Length (inch)</Label>
                <Input
                  id="sale-length"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formLengthInch}
                  onChange={(e) => setFormLengthInch(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sale-qty">Quantity (kg)</Label>
                <Input
                  id="sale-qty"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={formQtyKg}
                  onChange={(e) => setFormQtyKg(e.target.value)}
                />
              </div>
            </div>

            {/* USD per kg */}
            <div className="grid gap-2">
              <Label htmlFor="sale-usdPerKg">USD per kg</Label>
              <Input
                id="sale-usdPerKg"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formUsdPerKg}
                onChange={(e) => setFormUsdPerKg(e.target.value)}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              All financial values (USD Value, BDT Value, Cost/kg, Margins, Status) are auto-computed
              on the server.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { resetForm(); setDialogOpen(false); }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ backgroundColor: NAVY }}
            >
              {submitting ? 'Saving...' : editing ? 'Update Contract' : 'Create Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}