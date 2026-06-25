'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, TrendingUp, Users, Package, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';

interface FactoryDrillDownProps {
  factoryId: string;
  onBack: () => void;
}

export default function FactoryDrillDown({ factoryId, onBack }: FactoryDrillDownProps) {
  const [factory, setFactory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await erpFetch(`/api/factories/${factoryId}`);
      if (res.ok) {
        const data = await res.json();
        setFactory(data);
      }
    } catch (error) {
      console.error('Error fetching factory details:', error);
    } finally {
      setLoading(false);
    }
  }, [factoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!factory) return <div>Factory not found.</div>;

  const records = factory.dailyRecords || [];
  const chartData = records.map((r: any) => ({
    date: new Date(r.recordDate).toLocaleDateString(),
    input: r.totalInputKg,
    output: r.totalAGradeKg + r.totalBGradeKg + r.totalCGradeKg,
    aGrade: r.totalAGradeKg,
  })).reverse();

  const totalA = records.reduce((s: number, r: any) => s + (r.totalAGradeKg || 0), 0);
  const totalB = records.reduce((s: number, r: any) => s + (r.totalBGradeKg || 0), 0);
  const totalC = records.reduce((s: number, r: any) => s + (r.totalCGradeKg || 0), 0);
  const totalOut = totalA + totalB + totalC;
  const gradeData = [
    { name: 'A Grade', value: totalA, color: '#10b981' },
    { name: 'B Grade', value: totalB, color: '#f59e0b' },
    { name: 'C Grade', value: totalC, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to List
        </Button>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {factory.factoryId}
          </Badge>
          <Badge className={factory.isActive ? 'bg-green-100 text-green-800' : ''}>
            {factory.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Supervisor</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{factory.supervisorName}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Location</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{factory.location}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Worker Count</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{factory.workers?.length || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Output</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{totalOut.toFixed(1)} kg</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Production Trend (Last 10 Records)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="input" stroke="#3b82f6" name="Input (kg)" strokeWidth={2} />
                <Line type="monotone" dataKey="output" stroke="#10b981" name="Output (kg)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Overall Grade Distribution</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {gradeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Recent Production Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Lot No</TableHead>
                  <TableHead className="text-right">Input</TableHead>
                  <TableHead className="text-right">A Grade</TableHead>
                  <TableHead className="text-right">B Grade</TableHead>
                  <TableHead className="text-right">C Grade</TableHead>
                  <TableHead className="text-right">Wastage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.slice(0, 10).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{new Date(r.recordDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-xs">{r.lot?.lotNo}</TableCell>
                    <TableCell className="text-right text-xs">{r.totalInputKg.toFixed(1)} kg</TableCell>
                    <TableCell className="text-right text-xs text-emerald-600">{r.totalAGradeKg.toFixed(1)} kg</TableCell>
                    <TableCell className="text-right text-xs text-amber-600">{r.totalBGradeKg.toFixed(1)} kg</TableCell>
                    <TableCell className="text-right text-xs text-red-500">{r.totalCGradeKg.toFixed(1)} kg</TableCell>
                    <TableCell className="text-right text-xs">{r.totalWastageKg.toFixed(1)} kg</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{r.wipStatus}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
