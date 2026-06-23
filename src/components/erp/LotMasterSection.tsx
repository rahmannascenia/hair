'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface LotItem {
  id: string;
  lotNo: string;
  colour: string;
  rawWeightKg: number;
  landedCostPerKg: number;
  totalLandedCost: number;
  washStatus: string;
  distributedKg: number;
  returnedKg: number;
  finishedKg: number;
  status: string;
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';

const statusStyles: Record<string, string> = {
  'Active': 'bg-green-100 text-green-800 hover:bg-green-100',
  'Phase 1 Active': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  'Washed Stock': 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  'Raw Material': 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  'Finished': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  'In Production': 'text-white hover:text-white',
};

export default function LotMasterSection() {
  const [data, setData] = useState<LotItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lots?limit=200')
      .then(r => r.json())
      .then(res => { setData(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Lot Master</h2>
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>All Lots</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-8 w-full" />{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Lot No</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Colour</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Raw Wt (kg)</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Cost/kg</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Total Cost (BDT)</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Wash Status</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Distributed (kg)</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Returned (kg)</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Finished (kg)</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No lots found</TableCell></TableRow>
                  )}
                  {data.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs">{item.lotNo}</TableCell>
                      <TableCell className="text-xs">{item.colour}</TableCell>
                      <TableCell className="text-xs text-right">{item.rawWeightKg.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{item.landedCostPerKg.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-medium" style={{ color: GOLD }}>৳{item.totalLandedCost.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className={item.washStatus === 'Done' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-amber-100 text-amber-800 hover:bg-amber-100'}>
                          {item.washStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right">{item.distributedKg.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right">{item.returnedKg.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right">{item.finishedKg.toFixed(1)}</TableCell>
                      <TableCell>
                        <Badge
                          className={statusStyles[item.status] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'}
                          style={item.status === 'In Production' ? { backgroundColor: NAVY, color: '#fff' } : undefined}
                        >
                          {item.status}
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
    </div>
  );
}