'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Search } from 'lucide-react';

interface Worker { id: string; workerId: string; name: string; bKash?: string; factory: { id: string; factoryId: string; name: string; supervisorName: string; location: string; lineLeader: { name: string; headLeader: { name: string } } }; createdAt: string }
interface Entry { id: string; record: { recordDate: string; factory: { name: string } }; inputGivenKg: number; aWeightKg: number; bWeightKg: number; cWeightKg: number; wastageKg: number; totalPayable: number; baseWage: number; status: string }

export default function WorkerProfileSection() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Worker | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await erpFetch('/api/workers?limit=200');
      if (res.ok) { const d = await res.json(); setWorkers(d.data || d || []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  const filtered = search ? workers.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()) || w.workerId.toLowerCase().includes(search.toLowerCase())) : workers.slice(0, 50);

  const selectWorker = async (w: Worker) => {
    setSelected(w);
    try {
      const res = await erpFetch('/api/daily-records?limit=100');
      if (res.ok) {
        const d = await res.json();
        const records = d.data || [];
        const allEntries: Entry[] = [];
        for (const r of records) {
          for (const e of (r.entries || [])) {
            if (e.worker?.id === w.id) allEntries.push(e);
          }
        }
        setEntries(allEntries.sort((a: Entry, b: Entry) => new Date(b.record.recordDate).getTime() - new Date(a.record.recordDate).getTime()));
      }
    } catch { /* silent */ }
  };

  const totalDays = entries.length;
  const totalA = entries.reduce((s, e) => s + e.aWeightKg, 0);
  const totalB = entries.reduce((s, e) => s + e.bWeightKg, 0);
  const totalC = entries.reduce((s, e) => s + e.cWeightKg, 0);
  const totalOut = totalA + totalB + totalC;
  const aPct = totalOut > 0 ? Math.round((totalA / totalOut) * 100) : 0;
  const avgOut = totalDays > 0 ? Math.round((totalOut / totalDays) * 100) / 100 : 0;
  const gradeBadge = (w: number) => w > 0 ? <Badge className={`text-xs ${w === Math.max(w, entries[0]?.aWeightKg || 0, entries[0]?.bWeightKg || 0) && w > (entries[0]?.cWeightKg || 0) ? 'bg-emerald-100 text-emerald-800' : ''}`}>{w} kg</Badge> : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Worker Profile</h2>
      </div>

      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by worker ID or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Factory</TableHead><TableHead className="hidden md:table-cell">Supervisor</TableHead><TableHead className="hidden sm:table-cell">Line Leader</TableHead><TableHead className="hidden md:table-cell">bKash</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((w) => (
              <TableRow key={w.id} className="cursor-pointer hover:bg-muted/50" onClick={() => selectWorker(w)}>
                <TableCell className="font-mono text-xs">{w.workerId}</TableCell>
                <TableCell className="font-medium">{w.name}</TableCell>
                <TableCell>{w.factory.name}</TableCell>
                <TableCell className="hidden md:table-cell">{w.factory.supervisorName}</TableCell>
                <TableCell className="hidden sm:table-cell">{w.factory.lineLeader?.name || '-'}</TableCell>
                <TableCell className="hidden md:table-cell text-xs">{w.bKash || '-'}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No workers found.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <Card>
          <CardHeader><CardTitle className="text-lg" style={{ color: '#1F3864' }}>{selected.name} — {selected.workerId}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalDays}</p><p className="text-xs text-muted-foreground">Total Days</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{aPct}%</p><p className="text-xs text-muted-foreground">A-Grade %</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{avgOut} kg</p><p className="text-xs text-muted-foreground">Avg Output</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">৳{entries.reduce((s, e) => s + e.totalPayable, 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Pay</p></CardContent></Card>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Input</TableHead><TableHead className="text-emerald-600">A</TableHead><TableHead className="text-amber-600 hidden sm:table-cell">B</TableHead><TableHead className="text-red-600 hidden md:table-cell">C</TableHead><TableHead className="hidden lg:table-cell">Wastage</TableHead><TableHead>Pay</TableHead><TableHead className="hidden md:table-cell">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {entries.slice(0, 50).map((e) => {
                    const t = e.aWeightKg + e.bWeightKg + e.cWeightKg;
                    const domA = e.aWeightKg >= e.bWeightKg && e.aWeightKg >= e.cWeightKg;
                    const domB = e.bWeightKg >= e.aWeightKg && e.bWeightKg >= e.cWeightKg;
                    return (
                      <TableRow key={e.id}>
                        <TableCell>{new Date(e.record.recordDate).toLocaleDateString()}</TableCell>
                        <TableCell>{e.inputGivenKg} kg</TableCell>
                        <TableCell className={`font-medium ${domA ? 'text-emerald-600' : ''}`}>{e.aWeightKg} kg</TableCell>
                        <TableCell className={domB && !domA ? 'text-amber-600 font-medium hidden sm:table-cell' : 'hidden sm:table-cell'}>{e.bWeightKg} kg</TableCell>
                        <TableCell className={!domA && !domB ? 'text-red-600 font-medium hidden md:table-cell' : 'hidden md:table-cell'}>{e.cWeightKg} kg</TableCell>
                        <TableCell className="hidden lg:table-cell">{t > 0 ? Math.round((e.wastageKg / t) * 1000) / 10 : 0}%</TableCell>
                        <TableCell>৳{Math.round(e.totalPayable)}</TableCell>
                        <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-xs">{e.status}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}