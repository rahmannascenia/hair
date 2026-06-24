'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

export default function WorkerProfileSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Worker Profile</h2>
      </div>
      <Card>
        <CardHeader><CardTitle>Worker Profiles</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Detailed worker profiles with performance history, attendance records, skill ratings, and factory assignments. Manage individual worker data here.</p>
        </CardContent>
      </Card>
    </div>
  );
}