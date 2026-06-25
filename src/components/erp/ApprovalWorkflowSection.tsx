'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckSquare, Check, X } from 'lucide-react';
import { useErpStore } from '@/lib/store';
import { toast } from 'sonner';

interface Entry {
  id: string; worker: { id: string; workerId: string; name: string; factory: { id: string; name: string } };
  record: { recordDate: string; factory: { name: string }; lot: { lotNo: string } };
  inputGivenKg: number; aWeightKg: number; bWeightKg: number; cWeightKg: number;
  totalPayable: number; status: string;
}

const STATUS_LIST = ['Pending Approval', 'LL Reviewed', 'HL Reviewed', 'PM Approved', 'Owner Approved', 'Rejected'];
const STATUS_COLORS: Record<string, string> = {
  'Pending Approval': 'bg-amber-100 text-amber-800', 'LL Reviewed': 'bg-blue-100 text-blue-800',
  'HL Reviewed': 'bg-indigo-100 text-indigo-800', 'PM Approved': 'bg-violet-100 text-violet-800',
  'Owner Approved': 'bg-emerald-100 text-emerald-800', 'Rejected': 'bg-red-100 text-red-800',
};

export default function ApprovalWorkflowSection() {
  const { user } = useErpStore();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [factories, setFactories] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [factoryFilter, setFactoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.set('status', statusFilter);
      const res = await fetch(`/api/approval-workflow?${params}&limit=100`);
      if (res.ok) {
        const d = await res.json();
        setEntries(d.data || []);
        setCounts(d.counts || {});
        const fSet = new Set<string>();
        (d.data || []).forEach((e: Entry) => { if (e.record?.factory?.name) fSet.add(e.record.factory.name); });
        setFactories(Array.from(fSet).sort());
      }
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const display = factoryFilter === 'All' ? entries : entries.filter((e) => e.record?.factory?.name === factoryFilter);

  const getAvailableActions = (status: string) => {
    const role = user?.role || '';
    switch (status) {
      case 'Pending Approval': return role === 'line_leader' || role === 'admin' || role === 'owner' ? ['LL Review', 'Reject'] : [];
      case 'LL Reviewed': return role === 'head_leader' || role === 'admin' || role === 'owner' ? ['HL Review', 'Reject'] : [];
      case 'HL Reviewed': return role === 'pm' || role === 'admin' || role === 'owner' ? ['PM Approve', 'Reject'] : [];
      case 'PM Approved': return role === 'owner' || role === 'admin' ? ['Final Approve', 'Reject'] : [];
      default: return [];
    }
  };

  const requestAction = (id: string, action: string) => {
    setConfirmAction({ id, action });
    setConfirmOpen(true);
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    try {
      await fetch('/api/approval-workflow', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmAction.id, action: confirmAction.action, performedBy: user?.displayName || user?.username || 'system' }),
      });
      toast.success(confirmAction.action === 'Reject' ? 'Entry rejected' : 'Approval recorded');
      fetchData();
    } catch { toast.error('Action failed'); }
    setConfirmOpen(false); setConfirmAction(null);
  };

  const summaryCards = [
    { label: 'Pending', status: 'Pending Approval', color: 'text-amber-600' },
    { label: 'LL Reviewed', status: 'LL Reviewed', color: 'text-blue-600' },
    { label: 'HL Reviewed', status: 'HL Reviewed', color: 'text-indigo-600' },
    { label: 'PM Approved', status: 'PM Approved', color: 'text-violet-600' },
    { label: 'Owner Approved', status: 'Owner Approved', color: 'text-emerald-600' },
    { label: 'Rejected', status: 'Rejected', color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CheckSquare className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Approval Workflow</h2>
        {user && <Badge variant="outline" className="text-xs">Role: {user.role}</Badge>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((c) => (
          <Card key={c.status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(statusFilter === c.status ? 'All' : c.status)}>
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${c.color}`}>{counts[c.status] || 0}</p>
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline visualization */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STATUS_LIST.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-shrink-0">
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${statusFilter === s ? 'border-primary bg-primary/10' : 'border-border'}`}>
              {s}
            </div>
            {i < STATUS_LIST.length - 1 && <div className="text-muted-foreground">→</div>}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={factoryFilter} onValueChange={setFactoryFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Factory" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Factories</SelectItem>
            {factories.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? <p className="text-muted-foreground py-8 text-center">Loading...</p> : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Factory</TableHead><TableHead>Worker</TableHead>
                    <TableHead>Input</TableHead><TableHead>A</TableHead><TableHead>B</TableHead><TableHead>C</TableHead>
                    <TableHead>Pay</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {display.map((e) => {
                    const actions = getAvailableActions(e.status);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(e.record?.recordDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm">{e.record?.factory?.name || '-'}</TableCell>
                        <TableCell className="font-medium text-sm">{e.worker?.name}</TableCell>
                        <TableCell>{e.inputGivenKg} kg</TableCell>
                        <TableCell className="text-emerald-600">{e.aWeightKg} kg</TableCell>
                        <TableCell className="text-amber-600">{e.bWeightKg} kg</TableCell>
                        <TableCell className="text-red-600">{e.cWeightKg} kg</TableCell>
                        <TableCell className="font-mono text-sm">৳{Math.round(e.totalPayable)}</TableCell>
                        <TableCell><Badge className={`text-xs ${STATUS_COLORS[e.status] || ''}`}>{e.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {actions.map((a) => (
                              <Button key={a} variant={a === 'Reject' ? 'destructive' : 'default'} size="sm" className="h-7 text-xs" onClick={() => requestAction(e.id, a)}>
                                {a === 'Reject' ? <X className="h-3 w-3 mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                                {a}
                              </Button>
                            ))}
                            {actions.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {display.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No entries found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {confirmAction?.action === 'Reject' ? 'Rejection' : 'Approval'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmAction?.action?.toLowerCase()} this daily entry? This action will be recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction} className={confirmAction?.action === 'Reject' ? 'bg-red-600 hover:bg-red-700' : ''}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}