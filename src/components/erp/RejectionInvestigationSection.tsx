'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertOctagon } from 'lucide-react';

interface Analytics {
  rootCauses: { cause: string; count: number; avgWastage: number }[];
  highWastage: { entryId: string; worker: string; factory: string; date: string; input: number; wastage: number; wastagePct: number }[];
  cGradeFlags: { factory: string; count: number; cPct: number }[];
  shortages: { entryId: string; worker: string; factory: string; date: string; input: number; output: number; wastage: number; shortage: number }[];
  summary: { totalEntries: number; highWastageCount: number; cGradeFlagCount: number; shortageCount: number };
}

export default function RejectionInvestigationSection() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/rejection-investigation');
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) return <p className="text-muted-foreground py-8 text-center">Loading analytics...</p>;
  if (!data) return <p className="text-muted-foreground py-8 text-center">No data available.</p>;

  const cards = [
    { label: 'Total Entries', value: data.summary.totalEntries },
    { label: 'High Wastage (>15%)', value: data.summary.highWastageCount, color: 'text-red-600' },
    { label: 'C-Grade Flags (>20%)', value: data.summary.cGradeFlagCount, color: 'text-amber-600' },
    { label: 'Shortages (Mismatch)', value: data.summary.shortageCount, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertOctagon className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Rejection Investigation</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} style={{ background: '#1F3864' }}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold text-white ${c.color || ''}`}>{c.value}</p>
              <p className="text-xs text-blue-200">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: '#1F3864' }}>Root Causes</CardTitle></CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table><TableHeader><TableRow><TableHead>Cause</TableHead><TableHead>Count</TableHead><TableHead>Avg Wastage</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.rootCauses.map((r, i) => (
                  <TableRow key={i}><TableCell className="font-medium">{r.cause}</TableCell><TableCell>{r.count}</TableCell><TableCell className="text-red-600 font-bold">{r.avgWastage}%</TableCell></TableRow>
                ))}
                {data.rootCauses.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No root causes</TableCell></TableRow>}
              </TableBody></Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: '#1F3864' }}>C-Grade Factory Flags</CardTitle></CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table><TableHeader><TableRow><TableHead>Factory</TableHead><TableHead>Flags</TableHead><TableHead>C %</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.cGradeFlags.map((f, i) => (
                  <TableRow key={i} className="bg-amber-50"><TableCell className="font-medium">{f.factory}</TableCell><TableCell>{f.count}</TableCell><TableCell className="text-amber-600 font-bold">{f.cPct}%</TableCell></TableRow>
                ))}
                {data.cGradeFlags.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No flags</TableCell></TableRow>}
              </TableBody></Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: '#1F3864' }}>High Wastage Entries (&gt;15%)</CardTitle></CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table><TableHeader><TableRow><TableHead>Worker</TableHead><TableHead>Factory</TableHead><TableHead>Input</TableHead><TableHead>Wastage</TableHead><TableHead>%</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.highWastage.map((e, i) => (
                  <TableRow key={i} className="bg-red-50"><TableCell className="font-medium">{e.worker}</TableCell><TableCell>{e.factory}</TableCell><TableCell>{e.input} kg</TableCell><TableCell>{e.wastage} kg</TableCell><TableCell className="text-red-600 font-bold">{e.wastagePct}%</TableCell></TableRow>
                ))}
                {data.highWastage.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No high wastage</TableCell></TableRow>}
              </TableBody></Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ color: '#1F3864' }}>Balance Shortages</CardTitle></CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table><TableHeader><TableRow><TableHead>Worker</TableHead><TableHead>Factory</TableHead><TableHead>Input</TableHead><TableHead>Output</TableHead><TableHead>Shortage</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.shortages.map((s, i) => (
                  <TableRow key={i}><TableCell className="font-medium">{s.worker}</TableCell><TableCell>{s.factory}</TableCell><TableCell>{s.input} kg</TableCell><TableCell>{s.output} kg</TableCell><TableCell className="text-red-600 font-bold">{s.shortage.toFixed(3)} kg</TableCell></TableRow>
                ))}
                {data.shortages.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No shortages</TableCell></TableRow>}
              </TableBody></Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}