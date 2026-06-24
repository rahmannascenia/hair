'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText } from 'lucide-react';

export default function AuditLogSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Audit Log</h2>
      </div>
      <Card>
        <CardHeader><CardTitle>System Audit Trail</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Complete audit trail of all system actions: data changes, user logins, approvals, and configuration updates. Filterable by user, action type, and date range.</p>
        </CardContent>
      </Card>
    </div>
  );
}