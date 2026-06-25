'use client';

import { erpFetch } from '@/lib/api-client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import FactoryDrillDown from './FactoryDrillDown';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LineLeader {
  id: string;
  name: string;
  headLeader?: { name: string };
  _count?: { factories: number };
}

interface FactoryItem {
  id: string;
  factoryId: string;
  name: string;
  supervisorName: string;
  supervisorBkash: string | null;
  location: string;
  fuelBdt: number;
  transportBdt: number;
  lineLeaderId: string;
  lineLeader: { id: string; name: string; headLeader?: { name: string } };
  groupHead: string;
  isActive: boolean;
  workers: { id: string }[];
  _count?: { dailyRecords: number };
}

interface WorkerItem {
  id: string;
  workerId: string;
  name: string;
  bKash: string | null;
  factoryId: string;
  isActive: boolean;
}

interface WorkerEntry {
  id: string;
  worker: { workerId: string; name: string };
  inputGivenKg: number;
  aWeightKg: number;
  bWeightKg: number;
  cWeightKg: number;
  wastageKg: number;
  balanceStatus: string;
  daysPresent: number;
  baseWage: number;
  attendanceBonus: number;
  totalPayable: number;
  status: string;
}

interface DailyRecord {
  id: string;
  recordDate: string;
  factory: { factoryId: string; name: string; supervisorName: string; location: string };
  lot: { lotNo: string };
  totalInputKg: number;
  totalAGradeKg: number;
  totalBGradeKg: number;
  totalCGradeKg: number;
  totalWastageKg: number;
  hostingAllowance: number;
  perfBonus: number;
  totalSupPay: number;
  grandTotalBdt: number;
  wipStatus: string;
  entries: WorkerEntry[];
}

interface PayrollSummary {
  factoryId: string;
  supervisorName: string;
  location: string;
  lineLeader: string;
  groupHead: string;
  workerCount: number;
  hostingAllowance: number;
  perfBonus: number;
  totalSupPay: number;
  aGradePct: number;
}

interface LotItem {
  id: string;
  lotNo: string;
  colour: string;
  rawWeightKg: number;
  status: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NAVY = '#1F3864';
const GOLD = '#C9A227';

const emptyFactoryForm = {
  factoryId: '',
  name: '',
  supervisorName: '',
  supervisorBkash: '',
  location: '',
  lineLeaderId: '',
  groupHead: '',
  fuelBdt: 200,
  transportBdt: 150,
  isActive: true,
};

const emptyWorkerForm = {
  workerId: '',
  name: '',
  bKash: '',
  isActive: true,
};

interface WorkerEntryInput {
  workerId: string;
  workerName: string;
  inputGivenKg: string;
  aWeightKg: string;
  bWeightKg: string;
  cWeightKg: string;
  wastageKg: string;
  daysPresent: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FactorySection() {
  // ── Tab ──
  const [activeTab, setActiveTab] = useState('factories');
  const [selectedFactoryId, setSelectedFactoryId] = useState<string | null>(null);

  // ── Shared lookup data ──
  const [lineLeaders, setLineLeaders] = useState<LineLeader[]>([]);
  const [lots, setLots] = useState<LotItem[]>([]);
  const [payrollSummaries, setPayrollSummaries] = useState<PayrollSummary[]>([]);

  // ── Tab 1: Factories ──
  const [factories, setFactories] = useState<FactoryItem[]>([]);
  const [factoriesLoading, setFactoriesLoading] = useState(true);
  const [factoryDialogOpen, setFactoryDialogOpen] = useState(false);
  const [factoryEditId, setFactoryEditId] = useState<string | null>(null);
  const [factoryForm, setFactoryForm] = useState(emptyFactoryForm);
  const [factorySaving, setFactorySaving] = useState(false);
  const [deleteFactoryId, setDeleteFactoryId] = useState<string | null>(null);
  const [deletingFactory, setDeletingFactory] = useState(false);

  // ── Tab 2: Workers ──
  const [workerFactoryId, setWorkerFactoryId] = useState('');
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [workerDialogOpen, setWorkerDialogOpen] = useState(false);
  const [workerEditId, setWorkerEditId] = useState<string | null>(null);
  const [workerForm, setWorkerForm] = useState(emptyWorkerForm);
  const [workerSaving, setWorkerSaving] = useState(false);
  const [deleteWorkerId, setDeleteWorkerId] = useState<string | null>(null);
  const [deletingWorker, setDeletingWorker] = useState(false);

  // ── Tab 3: Daily Records ──
  const [dailyFactoryCode, setDailyFactoryCode] = useState('');
  const [dailyLotId, setDailyLotId] = useState('');
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyDialogOpen, setDailyDialogOpen] = useState(false);
  const [dailySaving, setDailySaving] = useState(false);
  const [dailyRecordDate, setDailyRecordDate] = useState('');
  const [dailyLotSelected, setDailyLotSelected] = useState('');
  const [workerEntries, setWorkerEntries] = useState<WorkerEntryInput[]>([]);

  // ─── Fetch shared data ─────────────────────────────────────────────────────

  const fetchLineLeaders = useCallback(async () => {
    try {
      const res = await erpFetch('/api/line-leaders');
      const json = await res.json();
      setLineLeaders(json.data || []);
    } catch {
      toast.error('Failed to load line leaders');
    }
  }, []);

  const fetchLots = useCallback(async () => {
    try {
      const res = await erpFetch('/api/lots?limit=200');
      const json = await res.json();
      setLots((json.data || []).filter((l: LotItem) => l.status === 'Active'));
    } catch {
      toast.error('Failed to load lots');
    }
  }, []);

  const fetchPayroll = useCallback(async () => {
    try {
      const res = await erpFetch('/api/payroll');
      const json = await res.json();
      setPayrollSummaries(json.factories || []);
    } catch {
      /* silent */
    }
  }, []);

  // ─── Tab 1: Factory CRUD ──────────────────────────────────────────────────

  const fetchFactories = useCallback(async () => {
    setFactoriesLoading(true);
    try {
      const res = await erpFetch('/api/factories?limit=200');
      const json = await res.json();
      setFactories(json.data || []);
    } catch {
      toast.error('Failed to load factories');
    } finally {
      setFactoriesLoading(false);
    }
  }, []);

  const openFactoryDialog = (factory?: FactoryItem) => {
    if (factory) {
      setFactoryEditId(factory.id);
      setFactoryForm({
        factoryId: factory.factoryId,
        name: factory.name,
        supervisorName: factory.supervisorName,
        supervisorBkash: factory.supervisorBkash || '',
        location: factory.location,
        lineLeaderId: factory.lineLeaderId,
        groupHead: factory.groupHead,
        fuelBdt: factory.fuelBdt,
        transportBdt: factory.transportBdt,
        isActive: factory.isActive,
      });
    } else {
      setFactoryEditId(null);
      setFactoryForm(emptyFactoryForm);
    }
    setFactoryDialogOpen(true);
  };

  const saveFactory = async () => {
    if (!factoryForm.factoryId || !factoryForm.name || !factoryForm.supervisorName || !factoryForm.lineLeaderId) {
      toast.error('Factory ID, Name, Supervisor, and Line Leader are required');
      return;
    }
    setFactorySaving(true);
    try {
      const url = factoryEditId ? `/api/factories/${factoryEditId}` : '/api/factories';
      const method = factoryEditId ? 'PUT' : 'POST';
      const res = await erpFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(factoryForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      toast.success(factoryEditId ? 'Factory updated' : 'Factory created');
      setFactoryDialogOpen(false);
      fetchFactories();
      fetchPayroll();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save factory');
    } finally {
      setFactorySaving(false);
    }
  };

  const deleteFactory = async () => {
    if (!deleteFactoryId) return;
    setDeletingFactory(true);
    try {
      const res = await erpFetch(`/api/factories/${deleteFactoryId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }
      toast.success('Factory deleted');
      setDeleteFactoryId(null);
      fetchFactories();
      fetchPayroll();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete factory');
    } finally {
      setDeletingFactory(false);
    }
  };

  // ─── Tab 2: Worker CRUD ───────────────────────────────────────────────────

  const fetchWorkers = useCallback(async (factoryId: string) => {
    setWorkersLoading(true);
    try {
      const res = await erpFetch(`/api/workers?factoryId=${factoryId}&limit=200`);
      const json = await res.json();
      setWorkers(json.data || []);
    } catch {
      toast.error('Failed to load workers');
      setWorkers([]);
    } finally {
      setWorkersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (workerFactoryId) fetchWorkers(workerFactoryId);
    else setWorkers([]);
  }, [workerFactoryId, fetchWorkers]);

  const openWorkerDialog = (worker?: WorkerItem) => {
    if (worker) {
      setWorkerEditId(worker.id);
      setWorkerForm({
        workerId: worker.workerId,
        name: worker.name,
        bKash: worker.bKash || '',
        isActive: worker.isActive,
      });
    } else {
      setWorkerEditId(null);
      setWorkerForm(emptyWorkerForm);
    }
    setWorkerDialogOpen(true);
  };

  const saveWorker = async () => {
    if (!workerForm.workerId || !workerForm.name) {
      toast.error('Worker ID and Name are required');
      return;
    }
    if (!workerFactoryId) {
      toast.error('Select a factory first');
      return;
    }
    setWorkerSaving(true);
    try {
      const url = workerEditId ? `/api/workers/${workerEditId}` : '/api/workers';
      const method = workerEditId ? 'PUT' : 'POST';
      const res = await erpFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...workerForm, factoryId: workerFactoryId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      toast.success(workerEditId ? 'Worker updated' : 'Worker created');
      setWorkerDialogOpen(false);
      fetchWorkers(workerFactoryId);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save worker');
    } finally {
      setWorkerSaving(false);
    }
  };

  const deleteWorker = async () => {
    if (!deleteWorkerId) return;
    setDeletingWorker(true);
    try {
      const res = await erpFetch(`/api/workers/${deleteWorkerId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }
      toast.success('Worker deleted');
      setDeleteWorkerId(null);
      if (workerFactoryId) fetchWorkers(workerFactoryId);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete worker');
    } finally {
      setDeletingWorker(false);
    }
  };

  // ─── Tab 3: Daily Records ─────────────────────────────────────────────────

  const fetchDailyRecords = useCallback(async (factoryCode: string) => {
    if (!factoryCode) { setDailyRecords([]); return; }
    setDailyLoading(true);
    try {
      const res = await erpFetch(`/api/daily-records?factoryId=${factoryCode}&limit=100`);
      const json = await res.json();
      setDailyRecords(json.data || []);
    } catch {
      toast.error('Failed to load daily records');
      setDailyRecords([]);
    } finally {
      setDailyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dailyFactoryCode) fetchDailyRecords(dailyFactoryCode);
    else setDailyRecords([]);
  }, [dailyFactoryCode, fetchDailyRecords]);

  const openDailyDialog = async () => {
    if (!dailyFactoryCode) { toast.error('Select a factory first'); return; }
    const factory = factories.find(f => f.factoryId === dailyFactoryCode);
    if (!factory) { toast.error('Factory not found'); return; }
    setDailyRecordDate(new Date().toISOString().split('T')[0]);
    setDailyLotSelected('');
    // Fetch active workers for this factory
    try {
      const res = await erpFetch(`/api/workers?factoryId=${factory.id}&limit=200`);
      const json = await res.json();
      const wks = json.data || [];
      setWorkerEntries(wks.map((w: WorkerItem) => ({
        workerId: w.id,
        workerName: w.name,
        inputGivenKg: '',
        aWeightKg: '',
        bWeightKg: '',
        cWeightKg: '',
        wastageKg: '',
        daysPresent: '',
      })));
    } catch {
      toast.error('Failed to load workers for daily record');
      return;
    }
    setDailyDialogOpen(true);
  };

  const updateWorkerEntry = (index: number, field: keyof WorkerEntryInput, value: string) => {
    setWorkerEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const saveDailyRecord = async () => {
    if (!dailyRecordDate) { toast.error('Select a date'); return; }
    if (!dailyLotSelected) { toast.error('Select a lot'); return; }
    const factory = factories.find(f => f.factoryId === dailyFactoryCode);
    if (!factory) { toast.error('Factory not found'); return; }

    const validEntries = workerEntries
      .filter(e => parseFloat(e.inputGivenKg) > 0)
      .map(e => ({
        workerId: e.workerId,
        inputGivenKg: parseFloat(e.inputGivenKg) || 0,
        aWeightKg: parseFloat(e.aWeightKg) || 0,
        bWeightKg: parseFloat(e.bWeightKg) || 0,
        cWeightKg: parseFloat(e.cWeightKg) || 0,
        wastageKg: parseFloat(e.wastageKg) || 0,
        daysPresent: parseInt(e.daysPresent) || 0,
      }));

    if (validEntries.length === 0) {
      toast.error('Enter at least one worker entry with input kg');
      return;
    }

    setDailySaving(true);
    try {
      const res = await erpFetch('/api/daily-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordDate: dailyRecordDate,
          factoryId: factory.id,
          lotId: dailyLotSelected,
          entries: validEntries,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      toast.success('Daily record created');
      setDailyDialogOpen(false);
      fetchDailyRecords(dailyFactoryCode);
      fetchPayroll();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save daily record');
    } finally {
      setDailySaving(false);
    }
  };

  // ─── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchFactories();
    fetchLineLeaders();
    fetchLots();
    fetchPayroll();
  }, [fetchFactories, fetchLineLeaders, fetchLots, fetchPayroll]);

  // ─── Computed ──────────────────────────────────────────────────────────────

  const activePayroll = payrollSummaries.find(p => p.factoryId === dailyFactoryCode);
  const wipInput = dailyRecords.reduce((s, r) => s + (r.totalInputKg || 0), 0);
  const wipOutput = dailyRecords.reduce((s, r) => s + (r.totalAGradeKg || 0) + (r.totalBGradeKg || 0) + (r.totalCGradeKg || 0), 0);
  const wipRemaining = wipInput - wipOutput;
  const wipPct = wipInput > 0 ? ((wipRemaining / wipInput) * 100) : 0;

  // ─── Render ────────────────────────────────────────────────────────────────

  if (selectedFactoryId) {
    return <FactoryDrillDown factoryId={selectedFactoryId} onBack={() => setSelectedFactoryId(null)} />;
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3" style={{ backgroundColor: NAVY }}>
          <TabsTrigger value="factories" className="data-[state=active]:bg-white data-[state=active]:text-[#1F3864] text-white/80">
            <Building2 className="mr-2 h-4 w-4" /> Factories
          </TabsTrigger>
          <TabsTrigger value="workers" className="data-[state=active]:bg-white data-[state=active]:text-[#1F3864] text-white/80">
            <Users className="mr-2 h-4 w-4" /> Workers
          </TabsTrigger>
          <TabsTrigger value="daily-records" className="data-[state=active]:bg-white data-[state=active]:text-[#1F3864] text-white/80">
            <FileText className="mr-2 h-4 w-4" /> Daily Records
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════ TAB 1: FACTORIES ═══════════════════════ */}
        <TabsContent value="factories" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: NAVY }}>Factory Management</h2>
            <Button onClick={() => openFactoryDialog()} style={{ backgroundColor: NAVY }} className="text-white hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" /> Add Factory
            </Button>
          </div>

          <Card className="border shadow-sm">
            <CardContent className="p-0">
              {factoriesLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#F4F6FB' }}>
                        <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Factory ID</TableHead>
                        <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Name</TableHead>
                        <TableHead className="text-xs font-bold hidden md:table-cell" style={{ color: NAVY }}>Supervisor</TableHead>
                        <TableHead className="text-xs font-bold hidden lg:table-cell" style={{ color: NAVY }}>Location</TableHead>
                        <TableHead className="text-xs font-bold hidden lg:table-cell" style={{ color: NAVY }}>Line Leader</TableHead>
                        <TableHead className="text-xs font-bold hidden xl:table-cell" style={{ color: NAVY }}>Group Head</TableHead>
                        <TableHead className="text-xs font-bold text-center" style={{ color: NAVY }}>Workers</TableHead>
                        <TableHead className="text-xs font-bold text-center" style={{ color: NAVY }}>Active</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {factories.length === 0 && (
                        <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No factories found</TableCell></TableRow>
                      )}
                      {factories.map(f => (
                        <TableRow key={f.id}>
                          <TableCell className="text-xs font-medium">{f.factoryId}</TableCell>
                          <TableCell className="text-xs">{f.name}</TableCell>
                          <TableCell className="text-xs hidden md:table-cell">{f.supervisorName}</TableCell>
                          <TableCell className="text-xs hidden lg:table-cell">{f.location}</TableCell>
                          <TableCell className="text-xs hidden lg:table-cell">{f.lineLeader.name}</TableCell>
                          <TableCell className="text-xs hidden xl:table-cell">{f.groupHead}</TableCell>
                          <TableCell className="text-xs text-center">{f.workers.length}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className={f.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                              {f.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedFactoryId(f.id)} title="View Drilldown">
                                <Eye className="h-3.5 w-3.5" style={{ color: GOLD }} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openFactoryDialog(f)}>
                                <Pencil className="h-3.5 w-3.5" style={{ color: NAVY }} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteFactoryId(f.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
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
        </TabsContent>

        {/* ═══════════════════════════ TAB 2: WORKERS ═════════════════════════ */}
        <TabsContent value="workers" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold" style={{ color: NAVY }}>Workers</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={workerFactoryId} onValueChange={setWorkerFactoryId}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Select factory" />
                </SelectTrigger>
                <SelectContent>
                  {factories.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.factoryId} — {f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => openWorkerDialog()} disabled={!workerFactoryId} style={{ backgroundColor: NAVY }} className="text-white hover:opacity-90 shrink-0">
                <Plus className="mr-2 h-4 w-4" /> Add Worker
              </Button>
            </div>
          </div>

          {!workerFactoryId && (
            <Card className="border"><CardContent className="py-12 text-center text-muted-foreground">Select a factory to view workers</CardContent></Card>
          )}

          {workerFactoryId && (
            <Card className="border shadow-sm">
              <CardContent className="p-0">
                {workersLoading ? (
                  <div className="p-4 space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#F4F6FB' }}>
                          <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Worker ID</TableHead>
                          <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Name</TableHead>
                          <TableHead className="text-xs font-bold hidden sm:table-cell" style={{ color: NAVY }}>bKash</TableHead>
                          <TableHead className="text-xs font-bold text-center" style={{ color: NAVY }}>Active</TableHead>
                          <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workers.length === 0 && (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No workers found</TableCell></TableRow>
                        )}
                        {workers.map(w => (
                          <TableRow key={w.id}>
                            <TableCell className="text-xs font-medium">{w.workerId}</TableCell>
                            <TableCell className="text-xs">{w.name}</TableCell>
                            <TableCell className="text-xs hidden sm:table-cell">{w.bKash || '—'}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className={w.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                                {w.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openWorkerDialog(w)}>
                                  <Pencil className="h-3.5 w-3.5" style={{ color: NAVY }} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteWorkerId(w.id)}>
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
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
          )}
        </TabsContent>

        {/* ═══════════════════════ TAB 3: DAILY RECORDS ═══════════════════════ */}
        <TabsContent value="daily-records" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold" style={{ color: NAVY }}>Daily Production Records</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={dailyFactoryCode} onValueChange={setDailyFactoryCode}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Factory" />
                </SelectTrigger>
                <SelectContent>
                  {factories.map(f => (
                    <SelectItem key={f.factoryId} value={f.factoryId}>{f.factoryId} — {f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={openDailyDialog} disabled={!dailyFactoryCode} style={{ backgroundColor: NAVY }} className="text-white hover:opacity-90 shrink-0">
                <Plus className="mr-2 h-4 w-4" /> Add Daily Record
              </Button>
            </div>
          </div>

          {!dailyFactoryCode && (
            <Card className="border"><CardContent className="py-12 text-center text-muted-foreground">Select a factory to view daily records</CardContent></Card>
          )}

          {dailyFactoryCode && (
            <>
              {/* Supervisor Info Card */}
              {activePayroll && (
                <Card className="border shadow-sm" style={{ backgroundColor: '#F4F6FB' }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Supervisor & Factory Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-muted-foreground text-xs">Supervisor</span><p className="font-medium">{activePayroll.supervisorName}</p></div>
                      <div><span className="text-muted-foreground text-xs">Location</span><p className="font-medium">{activePayroll.location}</p></div>
                      <div><span className="text-muted-foreground text-xs">Line Leader</span><p className="font-medium">{activePayroll.lineLeader}</p></div>
                      <div><span className="text-muted-foreground text-xs">Workers</span><p className="font-medium">{activePayroll.workerCount}</p></div>
                      <div><span className="text-muted-foreground text-xs">Hosting Allowance</span><p className="font-medium" style={{ color: GOLD }}>৳{activePayroll.hostingAllowance.toLocaleString()}</p></div>
                      <div><span className="text-muted-foreground text-xs">Performance Bonus</span><p className="font-medium" style={{ color: GOLD }}>৳{activePayroll.perfBonus.toLocaleString()}</p></div>
                      <div><span className="text-muted-foreground text-xs">Total Supervisor Pay</span><p className="font-bold text-base" style={{ color: GOLD }}>৳{activePayroll.totalSupPay.toLocaleString()}</p></div>
                      <div><span className="text-muted-foreground text-xs">A-Grade %</span><p className="font-medium" style={{ color: activePayroll.aGradePct >= 60 ? '#16a34a' : '#dc2626' }}>{activePayroll.aGradePct.toFixed(1)}%</p></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* WIP Tracking Card */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>WIP Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div><span className="text-muted-foreground text-xs">Lot Received</span><p className="font-medium">{wipInput.toFixed(1)} kg</p></div>
                    <div><span className="text-muted-foreground text-xs">Work Completed</span><p className="font-medium">{wipOutput.toFixed(1)} kg</p></div>
                    <div><span className="text-muted-foreground text-xs">WIP Remaining</span><p className="font-bold" style={{ color: GOLD }}>{wipRemaining.toFixed(1)} kg</p></div>
                    <div><span className="text-muted-foreground text-xs">WIP %</span><p className="font-medium">{wipPct.toFixed(1)}%</p></div>
                    <div><span className="text-muted-foreground text-xs">Status</span>
                      <p><Badge variant="secondary" className={wipPct > 50 ? 'bg-red-100 text-red-800 hover:bg-red-100' : 'bg-green-100 text-green-800 hover:bg-green-100'}>{wipPct > 50 ? 'High WIP' : 'On Track'}</Badge></p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Records Table */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Worker Daily Detail</CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyLoading ? (
                    <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Worker ID</TableHead>
                            <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Name</TableHead>
                            <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Input (kg)</TableHead>
                            <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>A-Wt</TableHead>
                            <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>B-Wt</TableHead>
                            <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>C-Wt</TableHead>
                            <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Wastage</TableHead>
                            <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Balance</TableHead>
                            <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Days</TableHead>
                            <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Base Wage</TableHead>
                            <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Att Bonus</TableHead>
                            <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Total Pay</TableHead>
                            <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailyRecords.flatMap(r => r.entries || []).length === 0 && (
                            <TableRow><TableCell colSpan={13} className="text-center text-muted-foreground py-8">No worker entries</TableCell></TableRow>
                          )}
                          {dailyRecords.flatMap(r =>
                            (r.entries || []).map(e => ({ ...e, recordDate: r.recordDate, lotNo: r.lot?.lotNo }))
                          ).map(entry => (
                            <TableRow key={entry.id}>
                              <TableCell className="text-xs font-medium">{entry.worker?.workerId}</TableCell>
                              <TableCell className="text-xs">{entry.worker?.name}</TableCell>
                              <TableCell className="text-xs text-right">{entry.inputGivenKg.toFixed(1)}</TableCell>
                              <TableCell className="text-xs text-right">{entry.aWeightKg.toFixed(1)}</TableCell>
                              <TableCell className="text-xs text-right">{entry.bWeightKg.toFixed(1)}</TableCell>
                              <TableCell className="text-xs text-right">{entry.cWeightKg.toFixed(1)}</TableCell>
                              <TableCell className="text-xs text-right">{entry.wastageKg.toFixed(1)}</TableCell>
                              <TableCell className="text-xs">
                                <Badge variant="secondary" className={entry.balanceStatus === 'OK' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                                  {entry.balanceStatus}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-right">{entry.daysPresent}</TableCell>
                              <TableCell className="text-xs text-right">৳{entry.baseWage.toLocaleString()}</TableCell>
                              <TableCell className="text-xs text-right">৳{entry.attendanceBonus.toLocaleString()}</TableCell>
                              <TableCell className="text-xs text-right font-bold" style={{ color: GOLD }}>৳{entry.totalPayable.toLocaleString()}</TableCell>
                              <TableCell className="text-xs">{entry.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══════════════════ FACTORY DIALOG ═══════════════════ */}
      <Dialog open={factoryDialogOpen} onOpenChange={setFactoryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: NAVY }}>{factoryEditId ? 'Edit Factory' : 'Add Factory'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Factory ID *</Label>
              <Input className="h-9" placeholder="e.g. F001" value={factoryForm.factoryId} onChange={e => setFactoryForm(p => ({ ...p, factoryId: e.target.value }))} disabled={!!factoryEditId} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Name *</Label>
              <Input className="h-9" placeholder="Factory name" value={factoryForm.name} onChange={e => setFactoryForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Supervisor Name *</Label>
              <Input className="h-9" placeholder="Supervisor" value={factoryForm.supervisorName} onChange={e => setFactoryForm(p => ({ ...p, supervisorName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Supervisor bKash</Label>
              <Input className="h-9" placeholder="bKash number" value={factoryForm.supervisorBkash} onChange={e => setFactoryForm(p => ({ ...p, supervisorBkash: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Location</Label>
              <Input className="h-9" placeholder="Location" value={factoryForm.location} onChange={e => setFactoryForm(p => ({ ...p, location: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Line Leader *</Label>
              <Select value={factoryForm.lineLeaderId} onValueChange={v => setFactoryForm(p => ({ ...p, lineLeaderId: v }))}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {lineLeaders.map(ll => (
                    <SelectItem key={ll.id} value={ll.id}>{ll.name}{ll.headLeader ? ` (${ll.headLeader.name})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Group Head</Label>
              <Input className="h-9" placeholder="Group head" value={factoryForm.groupHead} onChange={e => setFactoryForm(p => ({ ...p, groupHead: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Fuel (BDT)</Label>
              <Input type="number" className="h-9" value={factoryForm.fuelBdt} onChange={e => setFactoryForm(p => ({ ...p, fuelBdt: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Transport (BDT)</Label>
              <Input type="number" className="h-9" value={factoryForm.transportBdt} onChange={e => setFactoryForm(p => ({ ...p, transportBdt: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={factoryForm.isActive} onCheckedChange={v => setFactoryForm(p => ({ ...p, isActive: v }))} />
              <Label className="text-xs">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFactoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveFactory} disabled={factorySaving} style={{ backgroundColor: NAVY }} className="text-white hover:opacity-90">
              {factorySaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {factoryEditId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ WORKER DIALOG ═══════════════════ */}
      <Dialog open={workerDialogOpen} onOpenChange={setWorkerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: NAVY }}>{workerEditId ? 'Edit Worker' : 'Add Worker'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Worker ID *</Label>
              <Input className="h-9" placeholder="e.g. W001" value={workerForm.workerId} onChange={e => setWorkerForm(p => ({ ...p, workerId: e.target.value }))} disabled={!!workerEditId} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Name *</Label>
              <Input className="h-9" placeholder="Worker name" value={workerForm.name} onChange={e => setWorkerForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">bKash</Label>
              <Input className="h-9" placeholder="bKash number" value={workerForm.bKash} onChange={e => setWorkerForm(p => ({ ...p, bKash: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={workerForm.isActive} onCheckedChange={v => setWorkerForm(p => ({ ...p, isActive: v }))} />
              <Label className="text-xs">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkerDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveWorker} disabled={workerSaving} style={{ backgroundColor: NAVY }} className="text-white hover:opacity-90">
              {workerSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {workerEditId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ DAILY RECORD DIALOG ═══════════════════ */}
      <Dialog open={dailyDialogOpen} onOpenChange={setDailyDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle style={{ color: NAVY }}>Add Daily Record</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Record Date *</Label>
              <Input type="date" className="h-9" value={dailyRecordDate} onChange={e => setDailyRecordDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Lot *</Label>
              <Select value={dailyLotSelected} onValueChange={setDailyLotSelected}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select lot" /></SelectTrigger>
                <SelectContent>
                  {lots.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.lotNo} — {l.colour} ({l.rawWeightKg} kg)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs font-semibold mt-2 mb-1" style={{ color: NAVY }}>
            Worker Entries ({workerEntries.length} workers)
          </div>

          <ScrollArea className="flex-1 min-h-0 max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#F4F6FB' }}>
                  <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Worker</TableHead>
                  <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Input (kg)</TableHead>
                  <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>A-Wt</TableHead>
                  <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>B-Wt</TableHead>
                  <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>C-Wt</TableHead>
                  <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Wastage</TableHead>
                  <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workerEntries.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No active workers in this factory</TableCell></TableRow>
                )}
                {workerEntries.map((entry, idx) => (
                  <TableRow key={entry.workerId}>
                    <TableCell className="text-xs font-medium py-1.5">{entry.workerName}</TableCell>
                    <TableCell className="py-1.5">
                      <Input type="number" step="0.1" className="h-7 w-20 text-xs text-right ml-auto" placeholder="0" value={entry.inputGivenKg} onChange={e => updateWorkerEntry(idx, 'inputGivenKg', e.target.value)} />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Input type="number" step="0.1" className="h-7 w-20 text-xs text-right ml-auto" placeholder="0" value={entry.aWeightKg} onChange={e => updateWorkerEntry(idx, 'aWeightKg', e.target.value)} />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Input type="number" step="0.1" className="h-7 w-20 text-xs text-right ml-auto" placeholder="0" value={entry.bWeightKg} onChange={e => updateWorkerEntry(idx, 'bWeightKg', e.target.value)} />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Input type="number" step="0.1" className="h-7 w-20 text-xs text-right ml-auto" placeholder="0" value={entry.cWeightKg} onChange={e => updateWorkerEntry(idx, 'cWeightKg', e.target.value)} />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Input type="number" step="0.1" className="h-7 w-20 text-xs text-right ml-auto" placeholder="0" value={entry.wastageKg} onChange={e => updateWorkerEntry(idx, 'wastageKg', e.target.value)} />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Input type="number" className="h-7 w-16 text-xs text-right ml-auto" placeholder="0" value={entry.daysPresent} onChange={e => updateWorkerEntry(idx, 'daysPresent', e.target.value)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDailyDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveDailyRecord} disabled={dailySaving} style={{ backgroundColor: NAVY }} className="text-white hover:opacity-90">
              {dailySaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ DELETE FACTORY ALERT ═══════════════════ */}
      <AlertDialog open={!!deleteFactoryId} onOpenChange={open => !open && setDeleteFactoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Factory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this factory? This action cannot be undone. Factories with workers or daily records cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingFactory}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFactory} disabled={deletingFactory} className="bg-red-600 hover:bg-red-700 text-white">
              {deletingFactory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════ DELETE WORKER ALERT ═══════════════════ */}
      <AlertDialog open={!!deleteWorkerId} onOpenChange={open => !open && setDeleteWorkerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this worker? This action cannot be undone. Workers with existing daily entries cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingWorker}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteWorker} disabled={deletingWorker} className="bg-red-600 hover:bg-red-700 text-white">
              {deletingWorker && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}