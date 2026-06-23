'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface Phase2Job {
  id: string;
  jobId: string;
  lot: { lotNo: string };
  date: string;
  inputKg: number;
  size5Kg: number;
  size6Kg: number;
  size8Kg: number;
  size10Kg: number;
  size12Kg: number;
  size14Kg: number;
  size16Kg: number;
  size18Kg: number;
  size20Kg: number;
  size24Kg: number;
  size30Kg: number;
  totalSizedKg: number;
  combingLossKg: number;
  lossPct: number;
  realisableValueBdt: number;
  costBdt: number;
  marginBdt: number;
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';

export default function Phase2Section() {
  const [data, setData] = useState<Phase2Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/phase2?limit=200')
      .then(r => r.json())
      .then(res => { setData(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Margin analysis
  const marginTotals = data.reduce((acc, item) => ({
    inputKg: acc.inputKg + (item.inputKg || 0),
    totalSizedKg: acc.totalSizedKg + (item.totalSizedKg || 0),
    combingLossKg: acc.combingLossKg + (item.combingLossKg || 0),
    realisableValueBdt: acc.realisableValueBdt + (item.realisableValueBdt || 0),
    costBdt: acc.costBdt + (item.costBdt || 0),
    marginBdt: acc.marginBdt + (item.marginBdt || 0),
  }), { inputKg: 0, totalSizedKg: 0, combingLossKg: 0, realisableValueBdt: 0, costBdt: 0, marginBdt: 0 });

  const avgMarginPct = marginTotals.costBdt > 0 ? (marginTotals.marginBdt / marginTotals.costBdt) * 100 : 0;
  const avgRealisablePerKg = marginTotals.totalSizedKg > 0 ? marginTotals.realisableValueBdt / marginTotals.totalSizedKg : 0;
  const avgCostPerKg = marginTotals.totalSizedKg > 0 ? marginTotals.costBdt / marginTotals.totalSizedKg : 0;
  const avgLossPct = marginTotals.inputKg > 0 ? (marginTotals.combingLossKg / marginTotals.inputKg) * 100 : 0;

  const sizeColumns = [
    { key: 'size5Kg', label: '5"' },
    { key: 'size6Kg', label: '6"' },
    { key: 'size8Kg', label: '8"' },
    { key: 'size10Kg', label: '10"' },
    { key: 'size12Kg', label: '12"' },
    { key: 'size14Kg', label: '14"' },
    { key: 'size16Kg', label: '16"' },
    { key: 'size18Kg', label: '18"' },
    { key: 'size20Kg', label: '20"' },
    { key: 'size24Kg', label: '24"' },
    { key: 'size30Kg', label: '30"' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Phase 2 Production</h2>
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Sizing & Combing Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-8 w-full" />{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Job ID</TableHead>
                      <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Lot</TableHead>
                      <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Date</TableHead>
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Input</TableHead>
                      {sizeColumns.map(sc => (
                        <TableHead key={sc.key} className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>{sc.label}</TableHead>
                      ))}
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Total Sized</TableHead>
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Loss</TableHead>
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Loss %</TableHead>
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Realisable (BDT)</TableHead>
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Cost (BDT)</TableHead>
                      <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Margin (BDT)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 && (
                      <TableRow><TableCell colSpan={21} className="text-center text-muted-foreground py-8">No Phase 2 records</TableCell></TableRow>
                    )}
                    {data.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs font-medium whitespace-nowrap">{item.jobId}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{item.lot?.lotNo}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs text-right">{item.inputKg.toFixed(1)}</TableCell>
                        {sizeColumns.map(sc => (
                          <TableCell key={sc.key} className="text-xs text-right">{(item[sc.key as keyof Phase2Job] as number || 0).toFixed(1)}</TableCell>
                        ))}
                        <TableCell className="text-xs text-right font-medium">{item.totalSizedKg.toFixed(1)}</TableCell>
                        <TableCell className="text-xs text-right text-red-600">{item.combingLossKg.toFixed(1)}</TableCell>
                        <TableCell className="text-xs text-right">{item.lossPct.toFixed(1)}%</TableCell>
                        <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{item.realisableValueBdt.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right">৳{item.costBdt.toLocaleString()}</TableCell>
                        <TableCell className={`text-xs text-right font-bold ${(item.marginBdt || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} style={(item.marginBdt || 0) >= 0 ? { color: GOLD } : undefined}>
                          ৳{item.marginBdt.toLocaleString()}
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

      {/* Margin Analysis Summary */}
      {data.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Margin Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Input</p>
                <p className="text-lg font-bold" style={{ color: NAVY }}>{marginTotals.inputKg.toFixed(1)} kg</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Sized Output</p>
                <p className="text-lg font-bold" style={{ color: NAVY }}>{marginTotals.totalSizedKg.toFixed(1)} kg</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Combing Loss</p>
                <p className="text-lg font-bold" style={{ color: avgLossPct > 15 ? '#dc2626' : GOLD }}>{avgLossPct.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Realisable/kg</p>
                <p className="text-lg font-bold" style={{ color: GOLD }}>৳{avgRealisablePerKg.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Cost/kg</p>
                <p className="text-lg font-bold" style={{ color: NAVY }}>৳{avgCostPerKg.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Margin (BDT)</p>
                <p className={`text-lg font-bold ${marginTotals.marginBdt >= 0 ? 'text-green-600' : 'text-red-600'}`} style={marginTotals.marginBdt >= 0 ? { color: GOLD } : undefined}>
                  ৳{marginTotals.marginBdt.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Margin %</p>
                <p className={`text-lg font-bold ${avgMarginPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {avgMarginPct.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Realisable Value</p>
                <p className="text-lg font-bold" style={{ color: GOLD }}>৳{marginTotals.realisableValueBdt.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}