'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface DistributionItem {
  id: string;
  handoffId: string;
  date: string;
  fromRole: string;
  fromName: string;
  toRole: string;
  toName: string;
  lotId: string;
  lot: { lotNo: string };
  qtyKg: number;
  status: string;
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';

export default function Phase1Section() {
  const [data, setData] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/distributions?limit=200')
      .then(r => r.json())
      .then(res => { setData(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Group by lot
  const grouped = data.reduce((acc, item) => {
    const lotNo = item.lot?.lotNo || 'Unknown';
    if (!acc[lotNo]) acc[lotNo] = [];
    acc[lotNo].push(item);
    return acc;
  }, {} as Record<string, DistributionItem[]>);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Phase 1 Distribution</h2>
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Handoff Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-8 w-full" />{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Handoff ID</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Date</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>From</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>To</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Lot</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Qty (kg)</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No distribution records found</TableCell></TableRow>
                  )}
                  {Object.entries(grouped).map(([lotNo, items]) => (
                    items.map((item, idx) => (
                      <TableRow key={item.id}>
                        {idx === 0 && (
                          <TableCell rowSpan={items.length} className="font-medium text-xs align-top border-r" style={{ color: NAVY }}>
                            <Badge variant="outline" className="text-xs">{lotNo}</Badge>
                          </TableCell>
                        )}
                        <TableCell className="font-medium text-xs">{item.handoffId}</TableCell>
                        <TableCell className="text-xs">{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs">
                          <div className="text-xs font-medium">{item.fromRole}</div>
                          <div className="text-xs text-muted-foreground">{item.fromName}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="text-xs font-medium">{item.toRole}</div>
                          <div className="text-xs text-muted-foreground">{item.toName}</div>
                        </TableCell>
                        <TableCell className="text-xs">{item.lot?.lotNo || '-'}</TableCell>
                        <TableCell className="text-xs text-right font-medium" style={{ color: GOLD }}>{item.qtyKg.toFixed(1)}</TableCell>
                        <TableCell className="text-xs">{item.status}</TableCell>
                      </TableRow>
                    ))
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