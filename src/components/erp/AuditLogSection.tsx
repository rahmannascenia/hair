'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollText } from 'lucide-react';

interface Log { id: string; entity: string; entityId?: string; action: string; oldValues?: string; newValues?: string; performedBy?: string; createdAt: string }

const ENTITIES = ['All', 'WorkerDailyEntry', 'Worker', 'Factory', 'Lot', 'Buyer', 'Sale', 'Procurement', 'LCManagement', 'GradeDispute', 'Consumable', 'Settings'];
const ACTIONS = ['All', 'CREATE', 'UPDATE', 'DELETE'];

export default function AuditLogSection() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [entity, setEntity] = useState('All');
  const [action, setAction] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entity !== 'All') params.set('entity', entity);
      if (action !== 'All') params.set('action', action);
      const res = await fetch(`/api/audit-log?${params}`);
      if (res.ok) { const d = await res.json(); setLogs(d.data || []); }
    } finally { setLoading(false); }
  }, [entity, action]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const parseJson = (str?: string) => {
    try { return str ? JSON.parse(str) : null; } catch { return null; }
  };

  const diffView = (oldV?: string, newV?: string) => {
    const o = parseJson(oldV);
    const n = parseJson(newV);
    if (!o && !n) return <span className="text-muted-foreground text-xs">-</span>;
    return (
      <div className="flex gap-4 text-xs font-mono">
        <div className="flex-1">
          {o ? <pre className="bg-red-50 p-2 rounded text-red-700 max-w-xs overflow-x-auto">{JSON.stringify(o, null, 2)}</pre> : <span className="text-muted-foreground">-</span>}
        </div>
        <span className="text-muted-foreground self-center">→</span>
        <div className="flex-1">
          {n ? <pre className="bg-emerald-50 p-2 rounded text-emerald-700 max-w-xs overflow-x-auto">{JSON.stringify(n, null, 2)}</pre> : <span className="text-muted-foreground">-</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ScrollText className="h-6 w-6" style={{ color: '#C9A227' }} />
          <h2 className="text-2xl font-bold">Audit Log</h2>
        </div>
        <div className="flex gap-2">
          <Select value={entity} onValueChange={setEntity}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Entity" /></SelectTrigger>
            <SelectContent>{ENTITIES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>{ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? <p className="text-muted-foreground py-8 text-center">Loading...</p> : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Time</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>Changes</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{log.performedBy || 'system'}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' : log.action === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{log.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium">{log.entity}</span>
                        {log.entityId && <span className="text-[10px] text-muted-foreground ml-1 font-mono">{log.entityId.slice(0, 8)}...</span>}
                      </TableCell>
                      <TableCell className="min-w-[300px]">{diffView(log.oldValues, log.newValues)}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No audit logs found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}