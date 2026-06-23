'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  totalActiveLots: number;
  totalWorkers: number;
  dailyOutputKg: number;
  aGradePct: number;
  avgCostPerKg: number;
  totalPayroll: number;
  exportRevenueBDT: number;
  fxRate: number;
}

interface CostingData {
  factories: { factoryId: string; factoryName: string; totalAGradeKg: number; totalBGradeKg: number; totalCGradeKg: number; costPerKg: number }[];
}

interface SalesData {
  data: { buyer: { name: string }; bdtValue: number }[];
}

interface InventoryBucket {
  name: string;
  valueBdt: number;
  weightKg: number;
}

interface SizePricingItem {
  lengthInch: number;
  bdtPerKg: number;
}

const GOLD = '#C9A227';
const NAVY = '#1F3864';

const kpiTiles = [
  { key: 'totalActiveLots', label: 'Active Lots', format: (v: number) => v.toString() },
  { key: 'totalWorkers', label: 'Total Workers', format: (v: number) => v.toString() },
  { key: 'dailyOutputKg', label: 'Daily Output (kg)', format: (v: number) => v.toFixed(1) },
  { key: 'aGradePct', label: 'A-Grade %', format: (v: number) => v.toFixed(1) + '%' },
  { key: 'avgCostPerKg', label: 'Avg Cost/kg (BDT)', format: (v: number) => '৳' + v.toLocaleString() },
  { key: 'totalPayroll', label: 'Total Payroll (BDT)', format: (v: number) => '৳' + v.toLocaleString() },
  { key: 'exportRevenueBDT', label: 'Export Revenue (BDT)', format: (v: number) => '৳' + v.toLocaleString() },
  { key: 'fxRate', label: 'FX Rate (USD/BDT)', format: (v: number) => v.toFixed(2) },
];

export default function DashboardSection() {
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [costData, setCostData] = useState<CostingData | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryBucket[]>([]);
  const [sizePricingData, setSizePricingData] = useState<SizePricingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then(r => r.json()),
      fetch('/api/costing').then(r => r.json()),
      fetch('/api/sales?limit=100').then(r => r.json()),
      fetch('/api/inventory').then(r => r.json()),
      fetch('/api/size-pricing').then(r => r.json()),
    ])
      .then(([d, c, s, inv, sp]) => {
        setDashData(d);
        setCostData(c);
        setSalesData(s);
        setInventoryData(inv?.buckets || []);
        setSizePricingData(sp?.sizePricing || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const gradeData = costData?.factories ? costData.factories.map(f => ({
    name: f.factoryId,
    A: f.totalAGradeKg,
    B: f.totalBGradeKg,
    C: f.totalCGradeKg,
  })) : [];

  const totalGrades = {
    A: gradeData.reduce((s, d) => s + (d.A || 0), 0),
    B: gradeData.reduce((s, d) => s + (d.B || 0), 0),
    C: gradeData.reduce((s, d) => s + (d.C || 0), 0),
  };

  const gradePieData = [
    { name: 'A Grade', value: totalGrades.A },
    { name: 'B Grade', value: totalGrades.B },
    { name: 'C Grade', value: totalGrades.C },
  ].filter(d => d.value > 0);

  const costBarData = costData?.factories?.map(f => ({
    name: f.factoryId,
    'Cost/kg': f.costPerKg,
  })) || [];

  const buyerMap = new Map<string, number>();
  salesData?.data?.forEach((s: { buyer: { name: string }; bdtValue: number }) => {
    buyerMap.set(s.buyer.name, (buyerMap.get(s.buyer.name) || 0) + s.bdtValue);
  });
  const buyerPieData = Array.from(buyerMap, ([name, value]) => ({ name, value }));

  // Inventory bucket bar chart data
  const invBarData = inventoryData.map(b => ({
    name: b.name.length > 10 ? b.name.slice(0, 10) + '…' : b.name,
    fullName: b.name,
    'Value (BDT)': b.valueBdt,
  }));

  // Size-wise rate chart data
  const sizeLineData = sizePricingData.map(sp => ({
    name: sp.lengthInch + '"',
    'BDT/kg': sp.bdtPerKg,
  }));

  const PIE_COLORS = [GOLD, NAVY, '#5B8DB8', '#E8B84B', '#2D5F8A'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Dashboard</h2>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiTiles.map(tile => {
          const val = dashData?.[tile.key as keyof DashboardData] ?? 0;
          return (
            <Card key={tile.key} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">{tile.label}</p>
                <p className="text-xl md:text-2xl font-bold mt-1" style={{ color: GOLD }}>
                  {tile.format(typeof val === 'number' ? val : 0)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Grade Distribution Pie */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {gradePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={gradePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {gradePieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Cost per kg Bar */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Cost per kg by Factory</CardTitle>
          </CardHeader>
          <CardContent>
            {costBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={costBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Cost/kg" fill={GOLD} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Sales by Buyer Pie */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Sales by Buyer</CardTitle>
          </CardHeader>
          <CardContent>
            {buyerPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={buyerPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {buyerPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => '৳' + v.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Inventory Value by Bucket */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Inventory Value by Bucket</CardTitle>
          </CardHeader>
          <CardContent>
            {invBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={invBarData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toString()} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip formatter={(v: number) => ['৳' + v.toLocaleString(), 'Value (BDT)']} labelFormatter={(l: string) => {
                    const found = invBarData.find(d => d.name === l);
                    return found?.fullName || l;
                  }} />
                  <Bar dataKey="Value (BDT)" fill={GOLD} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Size-wise Rate Master */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Size-wise Rate Master</CardTitle>
          </CardHeader>
          <CardContent>
            {sizeLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={sizeLineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => '৳' + v} />
                  <Tooltip formatter={(v: number) => ['৳' + v.toLocaleString(), 'BDT/kg']} />
                  <Line type="monotone" dataKey="BDT/kg" stroke={GOLD} strokeWidth={2} dot={{ fill: GOLD, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}