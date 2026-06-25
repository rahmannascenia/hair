'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText } from 'lucide-react';

interface DailyRecord {
  id: string;
  recordDate: string;
  factory: { id: string; factoryId: string; name: string };
  lot: { lotNo: string; colour: string };
  entries: { worker: { name: string } }[];
  totalInputKg: number;
  totalAGradeKg: number;
  totalBGradeKg: number;
  totalCGradeKg: number;
  totalWastageKg: number;
  totalPayrollBdt: number;
  grandTotalBdt: number;
  wipStatus: string;
}

export default function DailyReportsSection() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await erpFetch(`/api/daily-records?dateFrom=${date}&dateTo=${date}&limit=50`);
      if (res.ok) { const d = await res.json(); setRecords(d.data || []); }
    } finally { setLoading(false); }
  }, [date]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const totals = records.reduce((acc, r) => ({
    input: acc.input + r.totalInputKg,
    a: acc.a + r.totalAGradeKg,
    b: acc.b + r.totalBGradeKg,
    c: acc.c + r.totalCGradeKg,
    waste: acc.waste + r.totalWastageKg,
    payroll: acc.payroll + r.totalPayrollBdt,
    workers: acc.workers + (r.entries?.length || 0),
  }), { input: 0, a: 0, b: 0, c: 0, waste: 0, payroll: 0, workers: 0 });

  const totalOut = totals.a + totals.b + totals.c;
  const aPct = totalOut > 0 ? Math.round((totals.a / totalOut) * 100) : 0;
  const bPct = totalOut > 0 ? Math.round((totals.b / totalOut) * 100) : 0;
  const cPct = totalOut > 0 ? Math.round((totals.c / totalOut) * 100) : 0;
  const wPct = totalOut > 0 ? Math.round((totals.waste / totalOut) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6" style={{ color: '#C9A227' }} />
          <h2 className="text-2xl font-bold">Daily Reports</h2>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full sm:w-auto border rounded-md px-3 py-2 text-sm bg-background" />
      </div>

      {loading ? <p className="text-muted-foreground py-8 text-center">Loading...</p> : records.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No records found for {date}.</CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{records.length}</p><p className="text-xs text-muted-foreground">Factories</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totals.workers}</p><p className="text-xs text-muted-foreground">Workers</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{aPct}%</p><p className="text-xs text-muted-foreground">A-Grade</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">৳{totals.payroll.toLocaleString()}</p><p className="text-xs text-muted-foreground">Payroll</p></CardContent></Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factory</TableHead><TableHead className="hidden sm:table-cell">Workers</TableHead><TableHead>Input</TableHead>
                      <TableHead className="text-emerald-600">A%</TableHead><TableHead className="text-amber-600 hidden md:table-cell">B%</TableHead>
                      <TableHead className="text-red-600 hidden lg:table-cell">C%</TableHead><TableHead className="hidden lg:table-cell">Wastage%</TableHead><TableHead>Payroll</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => {
                      const out = r.totalAGradeKg + r.totalBGradeKg + r.totalCGradeKg;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.factory.name}</TableCell>
                          <TableCell className="hidden sm:table-cell">{r.entries?.length || 0}</TableCell>
                          <TableCell>{r.totalInputKg} kg</TableCell>
                          <TableCell className="text-emerald-600 font-medium">{out > 0 ? Math.round((r.totalAGradeKg / out) * 100) : 0}%</TableCell>
                          <TableCell className="text-amber-600 hidden md:table-cell">{out > 0 ? Math.round((r.totalBGradeKg / out) * 100) : 0}%</TableCell>
                          <TableCell className="text-red-600 hidden lg:table-cell">{out > 0 ? Math.round((r.totalCGradeKg / out) * 100) : 0}%</TableCell>
                          <TableCell className={`hidden lg:table-cell ${r.totalWastageKg / r.totalInputKg > 0.15 ? 'text-red-600 font-bold' : ''}`}>{r.totalInputKg > 0 ? Math.round((r.totalWastageKg / r.totalInputKg) * 100) : 0}%</TableCell>
                          <TableCell>৳{Math.round(r.totalPayrollBdt).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="font-bold" style={{ background: '#1F3864', color: 'white' }}>
                      <TableCell>TOTAL</TableCell><TableCell className="hidden sm:table-cell">{totals.workers}</TableCell><TableCell>{totals.input.toFixed(1)} kg</TableCell>
                      <TableCell>{aPct}%</TableCell><TableCell className="hidden md:table-cell">{bPct}%</TableCell><TableCell className="hidden lg:table-cell">{cPct}%</TableCell>
                      <TableCell className="hidden lg:table-cell">{wPct}%</TableCell><TableCell>৳{Math.round(totals.payroll).toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}