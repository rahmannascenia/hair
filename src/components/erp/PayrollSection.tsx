'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface PayrollFactory {
  factoryId: string;
  factoryName: string;
  supervisorName: string;
  location: string;
  lineLeader: string;
  workerCount: number;
  totalInputKg: number;
  outputKg: number;
  totalPayrollBdt: number;
  grandTotalBdt: number;
  hostingAllowance: number;
  perfBonus: number;
  totalSupPay: number;
}

interface CompanyTotals {
  totalFactories: number;
  totalWorkers: number;
  totalInputKg: number;
  totalOutputKg: number;
  grandTotalBdt: number;
  totalSupPay: number;
  totalPayrollBdt: number;
  hostingAllowance: number;
  perfBonus: number;
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';

export default function PayrollSection() {
  const [factories, setFactories] = useState<PayrollFactory[]>([]);
  const [totals, setTotals] = useState<CompanyTotals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payroll')
      .then(r => r.json())
      .then(res => {
        setFactories(res.factories || []);
        setTotals(res.companyTotals || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Payroll</h2>
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Cross-Factory Payroll Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-8 w-full" />{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Factory</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Supervisor</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Location</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Line Leader</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Workers</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Input (kg)</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Output (kg)</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Base Wages</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Host+Bonus</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Supervisor Pay</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Grand Total</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factories.length === 0 && (
                    <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">No payroll data</TableCell></TableRow>
                  )}
                  {factories.map(f => (
                    <TableRow key={f.factoryId}>
                      <TableCell className="text-xs font-medium">{f.factoryId}</TableCell>
                      <TableCell className="text-xs">{f.supervisorName}</TableCell>
                      <TableCell className="text-xs">{f.location}</TableCell>
                      <TableCell className="text-xs">{f.lineLeader}</TableCell>
                      <TableCell className="text-xs text-right">{f.workerCount}</TableCell>
                      <TableCell className="text-xs text-right">{f.totalInputKg.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right">{f.outputKg.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right">৳{f.totalPayrollBdt.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">৳{(f.hostingAllowance + f.perfBonus).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{f.totalSupPay.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-bold" style={{ color: GOLD }}>৳{f.grandTotalBdt.toLocaleString()}</TableCell>
                      <TableCell><Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Factories</p><p className="text-xl font-bold" style={{ color: GOLD }}>{totals.totalFactories}</p></CardContent></Card>
          <Card className="border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Workers</p><p className="text-xl font-bold" style={{ color: GOLD }}>{totals.totalWorkers}</p></CardContent></Card>
          <Card className="border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Payroll (BDT)</p><p className="text-xl font-bold" style={{ color: GOLD }}>৳{totals.grandTotalBdt.toLocaleString()}</p></CardContent></Card>
          <Card className="border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg Cost/kg</p><p className="text-xl font-bold" style={{ color: GOLD }}>৳{totals.totalOutputKg > 0 ? (totals.grandTotalBdt / totals.totalOutputKg).toFixed(0) : 0}</p></CardContent></Card>
        </div>
      )}
    </div>
  );
}