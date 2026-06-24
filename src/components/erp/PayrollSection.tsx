'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Download, TrendingUp, Building2, Users, Banknote, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PayrollFactory {
  factoryId: string;
  factoryName: string;
  supervisorName: string;
  location: string;
  lineLeader: string;
  groupHead: string;
  workerCount: number;
  totalInputKg: number;
  outputKg: number;
  totalAGradeKg: number;
  totalBGradeKg: number;
  totalCGradeKg: number;
  totalWastageKg: number;
  totalPayrollBdt: number;
  grandTotalBdt: number;
  hostingAllowance: number;
  perfBonus: number;
  totalSupPay: number;
  aGradePct: number;
  avgCostPerKg: number;
  wastagePct: number;
  latestRecordDate: string | null;
  latestWipStatus: string;
}

interface CompanyTotals {
  totalFactories: number;
  totalWorkers: number;
  totalInputKg: number;
  totalOutputKg: number;
  totalAGradeKg: number;
  totalBGradeKg: number;
  totalCGradeKg: number;
  totalWastageKg: number;
  totalPayrollBdt: number;
  grandTotalBdt: number;
  hostingAllowance: number;
  perfBonus: number;
  totalSupPay: number;
  avgCostPerKg: number;
  aGradePct: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NAVY = '#1F3864';
const GOLD = '#C9A227';

// ─── Component ───────────────────────────────────────────────────────────────

export default function PayrollSection() {
  const [factories, setFactories] = useState<PayrollFactory[]>([]);
  const [totals, setTotals] = useState<CompanyTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/payroll')
      .then(r => r.json())
      .then(res => {
        setFactories(res.factories || []);
        setTotals(res.companyTotals || null);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load payroll data');
        setLoading(false);
      });
  }, []);

  const exportCSV = () => {
    if (factories.length === 0) { toast.error('No data to export'); return; }
    const headers = ['Factory', 'Supervisor', 'Location', 'Line Leader', 'Workers', 'Input (kg)', 'Output (kg)', 'A-Grade (kg)', 'B-Grade (kg)', 'C-Grade (kg)', 'Wastage (kg)', 'Base Wages', 'Host+Bonus', 'Supervisor Pay', 'Grand Total (BDT)', 'A-Grade %', 'Avg Cost/kg'];
    const rows = factories.map(f => [
      f.factoryId,
      f.supervisorName,
      f.location,
      f.lineLeader,
      f.workerCount,
      f.totalInputKg.toFixed(1),
      f.outputKg.toFixed(1),
      f.totalAGradeKg.toFixed(1),
      f.totalBGradeKg.toFixed(1),
      f.totalCGradeKg.toFixed(1),
      f.totalWastageKg.toFixed(1),
      f.totalPayrollBdt.toFixed(0),
      (f.hostingAllowance + f.perfBonus).toFixed(0),
      f.totalSupPay.toFixed(0),
      f.grandTotalBdt.toFixed(0),
      f.aGradePct.toFixed(1),
      f.avgCostPerKg.toFixed(0),
    ]);
    if (totals) {
      rows.push(['TOTAL', '', '', '', totals.totalWorkers, totals.totalInputKg.toFixed(1), totals.totalOutputKg.toFixed(1), totals.totalAGradeKg.toFixed(1), totals.totalBGradeKg.toFixed(1), totals.totalCGradeKg.toFixed(1), totals.totalWastageKg.toFixed(1), totals.totalPayrollBdt.toFixed(0), (totals.hostingAllowance + totals.perfBonus).toFixed(0), totals.totalSupPay.toFixed(0), totals.grandTotalBdt.toFixed(0), totals.aGradePct.toFixed(1), totals.avgCostPerKg.toFixed(0)]);
    }
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Payroll report exported');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Payroll</h2>
        <Button variant="outline" onClick={exportCSV} disabled={loading || factories.length === 0} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#E8EBF5' }}>
                <Building2 className="h-5 w-5" style={{ color: NAVY }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Factories</p>
                <p className="text-xl font-bold" style={{ color: NAVY }}>{totals.totalFactories}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FDF5E6' }}>
                <Users className="h-5 w-5" style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Workers</p>
                <p className="text-xl font-bold" style={{ color: NAVY }}>{totals.totalWorkers}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FDF5E6' }}>
                <Banknote className="h-5 w-5" style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Grand Total (BDT)</p>
                <p className="text-xl font-bold" style={{ color: GOLD }}>৳{totals.grandTotalBdt.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#E8F5E9' }}>
                <TrendingUp className="h-5 w-5" style={{ color: '#16a34a' }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">A-Grade %</p>
                <p className="text-xl font-bold" style={{ color: totals.aGradePct >= 60 ? '#16a34a' : '#dc2626' }}>{totals.aGradePct.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border col-span-2 lg:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#E8EBF5' }}>
                <BarChart3 className="h-5 w-5" style={{ color: NAVY }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Cost/kg</p>
                <p className="text-xl font-bold" style={{ color: NAVY }}>৳{totals.avgCostPerKg.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Cross-Factory Payroll Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#F4F6FB' }}>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Factory</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Supervisor</TableHead>
                    <TableHead className="text-xs font-bold hidden md:table-cell" style={{ color: NAVY }}>Location</TableHead>
                    <TableHead className="text-xs font-bold hidden lg:table-cell" style={{ color: NAVY }}>Line Leader</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Workers</TableHead>
                    <TableHead className="text-xs font-bold text-right hidden sm:table-cell" style={{ color: NAVY }}>Input (kg)</TableHead>
                    <TableHead className="text-xs font-bold text-right hidden sm:table-cell" style={{ color: NAVY }}>Output (kg)</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Base Wages</TableHead>
                    <TableHead className="text-xs font-bold text-right hidden lg:table-cell" style={{ color: NAVY }}>Host+Bonus</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: GOLD }}>Grand Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factories.length === 0 && (
                    <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">No payroll data available</TableCell></TableRow>
                  )}
                  {factories.map(f => {
                    const isExpanded = expandedRow === f.factoryId;
                    return (
                      <>
                        <TableRow
                          key={f.factoryId}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setExpandedRow(isExpanded ? null : f.factoryId)}
                        >
                          <TableCell className="w-8 text-xs text-muted-foreground">
                            <span className="transition-transform inline-block" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                          </TableCell>
                          <TableCell className="text-xs font-medium">{f.factoryId}</TableCell>
                          <TableCell className="text-xs">{f.supervisorName}</TableCell>
                          <TableCell className="text-xs hidden md:table-cell">{f.location}</TableCell>
                          <TableCell className="text-xs hidden lg:table-cell">{f.lineLeader}</TableCell>
                          <TableCell className="text-xs text-right">{f.workerCount}</TableCell>
                          <TableCell className="text-xs text-right hidden sm:table-cell">{f.totalInputKg.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right hidden sm:table-cell">{f.outputKg.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">৳{f.totalPayrollBdt.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right hidden lg:table-cell">৳{(f.hostingAllowance + f.perfBonus).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right font-bold" style={{ color: GOLD }}>৳{f.grandTotalBdt.toLocaleString()}</TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${f.factoryId}-detail`} style={{ backgroundColor: '#FAFBFE' }}>
                            <TableCell colSpan={11} className="p-4">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div><span className="text-muted-foreground text-xs">Group Head</span><p className="font-medium">{f.groupHead}</p></div>
                                <div><span className="text-muted-foreground text-xs">Supervisor Pay</span><p className="font-medium" style={{ color: GOLD }}>৳{f.totalSupPay.toLocaleString()}</p></div>
                                <div><span className="text-muted-foreground text-xs">A-Grade %</span>
                                  <p className="font-medium" style={{ color: f.aGradePct >= 60 ? '#16a34a' : '#dc2626' }}>{f.aGradePct.toFixed(1)}%</p>
                                </div>
                                <div><span className="text-muted-foreground text-xs">Avg Cost/kg</span><p className="font-medium">৳{f.avgCostPerKg.toLocaleString()}</p></div>
                                <div><span className="text-muted-foreground text-xs">A-Grade (kg)</span><p className="font-medium">{f.totalAGradeKg.toFixed(1)}</p></div>
                                <div><span className="text-muted-foreground text-xs">B-Grade (kg)</span><p className="font-medium">{f.totalBGradeKg.toFixed(1)}</p></div>
                                <div><span className="text-muted-foreground text-xs">C-Grade (kg)</span><p className="font-medium">{f.totalCGradeKg.toFixed(1)}</p></div>
                                <div><span className="text-muted-foreground text-xs">Wastage</span><p className="font-medium">{f.wastagePct.toFixed(1)}% ({f.totalWastageKg.toFixed(1)} kg)</p></div>
                                <div><span className="text-muted-foreground text-xs">WIP Status</span>
                                  <p>
                                    <Badge variant="secondary" className={
                                      f.latestWipStatus === 'COMPLETED' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                      f.latestWipStatus === 'IN PROGRESS' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' :
                                      'bg-gray-100 text-gray-800 hover:bg-gray-100'
                                    }>{f.latestWipStatus}</Badge>
                                  </p>
                                </div>
                                <div><span className="text-muted-foreground text-xs">Latest Record</span><p className="font-medium">{f.latestRecordDate ? new Date(f.latestRecordDate).toLocaleDateString() : 'N/A'}</p></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                  {totals && factories.length > 0 && (
                    <TableRow className="font-bold" style={{ backgroundColor: '#E8EBF5' }}>
                      <TableCell></TableCell>
                      <TableCell className="text-xs" style={{ color: NAVY }}>TOTAL</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="hidden md:table-cell"></TableCell>
                      <TableCell className="hidden lg:table-cell"></TableCell>
                      <TableCell className="text-xs text-right" style={{ color: NAVY }}>{totals.totalWorkers}</TableCell>
                      <TableCell className="text-xs text-right hidden sm:table-cell">{totals.totalInputKg.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right hidden sm:table-cell">{totals.totalOutputKg.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right" style={{ color: NAVY }}>৳{totals.totalPayrollBdt.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right hidden lg:table-cell" style={{ color: NAVY }}>৳{(totals.hostingAllowance + totals.perfBonus).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right" style={{ color: GOLD }}>৳{totals.grandTotalBdt.toLocaleString()}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}