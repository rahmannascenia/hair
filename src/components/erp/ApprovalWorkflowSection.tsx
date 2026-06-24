'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';

export default function ApprovalWorkflowSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CheckSquare className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Approval Workflow</h2>
      </div>
      <Card>
        <CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Multi-level approval workflows for procurement, payroll, and operational decisions. Track pending items, approve/reject with comments, and view approval history.</p>
        </CardContent>
      </Card>
    </div>
  );
}