'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertOctagon } from 'lucide-react';

export default function RejectionInvestigationSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertOctagon className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Rejection Investigation</h2>
      </div>
      <Card>
        <CardHeader><CardTitle>Rejection Analysis</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Investigate and document lot rejections, quality failures, and customer returns. Root cause analysis and corrective action tracking.</p>
        </CardContent>
      </Card>
    </div>
  );
}