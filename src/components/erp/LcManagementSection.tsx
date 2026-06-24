'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function LcManagementSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">LC Management</h2>
      </div>
      <Card>
        <CardHeader><CardTitle>Letter of Credit Tracking</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Track Letters of Credit for international procurement. Manage LC status, expiry dates, bank details, and document submissions.</p>
        </CardContent>
      </Card>
    </div>
  );
}