'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Ship, Home, CheckCircle2, Circle, Clock, DollarSign, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcurementLifecycleProps {
  procId: string;
  onBack: () => void;
}

export default function ProcurementLifecycle({ procId, onBack }: ProcurementLifecycleProps) {
  const [proc, setProc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await erpFetch(`/api/procurement/${procId}`);
      if (res.ok) {
        const data = await res.json();
        setProc(data);
      }
    } catch (error) {
      console.error('Error fetching procurement details:', error);
    } finally {
      setLoading(false);
    }
  }, [procId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!proc) return <div>Procurement not found.</div>;

  const isImport = !!proc.lcNo;
  const stages = isImport ? [
    { name: 'LC Issued', status: 'completed', icon: DollarSign, date: proc.date },
    { name: 'Shipment', status: proc.status === 'In Transit' || proc.status === 'Cleared' || proc.status === 'Received' ? 'completed' : 'pending', icon: Ship },
    { name: 'Customs Clearance', status: proc.status === 'Cleared' || proc.status === 'Received' ? 'completed' : 'pending', icon: Clock },
    { name: 'Warehouse Received', status: proc.status === 'Received' ? 'completed' : 'pending', icon: Home, date: proc.status === 'Received' ? proc.updatedAt : null },
  ] : [
    { name: 'Order Placed', status: 'completed', icon: Clock, date: proc.date },
    { name: 'In Transit', status: proc.status === 'Received' ? 'completed' : 'in-progress', icon: Ship },
    { name: 'Warehouse Received', status: proc.status === 'Received' ? 'completed' : 'pending', icon: Home, date: proc.status === 'Received' ? proc.updatedAt : null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to List
        </Button>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {proc.voucherNo}
          </Badge>
          <Badge className="bg-emerald-100 text-emerald-800">
            {proc.status}
          </Badge>
        </div>
      </div>

      <Card className="bg-slate-50 border-none shadow-sm">
        <CardContent className="p-8">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0" />
            {stages.map((stage, idx) => (
              <div key={stage.name} className="relative z-10 flex flex-col items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-4 shadow-sm",
                  stage.status === 'completed' ? "bg-emerald-500 border-white text-white" :
                  stage.status === 'in-progress' ? "bg-amber-500 border-white text-white animate-pulse" : "bg-white border-slate-200 text-slate-300"
                )}>
                  <stage.icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-tight">{stage.name}</p>
                  {stage.date && <p className="text-[10px] text-muted-foreground">{new Date(stage.date).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Financial Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-[10px] text-blue-600 font-bold uppercase">Goods Value</p>
                  <p className="text-lg font-mono font-bold">${proc.goodsUsd?.toLocaleString() || '0'}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-[10px] text-amber-600 font-bold uppercase">Landed Cost (BDT)</p>
                  <p className="text-lg font-mono font-bold">৳{proc.totalLandedCostBdt?.toLocaleString() || '0'}</p>
                </div>
             </div>
             <div className="space-y-2 text-sm pt-2 border-t">
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Supplier:</span>
                 <span className="font-medium">{proc.supplier?.name}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Origin:</span>
                 <span className="font-medium">{proc.originCountry}</span>
               </div>
               {isImport && (
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">LC No:</span>
                   <span className="font-bold text-blue-600 font-mono">{proc.lcNo}</span>
                 </div>
               )}
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Stock & Inventory</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Raw Weight Received</p>
                  <p className="text-2xl font-bold">{proc.rawWeightKg} kg</p>
                </div>
                <div className="h-12 w-12 rounded bg-slate-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-slate-400" />
                </div>
             </div>
             <div className="pt-4 border-t">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Related Lots</p>
                <div className="flex flex-wrap gap-2">
                  {proc.lots?.map((l: any) => (
                    <Badge key={l.id} variant="secondary" className="px-3 py-1">
                      {l.lotNo} ({l.colour})
                    </Badge>
                  ))}
                  {(!proc.lots || proc.lots.length === 0) && <p className="text-xs text-muted-foreground italic">No lots associated yet</p>}
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
