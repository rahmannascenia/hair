'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function LeaderboardSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Leaderboard</h2>
      </div>
      <Card>
        <CardHeader><CardTitle>Performance Leaderboard</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Worker and factory performance rankings based on output quality, A-grade ratio, efficiency, and attendance. Monthly and weekly leaderboards.</p>
        </CardContent>
      </Card>
    </div>
  );
}