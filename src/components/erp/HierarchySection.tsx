'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, ChevronDown, ChevronRight, Users } from 'lucide-react';

interface HL { id: string; name: string; phone?: string; region: string; lineLeaders: LL[] }
interface LL { id: string; name: string; headLeaderId: string; factories: Factory[] }
interface Factory { id: string; factoryId: string; name: string; supervisorName: string; location: string; workerCount?: number }

export default function HierarchySection() {
  const [data, setData] = useState<HL[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [hlRes, llRes, fRes, wRes] = await Promise.all([
        erpFetch('/api/head-leaders'), erpFetch('/api/line-leaders'), erpFetch('/api/factories'), erpFetch('/api/workers?limit=200'),
      ]);
      if (!hlRes.ok || !llRes.ok || !fRes.ok) return;
      const hls = (await hlRes.json()).data || [];
      const lls = (await llRes.json()).data || [];
      const factories = (await fRes.json()).data || [];
      const workers = wRes.ok ? (await wRes.json()).data || [] : [];

      const workerCountByFactory = new Map<string, number>();
      workers.forEach((w: { factoryId: string }) => { workerCountByFactory.set(w.factoryId, (workerCountByFactory.get(w.factoryId) || 0) + 1); });

      const factoriesWithCounts = factories.map((f: Factory) => ({ ...f, workerCount: workerCountByFactory.get(f.id) || 0 }));

      const llByHl = new Map<string, Factory[]>();
      factoriesWithCounts.forEach((f: Factory & { lineLeaderId?: string }) => {
        const arr = llByHl.get(f.lineLeaderId || '') || [];
        arr.push(f);
        llByHl.set(f.lineLeaderId || '', arr);
      });

      const structured = hls.map((hl: HL) => ({
        ...hl,
        lineLeaders: lls.filter((ll: LL) => ll.headLeaderId === hl.id).map((ll: LL) => ({
          ...ll,
          factories: llByHl.get(ll.id) || [],
        })),
      }));

      setData(structured);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggle = (id: string) => {
    setExpanded((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  if (loading) return <p className="text-muted-foreground py-8 text-center">Loading hierarchy...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Network className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Organization Hierarchy</h2>
      </div>

      <div className="space-y-3">
        {data.map((hl) => (
          <Card key={hl.id}>
            <CardContent className="p-4">
              <button onClick={() => toggle(hl.id)} className="flex items-center gap-3 w-full text-left cursor-pointer">
                {expanded.has(hl.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: '#1F3864' }}>
                  {hl.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-bold" style={{ color: '#1F3864' }}>{hl.name}</p>
                  <p className="text-xs text-muted-foreground">{hl.region} • {hl.lineLeaders.length} Line Leaders</p>
                </div>
                <Badge variant="outline">Head Leader</Badge>
              </button>

              {expanded.has(hl.id) && (
                <div className="ml-8 mt-3 space-y-3 border-l-2 pl-4" style={{ borderColor: '#C9A227' }}>
                  {hl.lineLeaders.map((ll) => (
                    <div key={ll.id}>
                      <button onClick={() => toggle(ll.id)} className="flex items-center gap-3 w-full text-left cursor-pointer">
                        {expanded.has(ll.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: '#C9A227' }}>
                          {ll.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{ll.name}</p>
                          <p className="text-xs text-muted-foreground">{ll.factories.length} Factories</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">Line Leader</Badge>
                      </button>

                      {expanded.has(ll.id) && (
                        <div className="ml-8 mt-2 space-y-2 border-l-2 pl-4" style={{ borderColor: '#ddd' }}>
                          {ll.factories.map((f) => (
                            <div key={f.id} className="flex items-center gap-3 py-1">
                              <div className="w-7 h-7 rounded flex items-center justify-center bg-muted text-xs font-bold">F</div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{f.name}</p>
                                <p className="text-xs text-muted-foreground">{f.location} • {f.supervisorName}</p>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span className="font-medium">{f.workerCount || 0}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}