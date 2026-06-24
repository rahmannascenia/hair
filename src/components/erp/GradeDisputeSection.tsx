'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale } from 'lucide-react';

export default function GradeDisputeSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Scale className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Grade Dispute</h2>
      </div>
      <Card>
        <CardHeader><CardTitle>Grade Dispute Resolution</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">File and resolve grade disputes between supervisors and QC. Track dispute status, evidence, and resolution outcomes with full history.</p>
        </CardContent>
      </Card>
    </div>
  );
}