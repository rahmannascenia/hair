'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy } from 'lucide-react';

interface Worker { id: string; workerId: string; name: string; factory: { id: string; name: string } }
interface Entry { worker: { id: string; name: string; factory: { id: string; name: string } }; aWeightKg: number; bWeightKg: number; cWeightKg: number; totalPayable: number }

interface RankedWorker { id: string; workerId: string; name: string; factory: string; totalDays: number; aGrade: number; totalOutput: number; totalPay: number; rank: number }

export default function LeaderboardSection() {
  const [ranked, setRanked] = useState<RankedWorker[]>([]);
  const [factories, setFactories] = useState<string[]>([]);
  const [factoryFilter, setFactoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [wRes, rRes] = await Promise.all([erpFetch('/api/workers?limit=200'), erpFetch('/api/daily-records?limit=200')]);
      if (!wRes.ok || !rRes.ok) return;
      const wData = (await wRes.json()).data || [];
      const rData = (await rRes.json()).data || [];

      const workerMap = new Map<string, { worker: typeof wData[0]; days: number; a: number; b: number; c: number; pay: number }>();
      for (const w of wData) workerMap.set(w.id, { worker: w, days: 0, a: 0, b: 0, c: 0, pay: 0 });

      const factorySet = new Set<string>();
      for (const r of rData) {
        factorySet.add(r.factory?.name || '');
        for (const e of (r.entries || [])) {
          const m = workerMap.get(e.worker?.id);
          if (m) { m.days++; m.a += e.aWeightKg || 0; m.b += e.bWeightKg || 0; m.c += e.cWeightKg || 0; m.pay += e.totalPayable || 0; }
        }
      }
      setFactories(Array.from(factorySet).sort());

      const list: RankedWorker[] = Array.from(workerMap.values())
        .filter((m) => m.days > 0)
        .map((m) => ({
          id: m.worker.id, workerId: m.worker.workerId, name: m.worker.name,
          factory: m.worker.factory?.name || '', totalDays: m.days,
          aGrade: (m.a + m.b + m.c) > 0 ? Math.round((m.a / (m.a + m.b + m.c)) * 100) : 0,
          totalOutput: Math.round((m.a + m.b + m.c) * 100) / 100,
          totalPay: Math.round(m.pay),
          rank: 0,
        }))
        .sort((a, b) => b.aGrade - a.aGrade || b.totalOutput - a.totalOutput);

      list.forEach((w, i) => { w.rank = i + 1; });
      setRanked(list);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const display = factoryFilter === 'all' ? ranked : ranked.filter((w) => w.factory === factoryFilter);
  const topCount = Math.min(10, display.length);
  const bottomStart = Math.max(0, display.length - 10);

  const rowClass = (idx: number) => {
    if (idx < topCount) return 'bg-emerald-50';
    if (idx >= bottomStart) return 'bg-red-50';
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6" style={{ color: '#C9A227' }} />
          <h2 className="text-2xl font-bold">Leaderboard</h2>
        </div>
        <Select value={factoryFilter} onValueChange={setFactoryFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter factory" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Factories</SelectItem>
            {factories.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{display.length}</p><p className="text-xs text-muted-foreground">Workers</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{display[0]?.aGrade || 0}%</p><p className="text-xs text-muted-foreground">Top A-Grade</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{display.length > 0 ? Math.round(display.reduce((s, w) => s + w.aGrade, 0) / display.length) : 0}%</p><p className="text-xs text-muted-foreground">Avg A-Grade</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">৳{display.reduce((s, w) => s + w.totalPay, 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Pay</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? <p className="text-muted-foreground py-8 text-center">Loading...</p> : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader><TableRow><TableHead>#</TableHead><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Factory</TableHead><TableHead>Days</TableHead><TableHead>A-Grade %</TableHead><TableHead>Total Output</TableHead><TableHead>Total Pay</TableHead></TableRow></TableHeader>
                <TableBody>
                  {display.map((w, idx) => (
                    <TableRow key={w.id} className={rowClass(idx)}>
                      <TableCell className="font-bold">{w.rank}</TableCell>
                      <TableCell className="font-mono text-xs">{w.workerId}</TableCell>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell>{w.factory}</TableCell>
                      <TableCell>{w.totalDays}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${w.aGrade >= 70 ? 'text-emerald-600' : w.aGrade >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{w.aGrade}%</span>
                      </TableCell>
                      <TableCell>{w.totalOutput} kg</TableCell>
                      <TableCell>৳{w.totalPay.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}