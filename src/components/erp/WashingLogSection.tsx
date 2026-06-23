'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface WashLogItem {
  id: string;
  washId: string;
  washDate: string;
  lotId: string;
  lot: { lotNo: string };
  operator: string;
  inputKg: number;
  outputKg: number;
  wastageKg: number;
  wastagePct: number;
  costPerKgOut: number;
  status: string;
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';

export default function WashingLogSection() {
  const [data, setData] = useState<WashLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wash-logs?limit=200')
      .then(r => r.json())
      .then(res => { setData(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Washing Log</h2>
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Wash Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-8 w-full" />{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Wash ID</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Date</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Lot</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Operator</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Input (kg)</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Output (kg)</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Wastage (kg)</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Wastage %</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Cost/kg Out (BDT)</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No wash records found</TableCell></TableRow>
                  )}
                  {data.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs">{item.washId}</TableCell>
                      <TableCell className="text-xs">{new Date(item.washDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs">{item.lot?.lotNo || '-'}</TableCell>
                      <TableCell className="text-xs">{item.operator}</TableCell>
                      <TableCell className="text-xs text-right">{item.inputKg.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right">{item.outputKg.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right">{item.wastageKg.toFixed(1)}</TableCell>
                      <TableCell className={`text-xs text-right font-bold ${(item.wastagePct ?? 0) > 15 ? 'text-red-600' : ''}`} style={(item.wastagePct ?? 0) <= 15 ? { color: GOLD } : undefined}>
                        {(item.wastagePct ?? 0).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{item.costPerKgOut.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{item.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}