'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Search } from 'lucide-react';

const STAGES = ['Created', 'Washing', 'Distributed', 'InFactory', 'HalfFinishReturned', 'InFinalProduction', 'Finished'];

interface Lot { id: string; lotNo: string; colour: string; rawWeightKg: number; landedCostPerKg: number; totalLandedCost: number; washStatus: string; distributedKg: number; returnedKg: number; finishedKg: number; status: string; createdAt: string; procurement?: { supplier?: { name: string; country: string } } }

interface WashLog { id: string; washId: string; washDate: string; inputKg: number; outputKg: number; wastagePct: number }
interface Dist { id: string; date: string; qtyKg: number; toName: string; status: string }

export default function LotTrackerSection() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [filtered, setFiltered] = useState<Lot[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Lot | null>(null);
  const [washLogs, setWashLogs] = useState<WashLog[]>([]);
  const [dists, setDists] = useState<Dist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLots = useCallback(async () => {
    try {
      const res = await erpFetch('/api/lots?limit=100');
      if (res.ok) { const d = await res.json(); const data = d.data || d || []; setLots(data); setFiltered(data); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLots(); }, [fetchLots]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? lots.filter((l) => l.lotNo.toLowerCase().includes(q) || l.colour.toLowerCase().includes(q)) : lots);
  }, [search, lots]);

  const getStageIndex = (lot: Lot) => {
    if (lot.finishedKg > 0) return 6;
    if (lot.returnedKg > 0) return 4;
    if (lot.distributedKg > 0) return 2;
    if (lot.washStatus === 'Done') return 1;
    return 0;
  };

  const selectLot = async (lot: Lot) => {
    setSelected(lot);
    try {
      const [wRes, dRes] = await Promise.all([
        erpFetch(`/api/wash-logs?lotId=${lot.id}`),
        erpFetch(`/api/distributions?lotId=${lot.id}`),
      ]);
      if (wRes.ok) { const d = await wRes.json(); setWashLogs(d.data || d || []); }
      if (dRes.ok) { const d = await dRes.json(); setDists(d.data || d || []); }
    } catch { /* silent */ }
  };

  const stageDot = (idx: number, currentIdx: number) => {
    if (idx < currentIdx) return <div className="w-3 h-3 rounded-full bg-emerald-500" />;
    if (idx === currentIdx) return <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: '#C9A227', background: 'transparent' }} />;
    return <div className="w-3 h-3 rounded-full bg-gray-300" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6" style={{ color: '#C9A227' }} />
        <h2 className="text-2xl font-bold">Lot Tracker</h2>
      </div>

      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by lot number or colour..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? <p className="text-muted-foreground py-8 text-center">Loading lots...</p> : (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot No</TableHead><TableHead>Colour</TableHead><TableHead>Weight</TableHead><TableHead>Status</TableHead><TableHead>Pipeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 30).map((lot) => {
                const ci = getStageIndex(lot);
                return (
                  <TableRow key={lot.id} className="cursor-pointer hover:bg-muted/50" onClick={() => selectLot(lot)}>
                    <TableCell className="font-medium">{lot.lotNo}</TableCell>
                    <TableCell>{lot.colour}</TableCell>
                    <TableCell>{lot.rawWeightKg} kg</TableCell>
                    <TableCell><Badge variant={lot.status === 'Active' ? 'default' : 'secondary'}>{lot.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {STAGES.map((s, i) => (
                          <div key={s} className="flex items-center gap-1">
                            <div title={s}>{stageDot(i, ci)}</div>
                            {i < STAGES.length - 1 && <div className={`w-3 h-0.5 ${i < ci ? 'bg-emerald-500' : 'bg-gray-300'}`} />}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No lots found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      {selected && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: '#1F3864' }}>{selected.lotNo}</h3>
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Close</Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {STAGES.map((s, i) => {
                const ci = getStageIndex(selected);
                return (
                  <div key={s} className="flex items-center gap-1">
                    <div className="text-center">
                      {stageDot(i, ci)}
                      <p className={`text-[10px] mt-1 ${i === ci ? 'font-bold' : 'text-muted-foreground'}`}>{s}</p>
                    </div>
                    {i < STAGES.length - 1 && <div className={`w-6 h-0.5 mt-[-10px] ${i < ci ? 'bg-emerald-500' : 'bg-gray-300'}`} />}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground">Weight:</span> <strong>{selected.rawWeightKg} kg</strong></div>
              <div><span className="text-muted-foreground">Supplier:</span> <strong>{selected.procurement?.supplier?.name || '-'}</strong></div>
              <div><span className="text-muted-foreground">Colour:</span> <strong>{selected.colour}</strong></div>
              <div><span className="text-muted-foreground">Cost/kg:</span> <strong>৳{selected.landedCostPerKg}</strong></div>
              <div><span className="text-muted-foreground">Distributed:</span> <strong>{selected.distributedKg} kg</strong></div>
              <div><span className="text-muted-foreground">Returned:</span> <strong>{selected.returnedKg} kg</strong></div>
              <div><span className="text-muted-foreground">Finished:</span> <strong>{selected.finishedKg} kg</strong></div>
              <div><span className="text-muted-foreground">Created:</span> <strong>{new Date(selected.createdAt).toLocaleDateString()}</strong></div>
            </div>

            {washLogs.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2" style={{ color: '#1F3864' }}>Wash Logs</h4>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Input</TableHead><TableHead>Output</TableHead><TableHead>Wastage</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {washLogs.map((w) => (
                      <TableRow key={w.id}><TableCell>{new Date(w.washDate).toLocaleDateString()}</TableCell><TableCell>{w.inputKg} kg</TableCell><TableCell>{w.outputKg} kg</TableCell><TableCell className={w.wastagePct > 15 ? 'text-red-500 font-semibold' : ''}>{w.wastagePct}%</TableCell></TableRow>
                    ))}
                  </TableBody></Table>
                </div>
              </div>
            )}

            {dists.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2" style={{ color: '#1F3864' }}>Distributions</h4>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>To</TableHead><TableHead>Qty</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {dists.map((d) => (
                      <TableRow key={d.id}><TableCell>{new Date(d.date).toLocaleDateString()}</TableCell><TableCell>{d.toName}</TableCell><TableCell>{d.qtyKg} kg</TableCell><TableCell><Badge variant="outline">{d.status}</Badge></TableCell></TableRow>
                    ))}
                  </TableBody></Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}