'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

export default function BuyerSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Buyers</h2>
      </div>
      <Card>
        <CardHeader><CardTitle>Buyer Management</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Manage buyer profiles, country assignments, and buyer-specific pricing premiums. Track order history and buyer relationships.</p>
        </CardContent>
      </Card>
    </div>
  );
}