'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Bucket {
  name: string;
  weightKg: number;
  valueBdt: number;
  unitCostPerKg?: number;
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';

export default function InventorySection() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [totals, setTotals] = useState<{ weightKg: number; valueBdt: number; valueUsd: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/inventory')
      .then(r => r.json())
      .then(res => {
        setBuckets(res.buckets || []);
        setTotals(res.totals || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalValue = buckets.reduce((s, b) => s + (b.valueBdt || 0), 0);

  const chartData = buckets.map(b => ({
    name: b.name.length > 12 ? b.name.slice(0, 12) + '…' : b.name,
    fullName: b.name,
    value: b.valueBdt,
  }));

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Inventory</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Inventory</h2>

      {/* Bucket Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Inventory by Bucket</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Bucket #</TableHead>
                  <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Bucket Name</TableHead>
                  <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Weight (kg)</TableHead>
                  <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Unit Cost (BDT/kg)</TableHead>
                  <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Total Value (BDT)</TableHead>
                  <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>% of Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buckets.map((b, i) => {
                  const unitCost = b.weightKg > 0 ? b.valueBdt / b.weightKg : 0;
                  const pctOfTotal = totalValue > 0 ? (b.valueBdt / totalValue) * 100 : 0;
                  return (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium">{i + 1}</TableCell>
                      <TableCell className="text-xs font-medium">{b.name}</TableCell>
                      <TableCell className="text-xs text-right">{b.weightKg.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{unitCost.toFixed(0)}</TableCell>
                      <TableCell className="text-xs text-right font-medium" style={{ color: GOLD }}>৳{b.valueBdt.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(pctOfTotal, 100)}%`, backgroundColor: GOLD }} />
                          </div>
                          <span className="text-xs">{pctOfTotal.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {buckets.length > 0 && (
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2} className="text-xs" style={{ color: NAVY }}>TOTAL</TableCell>
                    <TableCell className="text-xs text-right">{totals?.weightKg.toFixed(1) || buckets.reduce((s, b) => s + b.weightKg, 0).toFixed(1)}</TableCell>
                    <TableCell className="text-xs text-right">-</TableCell>
                    <TableCell className="text-xs text-right font-bold" style={{ color: GOLD }}>৳{totalValue.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right font-bold">100.0%</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Horizontal Bar Chart */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Inventory Value by Bucket (BDT)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => '৳' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(v: number) => ['৳' + v.toLocaleString(), 'Value (BDT)']} labelFormatter={(l: string) => {
                  const found = chartData.find(d => d.name === l);
                  return found?.fullName || l;
                }} />
                <Bar dataKey="value" fill={GOLD} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No data</div>
          )}
        </CardContent>
      </Card>

      {/* Totals Footer Card */}
      {totals && (
        <Card className="border" style={{ backgroundColor: NAVY }}>
          <CardContent className="p-4 flex flex-wrap gap-6 justify-between">
            <div>
              <p className="text-blue-200 text-xs font-medium">Total Weight</p>
              <p className="text-white text-xl font-bold">{totals.weightKg.toFixed(1)} kg</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs font-medium">Total Value (BDT)</p>
              <p className="text-xl font-bold" style={{ color: GOLD }}>৳{totals.valueBdt.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs font-medium">Total Value (USD)</p>
              <p className="text-white text-xl font-bold">${totals.valueUsd.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}