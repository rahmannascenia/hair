'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react';

export default function ConsumablesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Droplets className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Consumables</h2>
      </div>
      <Card>
        <CardHeader><CardTitle>Consumables Inventory</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Track chemicals, packaging materials, and other consumables used in the production process. Monitor stock levels and reorder points.</p>
        </CardContent>
      </Card>
    </div>
  );
}