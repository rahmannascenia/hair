'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function LotTrackerSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Lot Tracker</h2>
      </div>
      <Card>
        <CardHeader><CardTitle>Lot Lifecycle Tracking</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Track the full lifecycle of each lot from procurement through washing, distribution, production, and sales. Visual timeline and status tracking coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}