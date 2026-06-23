'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProcItem {
  id: string; voucherNo: string; date: string; supplier: { name: string; country: string };
  originCountry: string; rawWeightKg: number; usdPerKg: number; costPerKgBdt: number;
  goodsUsd: number; freightUsd: number; dutyUsd: number; bankChargesUsd: number;
  landedUsd: number; totalLandedCostBdt: number; landedCostPerKgBdt: number;
  lcNo: string | null; paymentMode: string | null; qualityGrade: string | null;
  fxRate: number; status: string;
}

const NAVY = '#1F3864'; const GOLD = '#C9A227';

export default function ProcurementSection() {
  const [data, setData] = useState<ProcItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/procurement?limit=200')
      .then(r => r.json()).then(res => { setData(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const imports = data.filter(d => d.lcNo);
  const locals = data.filter(d => !d.lcNo);

  const impTotals = imports.reduce((a, i) => ({
    weight: a.weight + (i.rawWeightKg || 0), goods: a.goods + (i.goodsUsd || 0),
    freight: a.freight + (i.freightUsd || 0), duty: a.duty + (i.dutyUsd || 0),
    bank: a.bank + (i.bankChargesUsd || 0), landed: a.landed + (i.landedUsd || 0),
    bdt: a.bdt + (i.totalLandedCostBdt || 0),
  }), { weight: 0, goods: 0, freight: 0, duty: 0, bank: 0, landed: 0, bdt: 0 });

  const locTotals = locals.reduce((a, i) => ({
    weight: a.weight + (i.rawWeightKg || 0), bdt: a.bdt + (i.totalLandedCostBdt || 0),
  }), { weight: 0, bdt: 0 });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Procurement</h2>

      <Tabs defaultValue="import">
        <TabsList><TabsTrigger value="import">Import LC ({imports.length})</TabsTrigger><TabsTrigger value="local">Local Purchase ({locals.length})</TabsTrigger></TabsList>

        <TabsContent value="import">
          <Card className="border shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Import LC Register</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-64 w-full" /> : (
                <ScrollArea className="max-h-[500px]">
                  <Table><TableHeader><TableRow className="hover:bg-transparent">
                    {['LC No','Date','Supplier','Country','Qty (kg)','USD/kg','Goods USD','Freight 3%','Duty 12%','Bank 1%','Landed USD','Landed BDT','BDT/kg','Status'].map(h => (
                      <TableHead key={h} className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>{h}</TableHead>
                    ))}
                  </TableRow></TableHeader><TableBody>
                    {imports.length === 0 && <TableRow><TableCell colSpan={14} className="text-center text-muted-foreground py-8">No import LCs</TableCell></TableRow>}
                    {imports.map(i => (
                      <TableRow key={i.id}>
                        <TableCell className="text-xs font-medium whitespace-nowrap">{i.lcNo}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(i.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{i.supplier?.name}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{i.originCountry}</TableCell>
                        <TableCell className="text-xs text-right">{i.rawWeightKg.toFixed(1)}</TableCell>
                        <TableCell className="text-xs text-right">${i.usdPerKg.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-right">${(i.goodsUsd||0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right">${(i.freightUsd||0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right">${(i.dutyUsd||0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right">${(i.bankChargesUsd||0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right font-medium">${(i.landedUsd||0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right font-medium" style={{ color: GOLD }}>৳{(i.totalLandedCostBdt||0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right font-bold" style={{ color: GOLD }}>৳{(i.landedCostPerKgBdt||0).toLocaleString()}</TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-800 hover:bg-green-100">{i.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {imports.length > 0 && (
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={4} className="text-xs" style={{ color: NAVY }}>TOTAL</TableCell>
                        <TableCell className="text-xs text-right">{impTotals.weight.toFixed(1)}</TableCell>
                        <TableCell colSpan={2}></TableCell>
                        <TableCell className="text-xs text-right">${impTotals.goods.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right">${impTotals.freight.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right">${impTotals.duty.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right">${impTotals.bank.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right">${impTotals.landed.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{impTotals.bdt.toLocaleString()}</TableCell>
                        <TableCell></TableCell><TableCell></TableCell>
                      </TableRow>
                    )}
                  </TableBody></Table>
                </ScrollArea>
              )}
            </CardContent></Card>
        </TabsContent>

        <TabsContent value="local">
          <Card className="border shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Local Purchase Register</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-64 w-full" /> : (
                <ScrollArea className="max-h-[500px]">
                  <Table><TableHeader><TableRow className="hover:bg-transparent">
                    {['Voucher #','Date','Supplier','Region','Qty (kg)','BDT/kg','Total BDT','Payment','Quality','Color Code','Status'].map(h => (
                      <TableHead key={h} className="text-xs font-bold" style={{ color: NAVY }}>{h}</TableHead>
                    ))}
                  </TableRow></TableHeader><TableBody>
                    {locals.length === 0 && <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">No local purchases</TableCell></TableRow>}
                    {locals.map(i => (
                      <TableRow key={i.id}>
                        <TableCell className="text-xs font-medium">{i.voucherNo}</TableCell>
                        <TableCell className="text-xs">{new Date(i.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs">{i.supplier?.name}</TableCell>
                        <TableCell className="text-xs">{i.originCountry}</TableCell>
                        <TableCell className="text-xs text-right">{i.rawWeightKg.toFixed(1)}</TableCell>
                        <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{i.costPerKgBdt.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right font-medium" style={{ color: GOLD }}>৳{(i.totalLandedCostBdt||0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{i.paymentMode || '-'}</TableCell>
                        <TableCell className="text-xs">{i.qualityGrade || '-'}</TableCell>
                        <TableCell className="text-xs">{i.lcNo || '-'}</TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-800 hover:bg-green-100">{i.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {locals.length > 0 && (
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={4} className="text-xs" style={{ color: NAVY }}>TOTAL</TableCell>
                        <TableCell className="text-xs text-right">{locTotals.weight.toFixed(1)}</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{locTotals.bdt.toLocaleString()}</TableCell>
                        <TableCell colSpan={4}></TableCell>
                      </TableRow>
                    )}
                  </TableBody></Table>
                </ScrollArea>
              )}
            </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}