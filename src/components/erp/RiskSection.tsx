'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface RiskItem {
  id: string;
  riskId: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  mitigation: string;
  owner: string;
  status: string;
}

interface CategorySummary {
  category: string;
  openRisks: number;
  avgScore: number;
  maxScore: number;
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';

function getScoreColor(score: number) {
  if (score >= 20) return 'bg-red-100 text-red-800';
  if (score >= 12) return 'bg-amber-100 text-amber-800';
  return 'bg-green-100 text-green-800';
}

function getStatusStyle(status: string) {
  if (status === 'Open') return 'bg-red-100 text-red-800 hover:bg-red-100';
  if (status === 'Mitigated') return 'bg-green-100 text-green-800 hover:bg-green-100';
  return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
}

function getCatColor(avg: number) {
  if (avg >= 15) return 'border-red-300 bg-red-50';
  if (avg >= 8) return 'border-amber-300 bg-amber-50';
  return 'border-green-300 bg-green-50';
}

export default function RiskSection() {
  const [data, setData] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/risks')
      .then(r => r.json())
      .then(res => { setData(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Category summary
  const categoryMap = new Map<string, RiskItem[]>();
  data.forEach(r => {
    const cat = r.category || 'Uncategorized';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(r);
  });

  const categorySummary: CategorySummary[] = Array.from(categoryMap.entries()).map(([category, risks]) => {
    const openRisks = risks.filter(r => r.status === 'Open').length;
    const scores = risks.map(r => r.riskScore);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const maxScore = Math.max(...scores, 0);
    return { category, openRisks, avgScore, maxScore };
  }).sort((a, b) => b.maxScore - a.maxScore);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Risk Register</h2>
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>All Risks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-8 w-full" />{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Risk ID</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Description</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Category</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Likelihood</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Impact</TableHead>
                    <TableHead className="text-xs font-bold text-right" style={{ color: NAVY }}>Risk Score</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Mitigation</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Owner</TableHead>
                    <TableHead className="text-xs font-bold" style={{ color: NAVY }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No risks registered</TableCell></TableRow>
                  )}
                  {data.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-medium">{item.riskId}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{item.description}</TableCell>
                      <TableCell className="text-xs">{item.category}</TableCell>
                      <TableCell className="text-xs text-right">{item.likelihood}</TableCell>
                      <TableCell className="text-xs text-right">{item.impact}</TableCell>
                      <TableCell className="text-xs text-right">
                        <Badge className={getScoreColor(item.riskScore)}>{item.riskScore}</Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[180px] truncate">{item.mitigation}</TableCell>
                      <TableCell className="text-xs">{item.owner}</TableCell>
                      <TableCell>
                        <Badge className={getStatusStyle(item.status)}>{item.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Risk Category Summary */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Risk Category Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categorySummary.map(cat => (
                <Card key={cat.category} className={`border ${getCatColor(cat.avgScore)}`}>
                  <CardContent className="p-4">
                    <p className="text-sm font-bold" style={{ color: NAVY }}>{cat.category}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Open Risks</span>
                        <span className="font-semibold">{cat.openRisks}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Avg Risk Score</span>
                        <span className="font-semibold">{cat.avgScore.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Max Score</span>
                        <Badge className={getScoreColor(cat.maxScore)}>{cat.maxScore}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {categorySummary.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-8 text-sm">No risk categories</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}