'use client';

import { erpFetch } from '@/lib/api-client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Fragment } from 'react';

interface KpiItem {
  id: string;
  name: string;
  category: string;
  target: number | null;
  actual: number;
  unit: string;
  status: string;
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';

export default function KpiSection() {
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    erpFetch('/api/kpi')
      .then(r => r.json())
      .then(res => { setKpis(res.kpis || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Group by dimension/category
  const grouped = kpis.reduce((acc, k) => {
    if (!acc[k.category]) acc[k.category] = [];
    acc[k.category].push(k);
    return acc;
  }, {} as Record<string, KpiItem[]>);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>KPI Tracker</h2>
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-8 w-full" />{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>KPI Name</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Dimension</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Target</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Actual</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Variance</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No KPI data</TableCell></TableRow>
                  )}
                  {Object.entries(grouped).map(([category, items]) => (
                    <Fragment key={category}>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={6} className="text-xs font-bold py-2" style={{ color: NAVY }}>{category}</TableCell>
                      </TableRow>
                      {items.map(k => {
                        const variance = k.target !== null ? k.actual - k.target : null;
                        const variancePct = k.target !== null && k.target !== 0 ? ((variance! / k.target) * 100) : null;
                        return (
                          <TableRow key={k.id}>
                            <TableCell className="text-xs font-medium">{k.name}</TableCell>
                            <TableCell className="text-xs">{k.category}</TableCell>
                            <TableCell className="text-xs text-right">{k.target !== null ? `${k.target.toLocaleString()} ${k.unit}` : '-'}</TableCell>
                            <TableCell className="text-xs text-right font-bold" style={{ color: GOLD }}>{`${k.actual.toLocaleString()} ${k.unit}`}</TableCell>
                            <TableCell className={`text-xs text-right font-medium ${variance !== null && variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {variance !== null ? (variancePct !== null ? `${variancePct >= 0 ? '+' : ''}${variancePct.toFixed(1)}%` : `${variance >= 0 ? '+' : ''}${variance.toFixed(1)}`) : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge className={k.status === 'ON TARGET' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                                {k.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </Fragment>
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