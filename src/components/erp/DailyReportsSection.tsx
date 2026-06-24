'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function DailyReportsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Daily Reports</h2>
      </div>
      <Card>
        <CardHeader><CardTitle>Daily Factory Reports</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">View and manage daily production reports from all factories. Includes input/output tracking, grade breakdowns, and supervisor summaries.</p>
        </CardContent>
      </Card>
    </div>
  );
}