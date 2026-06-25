'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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

interface RiskItem {
  id: string;
  riskId: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  mitigation: string;
  owner: string;
  status: string;
}

interface CategorySummary {
  category: string;
  openRisks: number;
  avgScore: number;
  maxScore: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const NAVY = '#1F3864';
const GOLD = '#C9A227';

const CATEGORIES = [
  'Supply Chain',
  'Quality',
  'Financial',
  'Operational',
  'Regulatory',
  'Market',
  'Logistics',
  'HR',
  'FX',
  'Compliance',
] as const;

const STATUSES = ['Open', 'Mitigated', 'Accepted', 'Closed'] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getScoreColor(score: number): string {
  if (score >= 15) return 'bg-red-100 text-red-800 hover:bg-red-100';
  if (score >= 6) return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
  return 'bg-green-100 text-green-800 hover:bg-green-100';
}

function getStatusStyle(status: string): string {
  if (status === 'Open') return 'bg-red-100 text-red-800 hover:bg-red-100';
  if (status === 'Mitigated') return 'bg-green-100 text-green-800 hover:bg-green-100';
  if (status === 'Accepted') return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
  return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
}

function getCatColor(avg: number): string {
  if (avg >= 15) return 'border-red-300 bg-red-50';
  if (avg >= 6) return 'border-amber-300 bg-amber-50';
  return 'border-green-300 bg-green-50';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RiskSection() {
  const [data, setData] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RiskItem | null>(null);

  // Form state
  const [formRiskId, setFormRiskId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formLikelihood, setFormLikelihood] = useState('');
  const [formImpact, setFormImpact] = useState('');
  const [formMitigation, setFormMitigation] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [formStatus, setFormStatus] = useState('');

  /* ---- Data fetching ---- */

  const fetchData = useCallback(async () => {
    try {
      const res = await erpFetch('/api/risks');
      const json = await res.json();
      setData(json.data || []);
    } catch {
      toast.error('Failed to load risk data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- CRUD helpers ---- */

  const resetForm = () => {
    setFormRiskId('');
    setFormDescription('');
    setFormCategory('');
    setFormLikelihood('');
    setFormImpact('');
    setFormMitigation('');
    setFormOwner('');
    setFormStatus('');
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: RiskItem) => {
    setEditing(item);
    setFormRiskId(item.riskId || '');
    setFormDescription(item.description || '');
    setFormCategory(item.category || '');
    setFormLikelihood(item.likelihood != null ? String(item.likelihood) : '');
    setFormImpact(item.impact != null ? String(item.impact) : '');
    setFormMitigation(item.mitigation || '');
    setFormOwner(item.owner || '');
    setFormStatus(item.status || '');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formRiskId.trim()) { toast.error('Risk ID is required'); return; }
    if (!formCategory) { toast.error('Please select a category'); return; }
    if (!formLikelihood || !formImpact) {
      toast.error('Likelihood and Impact are required (1-5)');
      return;
    }

    const l = parseInt(formLikelihood, 10);
    const i = parseInt(formImpact, 10);
    if (l < 1 || l > 5 || i < 1 || i > 5) {
      toast.error('Likelihood and Impact must be between 1 and 5');
      return;
    }

    const body = {
      riskId: formRiskId.trim(),
      description: formDescription.trim(),
      category: formCategory,
      likelihood: l,
      impact: i,
      mitigation: formMitigation.trim(),
      owner: formOwner.trim(),
      status: formStatus || 'Open',
    };

    setSubmitting(true);
    try {
      if (editing) {
        const res = await erpFetch(`/api/risks/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Update failed'); }
        toast.success('Risk updated');
      } else {
        const res = await erpFetch('/api/risks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Create failed'); }
        toast.success('Risk created');
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

  const handleDelete = async (item: RiskItem) => {
    if (!confirm(`Delete risk "${item.riskId}" — ${item.description.slice(0, 40)}?`)) return;
    try {
      const res = await erpFetch(`/api/risks/${item.id}`, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Delete failed'); }
      toast.success('Risk deleted');
      await fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  /* ---- Category summary ---- */

  const categoryMap = new Map<string, RiskItem[]>();
  data.forEach((r) => {
    const cat = r.category || 'Uncategorized';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(r);
  });

  const categorySummary: CategorySummary[] = Array.from(categoryMap.entries())
    .map(([category, risks]) => {
      const openRisks = risks.filter((r) => r.status === 'Open').length;
      const scores = risks.map((r) => r.riskScore);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const maxScore = Math.max(...scores, 0);
      return { category, openRisks, avgScore, maxScore };
    })
    .sort((a, b) => b.maxScore - a.maxScore);

  /* ---- Render ---- */

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Risk Register</h2>
        <Button onClick={openCreate} size="sm" className="gap-1.5" style={{ backgroundColor: NAVY }}>
          <Plus className="size-4" />
          Add Risk
        </Button>
      </div>

      {/* Risk Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>All Risks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Risk ID</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Description</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Category</TableHead>
                    <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Likelihood</TableHead>
                    <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Impact</TableHead>
                    <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Risk Score</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Mitigation</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Owner</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Status</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No risks registered. Click &quot;Add Risk&quot; to register one.
                      </TableCell>
                    </TableRow>
                  )}

                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-medium whitespace-nowrap">{item.riskId}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{item.description}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{item.category}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap">{item.likelihood}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap">{item.impact}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap">
                        <Badge className={getScoreColor(item.riskScore)}>{item.riskScore}</Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[180px] truncate">{item.mitigation}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{item.owner}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={getStatusStyle(item.status)}>{item.status}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 hover:bg-muted"
                            onClick={() => openEdit(item)}
                            aria-label="Edit risk"
                          >
                            <Pencil className="size-3.5" style={{ color: NAVY }} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 hover:bg-red-50"
                            onClick={() => handleDelete(item)}
                            aria-label="Delete risk"
                          >
                            <Trash2 className="size-3.5 text-red-500" />
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

      {/* Risk Category Summary */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>
            Risk Category Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categorySummary.map((cat) => (
                <Card key={cat.category} className={`border ${getCatColor(cat.avgScore)}`}>
                  <CardContent className="p-4">
                    <p className="text-sm font-bold" style={{ color: NAVY }}>{cat.category}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Open Risks</span>
                        <span className="font-semibold">{cat.openRisks}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Avg Risk Score</span>
                        <span className="font-semibold">{cat.avgScore.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-muted-foreground">Max Score</span>
                        <Badge className={getScoreColor(cat.maxScore)}>{cat.maxScore}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {categorySummary.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-8 text-sm">
                  No risk categories
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Create / Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: NAVY }}>
              {editing ? 'Edit Risk' : 'Register New Risk'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the risk details. Risk score is auto-computed as Likelihood × Impact.'
                : 'Fill in the risk details. Risk score is auto-computed as Likelihood × Impact.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Risk ID */}
            <div className="grid gap-2">
              <Label htmlFor="risk-id">Risk ID *</Label>
              <Input
                id="risk-id"
                placeholder="e.g. R-001"
                value={formRiskId}
                onChange={(e) => setFormRiskId(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="risk-desc">Description</Label>
              <Textarea
                id="risk-desc"
                placeholder="Describe the risk..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label>Category *</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Likelihood & Impact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="risk-likelihood">Likelihood (1-5) *</Label>
                <Select value={formLikelihood} onValueChange={setFormLikelihood}>
                  <SelectTrigger id="risk-likelihood" className="w-full">
                    <SelectValue placeholder="1–5" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="risk-impact">Impact (1-5) *</Label>
                <Select value={formImpact} onValueChange={setFormImpact}>
                  <SelectTrigger id="risk-impact" className="w-full">
                    <SelectValue placeholder="1–5" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live score preview */}
            {formLikelihood && formImpact && (
              <div className="flex items-center gap-2 rounded-md border p-3 bg-muted/40">
                <span className="text-xs text-muted-foreground">Risk Score Preview:</span>
                <Badge className={getScoreColor(parseInt(formLikelihood, 10) * parseInt(formImpact, 10))}>
                  {parseInt(formLikelihood, 10) * parseInt(formImpact, 10)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({formLikelihood} × {formImpact})
                </span>
              </div>
            )}

            {/* Mitigation */}
            <div className="grid gap-2">
              <Label htmlFor="risk-mitigation">Mitigation Strategy</Label>
              <Textarea
                id="risk-mitigation"
                placeholder="Describe the mitigation plan..."
                value={formMitigation}
                onChange={(e) => setFormMitigation(e.target.value)}
                rows={3}
              />
            </div>

            {/* Owner */}
            <div className="grid gap-2">
              <Label htmlFor="risk-owner">Owner</Label>
              <Input
                id="risk-owner"
                placeholder="e.g. John Doe"
                value={formOwner}
                onChange={(e) => setFormOwner(e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {submitting ? 'Saving...' : editing ? 'Update Risk' : 'Create Risk'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}