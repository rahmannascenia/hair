'use client';

import { useEffect, useState, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WorkerEntry {
  worker: { workerId: string; name: string };
  inputGivenKg: number;
  aWeightKg: number;
  bWeightKg: number;
  cWeightKg: number;
  wastageKg: number;
  balanceStatus: string;
}

interface QcRecord {
  factory: { factoryId: string; name: string; supervisorName: string };
  lot: { lotNo: string };
  totalInputKg: number;
  totalAGradeKg: number;
  totalBGradeKg: number;
  totalCGradeKg: number;
  totalWastageKg: number;
  totalPayrollBdt: number;
  grandTotalBdt: number;
  wipStatus: string;
  entries?: WorkerEntry[];
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';

export default function QcSection() {
  const [records, setRecords] = useState<QcRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily-records?limit=200')
      .then(r => r.json())
      .then(res => {
        setRecords(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totals = records.reduce((acc, r) => ({
    input: acc.input + (r.totalInputKg || 0),
    a: acc.a + (r.totalAGradeKg || 0),
    b: acc.b + (r.totalBGradeKg || 0),
    c: acc.c + (r.totalCGradeKg || 0),
    wastage: acc.wastage + (r.totalWastageKg || 0),
  }), { input: 0, a: 0, b: 0, c: 0, wastage: 0 });

  const totalOutput = totals.a + totals.b + totals.c;

  // Section B: Flatten all workers
  const allWorkers: {
    factoryId: string; factoryName: string; name: string; workerId: string;
    inputKg: number; aKg: number; bKg: number; cKg: number; wastageKg: number;
    outputKg: number; aPct: number;
  }[] = [];
  records.forEach(r => {
    (r.entries || []).forEach(e => {
      const out = (e.aWeightKg || 0) + (e.bWeightKg || 0) + (e.cWeightKg || 0);
      allWorkers.push({
        factoryId: r.factory?.factoryId || '',
        factoryName: r.factory?.name || '',
        name: e.worker?.name || '',
        workerId: e.worker?.workerId || '',
        inputKg: e.inputGivenKg || 0,
        aKg: e.aWeightKg || 0,
        bKg: e.bWeightKg || 0,
        cKg: e.cWeightKg || 0,
        wastageKg: e.wastageKg || 0,
        outputKg: out,
        aPct: out > 0 ? (e.aWeightKg / out) * 100 : 0,
      });
    });
  });

  // Section C: Discrepancy cross-check (factory input vs QC summary)
  const discrepancies = records.map(r => {
    const workerInputSum = (r.entries || []).reduce((s, e) => s + (e.inputGivenKg || 0), 0);
    const workerOutputSum = (r.entries || []).reduce((s, e) => s + (e.aWeightKg || 0) + (e.bWeightKg || 0) + (e.cWeightKg || 0) + (e.wastageKg || 0), 0);
    const inputMatch = Math.abs(r.totalInputKg - workerInputSum) < 0.01;
    const aMatch = Math.abs(r.totalAGradeKg - (r.entries || []).reduce((s, e) => s + (e.aWeightKg || 0), 0)) < 0.01;
    const bMatch = Math.abs(r.totalBGradeKg - (r.entries || []).reduce((s, e) => s + (e.bWeightKg || 0), 0)) < 0.01;
    const cMatch = Math.abs(r.totalCGradeKg - (r.entries || []).reduce((s, e) => s + (e.cWeightKg || 0), 0)) < 0.01;
    const wasteMatch = Math.abs(r.totalWastageKg - (r.entries || []).reduce((s, e) => s + (e.wastageKg || 0), 0)) < 0.01;
    const allOk = inputMatch && aMatch && bMatch && cMatch && wasteMatch;
    return {
      factoryId: r.factory?.factoryId || '',
      supervisor: r.factory?.supervisorName || '',
      lot: r.lot?.lotNo || '',
      recordInput: r.totalInputKg,
      workerInputSum,
      recordA: r.totalAGradeKg,
      workerASum: (r.entries || []).reduce((s, e) => s + (e.aWeightKg || 0), 0),
      recordOutput: r.totalAGradeKg + r.totalBGradeKg + r.totalCGradeKg,
      workerOutputSum: workerOutputSum - (r.entries || []).reduce((s, e) => s + (e.wastageKg || 0), 0),
      ok: allOk,
    };
  });

  // Section D: Company performance KPIs
  const totalWorkers = allWorkers.length;
  const companyA = totals.a;
  const companyB = totals.b;
  const companyC = totals.c;
  const aPct = totalOutput > 0 ? (companyA / totalOutput) * 100 : 0;
  const bPct = totalOutput > 0 ? (companyB / totalOutput) * 100 : 0;
  const cPct = totalOutput > 0 ? (companyC / totalOutput) * 100 : 0;

  const renderLoading = () => (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>QC & Grading</h2>

      <Tabs defaultValue="supervisor" className="w-full">
        <TabsList>
          <TabsTrigger value="supervisor">A: Supervisor Summary</TabsTrigger>
          <TabsTrigger value="worker">B: Worker Detail</TabsTrigger>
          <TabsTrigger value="discrepancy">C: Discrepancy Check</TabsTrigger>
          <TabsTrigger value="performance">D: Company Performance</TabsTrigger>
        </TabsList>

        {/* Section A: Supervisor Summary */}
        <TabsContent value="supervisor">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Grade Summary by Factory</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? renderLoading() : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Factory</TableHead>
                        <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Supervisor</TableHead>
                        <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Lot</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Input</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>A-Wt</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>A%</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>B-Wt</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>B%</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>C-Wt</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>C%</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Wastage</TableHead>
                        <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.length === 0 && (
                        <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>
                      )}
                      {records.map((r, idx) => {
                        const output = (r.totalAGradeKg || 0) + (r.totalBGradeKg || 0) + (r.totalCGradeKg || 0);
                        return (
                          <TableRow key={idx}>
                            <TableCell className="text-xs font-medium">{r.factory?.factoryId}</TableCell>
                            <TableCell className="text-xs">{r.factory?.supervisorName}</TableCell>
                            <TableCell className="text-xs">{r.lot?.lotNo}</TableCell>
                            <TableCell className="text-xs text-right">{r.totalInputKg.toFixed(1)}</TableCell>
                            <TableCell className="text-xs text-right font-medium">{r.totalAGradeKg.toFixed(1)}</TableCell>
                            <TableCell className="text-xs text-right" style={{ color: GOLD }}>{output > 0 ? ((r.totalAGradeKg / output) * 100).toFixed(0) + '%' : '-'}</TableCell>
                            <TableCell className="text-xs text-right">{r.totalBGradeKg.toFixed(1)}</TableCell>
                            <TableCell className="text-xs text-right">{output > 0 ? ((r.totalBGradeKg / output) * 100).toFixed(0) + '%' : '-'}</TableCell>
                            <TableCell className="text-xs text-right">{r.totalCGradeKg.toFixed(1)}</TableCell>
                            <TableCell className="text-xs text-right">{output > 0 ? ((r.totalCGradeKg / output) * 100).toFixed(0) + '%' : '-'}</TableCell>
                            <TableCell className="text-xs text-right">{r.totalWastageKg.toFixed(1)}</TableCell>
                            <TableCell className="text-xs">{r.wipStatus}</TableCell>
                          </TableRow>
                        );
                      })}
                      {records.length > 0 && (
                        <TableRow className="bg-muted/50 font-semibold">
                          <TableCell className="text-xs" style={{ color: NAVY }}>COMPANY TOTAL</TableCell>
                          <TableCell className="text-xs"></TableCell>
                          <TableCell className="text-xs"></TableCell>
                          <TableCell className="text-xs text-right">{totals.input.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{totals.a.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right" style={{ color: GOLD }}>{totalOutput > 0 ? aPct.toFixed(0) + '%' : '-'}</TableCell>
                          <TableCell className="text-xs text-right">{totals.b.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{totalOutput > 0 ? bPct.toFixed(0) + '%' : '-'}</TableCell>
                          <TableCell className="text-xs text-right">{totals.c.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{totalOutput > 0 ? cPct.toFixed(0) + '%' : '-'}</TableCell>
                          <TableCell className="text-xs text-right">{totals.wastage.toFixed(1)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section B: Worker Detail */}
        <TabsContent value="worker">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>All Workers – Grade Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? renderLoading() : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Factory</TableHead>
                        <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Worker</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Input (kg)</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>A (kg)</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>B (kg)</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>C (kg)</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Wastage</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Output</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>A%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allWorkers.length === 0 && (
                        <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No worker data</TableCell></TableRow>
                      )}
                      {allWorkers.map((w, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-medium">{w.factoryId}</TableCell>
                          <TableCell className="text-xs">{w.name} <span className="text-muted-foreground">({w.workerId})</span></TableCell>
                          <TableCell className="text-xs text-right">{w.inputKg.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right font-medium">{w.aKg.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{w.bKg.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{w.cKg.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{w.wastageKg.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{w.outputKg.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right font-bold" style={{ color: w.aPct >= 60 ? '#16a34a' : w.aPct >= 40 ? GOLD : '#dc2626' }}>
                            {w.aPct.toFixed(0)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section C: Discrepancy Cross-Check */}
        <TabsContent value="discrepancy">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Factory Input vs QC Summary Balance Check</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? renderLoading() : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Factory</TableHead>
                        <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Supervisor</TableHead>
                        <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Lot</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Record Input</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Worker Input Σ</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Δ Input</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Record Output</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Worker Output Σ</TableHead>
                        <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Δ Output</TableHead>
                        <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discrepancies.length === 0 && (
                        <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>
                      )}
                      {discrepancies.map((d, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-medium">{d.factoryId}</TableCell>
                          <TableCell className="text-xs">{d.supervisor}</TableCell>
                          <TableCell className="text-xs">{d.lot}</TableCell>
                          <TableCell className="text-xs text-right">{d.recordInput.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{d.workerInputSum.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right font-bold" style={{ color: Math.abs(d.recordInput - d.workerInputSum) > 0.01 ? '#dc2626' : '#16a34a' }}>
                            {Math.abs(d.recordInput - d.workerInputSum).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-right">{d.recordOutput.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{d.workerOutputSum.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right font-bold" style={{ color: Math.abs(d.recordOutput - d.workerOutputSum) > 0.01 ? '#dc2626' : '#16a34a' }}>
                            {Math.abs(d.recordOutput - d.workerOutputSum).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className={d.ok ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                              {d.ok ? 'OK' : 'MISMATCH'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section D: Company Performance */}
        <TabsContent value="performance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">A-Grade %</p>
                <p className="text-2xl font-bold mt-1" style={{ color: aPct >= 60 ? '#16a34a' : GOLD }}>{aPct.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">B-Grade %</p>
                <p className="text-2xl font-bold mt-1" style={{ color: NAVY }}>{bPct.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">C-Grade %</p>
                <p className="text-2xl font-bold mt-1" style={{ color: cPct > 20 ? '#dc2626' : '#16a34a' }}>{cPct.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">Total Workers</p>
                <p className="text-2xl font-bold mt-1" style={{ color: NAVY }}>{totalWorkers}</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">Total Input (kg)</p>
                <p className="text-2xl font-bold mt-1" style={{ color: NAVY }}>{totals.input.toFixed(1)}</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">Total Output (kg)</p>
                <p className="text-2xl font-bold mt-1" style={{ color: GOLD }}>{totalOutput.toFixed(1)}</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">Total Wastage (kg)</p>
                <p className="text-2xl font-bold mt-1" style={{ color: totals.wastage / totals.input > 0.15 ? '#dc2626' : '#16a34a' }}>{totals.wastage.toFixed(1)}</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">Wastage %</p>
                <p className="text-2xl font-bold mt-1" style={{ color: totals.input > 0 && (totals.wastage / totals.input) > 0.15 ? '#dc2626' : '#16a34a' }}>
                  {totals.input > 0 ? ((totals.wastage / totals.input) * 100).toFixed(1) : 0}%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}