'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FactorySummary {
  factoryId: string;
  factoryName: string;
  supervisorName: string;
  location: string;
  lineLeader: string;
  groupHead: string;
  workerCount: number;
  totalInputKg: number;
  outputKg: number;
  totalAGradeKg: number;
  totalBGradeKg: number;
  totalCGradeKg: number;
  totalWastageKg: number;
  grandTotalBdt: number;
  hostingAllowance: number;
  perfBonus: number;
  totalSupPay: number;
  avgCostPerKg: number;
  aGradePct: number;
  latestWipStatus: string;
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

const NAVY = '#1F3864';
const GOLD = '#C9A227';

export default function FactorySection() {
  const [factories, setFactories] = useState<FactorySummary[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<string>('');
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payroll')
      .then(r => r.json())
      .then(res => {
        const data = res.factories || [];
        setFactories(data);
        if (data.length > 0) {
          setSelectedFactory(data[0].factoryId);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFactory) return;
    // Find the factory's internal ID from daily records
    fetch(`/api/daily-records?factoryId=${selectedFactory}&limit=50`)
      .then(r => r.json())
      .then(res => {
        setRecords(res.data || []);
      })
      .catch(() => {
        setRecords([]);
      });
  }, [selectedFactory]);

  const activeFactory = factories.find(f => f.factoryId === selectedFactory);

  // WIP calculations
  const wipInput = records.reduce((s, r) => s + (r.totalInputKg || 0), 0);
  const wipOutput = records.reduce((s, r) => s + (r.totalAGradeKg || 0) + (r.totalBGradeKg || 0) + (r.totalCGradeKg || 0), 0);
  const wipRemaining = wipInput - wipOutput;
  const wipPct = wipInput > 0 ? ((wipRemaining / wipInput) * 100) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Factory Records</h2>

      {/* Factory Selector */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label className="text-sm font-medium" style={{ color: NAVY }}>Select Factory:</label>
            {loading ? (
              <Skeleton className="h-9 w-64" />
            ) : (
              <Select value={selectedFactory} onValueChange={setSelectedFactory}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select factory" />
                </SelectTrigger>
                <SelectContent>
                  {factories.map(f => (
                    <SelectItem key={f.factoryId} value={f.factoryId}>{f.factoryId} - {f.factoryName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {activeFactory && (
        <>
          {/* Supervisor Info */}
          <Card className="border shadow-sm" style={{ backgroundColor: '#F4F6FB' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Supervisor & Factory Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground text-xs">Supervisor</span><p className="font-medium">{activeFactory.supervisorName}</p></div>
                <div><span className="text-muted-foreground text-xs">Location</span><p className="font-medium">{activeFactory.location}</p></div>
                <div><span className="text-muted-foreground text-xs">Line Leader</span><p className="font-medium">{activeFactory.lineLeader}</p></div>
                <div><span className="text-muted-foreground text-xs">Workers</span><p className="font-medium">{activeFactory.workerCount}</p></div>
                <div><span className="text-muted-foreground text-xs">Hosting Allowance</span><p className="font-medium" style={{ color: GOLD }}>৳{activeFactory.hostingAllowance.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground text-xs">Performance Bonus</span><p className="font-medium" style={{ color: GOLD }}>৳{activeFactory.perfBonus.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground text-xs">Total Supervisor Pay</span><p className="font-bold text-base" style={{ color: GOLD }}>৳{activeFactory.totalSupPay.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground text-xs">A-Grade %</span><p className="font-medium" style={{ color: activeFactory.aGradePct >= 60 ? '#16a34a' : '#dc2626' }}>{activeFactory.aGradePct.toFixed(1)}%</p></div>
              </div>
            </CardContent>
          </Card>

          {/* WIP Tracking */}
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
                <div><span className="text-muted-foreground text-xs">Status</span><p><Badge variant={wipPct > 50 ? 'destructive' : 'default'} className="bg-green-100 text-green-800 hover:bg-green-100">{wipPct > 50 ? 'High WIP' : 'On Track'}</Badge></p></div>
              </div>
            </CardContent>
          </Card>

          {/* Worker Level Detail */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Worker Daily Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px]">
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
                      {records.flatMap(r => r.entries || []).length === 0 && (
                        <TableRow><TableCell colSpan={13} className="text-center text-muted-foreground py-8">No worker entries</TableCell></TableRow>
                      )}
                      {records.flatMap(r => (r.entries || []).map(e => ({ ...e, recordDate: r.recordDate, lotNo: r.lot?.lotNo }))).map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-xs font-medium">{entry.worker?.workerId}</TableCell>
                          <TableCell className="text-xs">{entry.worker?.name}</TableCell>
                          <TableCell className="text-xs text-right">{entry.inputGivenKg.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{entry.aWeightKg.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{entry.bWeightKg.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{entry.cWeightKg.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{entry.wastageKg.toFixed(1)}</TableCell>
                          <TableCell className="text-xs"><Badge variant="secondary" className={entry.balanceStatus === 'OK' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>{entry.balanceStatus}</Badge></TableCell>
                          <TableCell className="text-xs text-right">{entry.daysPresent}</TableCell>
                          <TableCell className="text-xs text-right">৳{entry.baseWage.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">৳{entry.attendanceBonus.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right font-bold" style={{ color: GOLD }}>৳{entry.totalPayable.toLocaleString()}</TableCell>
                          <TableCell className="text-xs">{entry.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}