'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CostingFactory {
  factoryId: string;
  factoryName: string;
  location: string;
  workerCount: number;
  outputKg: number;
  workerCostBdt: number;
  supervisorCostBdt: number;
  overheadCostBdt: number;
  totalProcessingCostBdt: number;
  costPerKg: number;
  costPerKgTarget: number;
  costTargetMet: boolean | null;
  aGradePct: number;
  aGradeTarget: number;
  aGradeTargetMet: boolean | null;
}

interface WorkerRecord {
  worker: { workerId: string; name: string };
  inputGivenKg: number;
  aWeightKg: number;
  bWeightKg: number;
  cWeightKg: number;
  baseWage: number;
  totalPayable: number;
}

interface DailyRecord {
  id: string;
  factory: { factoryId: string; name: string };
  lot: { lotNo: string; landedCostPerKg: number };
  totalInputKg: number;
  totalAGradeKg: number;
  totalBGradeKg: number;
  totalCGradeKg: number;
  entries?: WorkerRecord[];
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';
const OVERHEAD_PER_DAY = 15;

export default function CostingSection() {
  const [factories, setFactories] = useState<CostingFactory[]>([]);
  const [workerRecords, setWorkerRecords] = useState<{
    name: string; workerId: string; factoryId: string;
    dailyOutputG: number; dailyWage: number; materialCostDay: number;
    totalCostDay: number; costPerGram: number; costPerKg: number; onTarget: boolean;
  }[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [workerLoading, setWorkerLoading] = useState(false);

  const loadWorkerData = (factoryId: string) => {
    setWorkerLoading(true);
    fetch(`/api/daily-records?factoryId=${factoryId}&limit=10`)
      .then(r => r.json())
      .then(res => {
        const records: DailyRecord[] = res.data || [];
        const workers: typeof workerRecords = [];
        records.forEach(rec => {
          const lotCostPerKg = rec.lot?.landedCostPerKg || 0;
          (rec.entries || []).forEach(e => {
            const outputG = ((e.aWeightKg || 0) + (e.bWeightKg || 0) + (e.cWeightKg || 0)) * 1000;
            const inputG = (e.inputGivenKg || 0) * 1000;
            const materialCost = inputG * (lotCostPerKg / 1000);
            const totalCost = (e.baseWage || 0) + OVERHEAD_PER_DAY + materialCost;
            const costPerGram = outputG > 0 ? totalCost / outputG : 0;
            const costPerKg = costPerGram * 1000;
            workers.push({
              name: e.worker?.name || 'Unknown',
              workerId: e.worker?.workerId || '',
              factoryId: rec.factory?.factoryId || '',
              dailyOutputG: outputG,
              dailyWage: e.baseWage || 0,
              materialCostDay: materialCost,
              totalCostDay: totalCost,
              costPerGram,
              costPerKg,
              onTarget: costPerKg <= 320,
            });
          });
        });
        setWorkerRecords(workers);
        setWorkerLoading(false);
      })
      .catch(() => setWorkerLoading(false));
  };

  useEffect(() => {
    fetch('/api/costing')
      .then(r => r.json())
      .then(res => {
        setFactories(res.factories || []);
        setLoading(false);
        return res.factories || [];
      })
      .then(factories => {
        if (factories.length > 0) {
          loadWorkerData(factories[0].factoryId);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handleFactoryChange = (val: string) => {
    setSelectedFactory(val);
    if (val !== 'all') {
      loadWorkerData(val);
    }
  };

  const totals = factories.reduce((acc, f) => ({
    workers: acc.workers + (f.workerCount || 0),
    output: acc.output + (f.outputKg || 0),
    wages: acc.wages + (f.workerCostBdt || 0),
    supAllow: acc.supAllow + (f.supervisorCostBdt || 0),
    overhead: acc.overhead + (f.overheadCostBdt || 0),
    total: acc.total + (f.totalProcessingCostBdt || 0),
  }), { workers: 0, output: 0, wages: 0, supAllow: 0, overhead: 0, total: 0 });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Costing Analysis</h2>

      {/* Section A: Factory-Level Costing */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Section A: Factory-Level Costing</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-8 w-full" />{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Factory</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Location</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Workers</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Output (kg/day)</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Wages</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Supervisor Allow</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Overhead</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Total Cost</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Cost/kg</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Target</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factories.length === 0 && (
                    <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">No costing data</TableCell></TableRow>
                  )}
                  {factories.map(f => (
                    <TableRow key={f.factoryId}>
                      <TableCell className="text-xs font-medium">{f.factoryId}</TableCell>
                      <TableCell className="text-xs">{f.location}</TableCell>
                      <TableCell className="text-xs text-right">{f.workerCount}</TableCell>
                      <TableCell className="text-xs text-right">{f.outputKg.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right">৳{f.workerCostBdt.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">৳{f.supervisorCostBdt.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">৳{f.overheadCostBdt.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-medium" style={{ color: GOLD }}>৳{f.totalProcessingCostBdt.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-bold" style={{ color: GOLD }}>৳{f.costPerKg.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">৳{f.costPerKgTarget.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={f.costTargetMet === true ? 'bg-green-100 text-green-800 hover:bg-green-100' : f.costTargetMet === false ? 'bg-red-100 text-red-800 hover:bg-red-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>
                          {f.costTargetMet === true ? 'ON TARGET' : f.costTargetMet === false ? 'OVER' : 'N/A'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {factories.length > 0 && (
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={2} className="text-xs" style={{ color: NAVY }}>TOTAL</TableCell>
                      <TableCell className="text-xs text-right">{totals.workers}</TableCell>
                      <TableCell className="text-xs text-right">{totals.output.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right">৳{totals.wages.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">৳{totals.supAllow.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">৳{totals.overhead.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{totals.total.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{totals.output > 0 ? (totals.total / totals.output).toFixed(0) : 0}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Section B: Per-Worker Costing Sample */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Section B: Per-Worker Costing Sample</CardTitle>
            <Select value={selectedFactory} onValueChange={handleFactoryChange}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Select Factory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Factories</SelectItem>
                {factories.map(f => (
                  <SelectItem key={f.factoryId} value={f.factoryId}>{f.factoryId} – {f.factoryName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {workerLoading ? (
            <div className="space-y-2"><Skeleton className="h-8 w-full" />{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Name</TableHead>
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Daily Output (g)</TableHead>
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Daily Wage</TableHead>
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Overhead/Day</TableHead>
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Material Cost/Day</TableHead>
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Total Cost/Day</TableHead>
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Cost/gram</TableHead>
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Cost/kg</TableHead>
                      <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workerRecords.length === 0 && (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Select a factory to view worker costing</TableCell></TableRow>
                    )}
                    {workerRecords.map((w, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs font-medium whitespace-nowrap">
                          {w.name}
                          <span className="text-muted-foreground ml-1">({w.workerId})</span>
                        </TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap">{w.dailyOutputG.toFixed(0)}</TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap">৳{w.dailyWage.toFixed(0)}</TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap">৳{OVERHEAD_PER_DAY}</TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap">৳{w.materialCostDay.toFixed(0)}</TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap font-medium" style={{ color: GOLD }}>৳{w.totalCostDay.toFixed(0)}</TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap font-bold">৳{w.costPerGram.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap font-bold" style={{ color: w.onTarget ? '#16a34a' : '#dc2626' }}>৳{w.costPerKg.toFixed(0)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge className={w.onTarget ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                            {w.onTarget ? 'ON TARGET' : 'OVER'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}