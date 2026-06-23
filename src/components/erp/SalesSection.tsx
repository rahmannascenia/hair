'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface SaleItem {
  id: string; contractNo: string; contractDate: string;
  buyer: { name: string; country: string }; productSpec: string;
  lengthInch: number; qtyKg: number; usdPerKg: number; usdValue: number;
  bdtValue: number; costPerKgBdt: number; totalCostBdt: number;
  marginPerKgBdt: number; totalMarginBdt: number; marginPct: number; status: string;
}

interface FxExposure {
  totalUsdValue: number; totalBdtValue: number; effectiveRate: number;
  bookedRate: number; fxGainLossPerUsd: number; fxGainLossTotal: number;
}

const NAVY = '#1F3864'; const GOLD = '#C9A227';

export default function SalesSection() {
  const [data, setData] = useState<SaleItem[]>([]);
  const [fx, setFx] = useState<FxExposure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sales?limit=200')
      .then(r => r.json()).then(res => { setData(res.data || []); setFx(res.fxExposure || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totals = data.reduce((a, s) => ({
    qty: a.qty + (s.qtyKg || 0), usd: a.usd + (s.usdValue || 0),
    bdt: a.bdt + (s.bdtValue || 0), cost: a.cost + (s.totalCostBdt || 0),
    margin: a.margin + (s.totalMarginBdt || 0),
  }), { qty: 0, usd: 0, bdt: 0, cost: 0, margin: 0 });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Sales & Export</h2>

      <Card className="border shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Export Contracts</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <ScrollArea className="max-h-[500px]">
              <div className="overflow-x-auto">
                <Table><TableHeader><TableRow className="hover:bg-transparent">
                  {['Contract #','Date','Buyer','Country','Spec','Length','Qty (kg)','USD/kg','USD Value','BDT Value','Cost/kg','Total Cost','Margin/kg','Total Margin','Margin %','Status'].map(h => (
                    <TableHead key={h} className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>{h}</TableHead>
                  ))}
                </TableRow></TableHeader><TableBody>
                  {data.length === 0 && <TableRow><TableCell colSpan={16} className="text-center text-muted-foreground py-8">No sales contracts</TableCell></TableRow>}
                  {data.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-medium whitespace-nowrap">{item.contractNo}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(item.contractDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{item.buyer?.name}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{item.buyer?.country}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{item.productSpec}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap">{item.lengthInch}"</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap">{item.qtyKg.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap">${item.usdPerKg.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap">${item.usdValue.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap font-medium" style={{ color: GOLD }}>৳{item.bdtValue.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap">৳{item.costPerKgBdt.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap">৳{item.totalCostBdt.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap" style={{ color: item.marginPerKgBdt >= 0 ? GOLD : '#C0392B' }}>৳{item.marginPerKgBdt.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap font-bold" style={{ color: item.totalMarginBdt >= 0 ? GOLD : '#C0392B' }}>৳{item.totalMarginBdt.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap">{item.marginPct.toFixed(1)}%</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={item.status === 'Healthy' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-amber-100 text-amber-800 hover:bg-amber-100'}>{item.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length > 0 && (
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={6} className="text-xs" style={{ color: NAVY }}>TOTAL</TableCell>
                      <TableCell className="text-xs text-right">{totals.qty.toFixed(1)}</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-xs text-right">${totals.usd.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{totals.bdt.toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-xs text-right">৳{totals.cost.toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-xs text-right font-bold" style={{ color: totals.margin >= 0 ? GOLD : '#C0392B' }}>৳{totals.margin.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">{totals.bdt > 0 ? ((totals.margin / totals.bdt) * 100).toFixed(1) + '%' : '-'}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody></Table>
              </div>
            </ScrollArea>
          )}
        </CardContent></Card>

      {/* FX Exposure Summary */}
      {fx && (
        <Card className="border shadow-sm" style={{ backgroundColor: '#F4F6FB' }}>
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold" style={{ color: NAVY }}>FX Exposure Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Revenue (USD)', value: `$${fx.totalUsdValue.toLocaleString()}` },
                { label: 'Total Revenue (BDT)', value: `৳${fx.totalBdtValue.toLocaleString()}`, accent: true },
                { label: 'Effective Rate', value: fx.effectiveRate.toFixed(2) },
                { label: 'Booked FX Rate', value: fx.bookedRate.toFixed(2) },
                { label: 'FX Gain/Loss per USD', value: `${fx.fxGainLossPerUsd >= 0 ? '+' : ''}${fx.fxGainLossPerUsd.toFixed(2)}`, warn: fx.fxGainLossPerUsd < 0 },
                { label: 'FX Gain/Loss Total', value: `৳${fx.fxGainLossTotal.toLocaleString()}`, warn: fx.fxGainLossTotal < 0 },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-sm font-bold mt-0.5 ${item.accent ? '' : ''}`} style={{ color: item.accent ? GOLD : item.warn ? '#C0392B' : NAVY }}>{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}