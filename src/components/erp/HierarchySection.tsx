'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network } from 'lucide-react';

export default function HierarchySection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Network className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Organization Hierarchy</h2>
      </div>
      <Card>
        <CardHeader><CardTitle>Org Chart</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Visualize the complete organizational hierarchy: Owner → Head Leaders → Line Leaders → Supervisors → Factories → Workers. Interactive org chart view.</p>
        </CardContent>
      </Card>
    </div>
  );
}