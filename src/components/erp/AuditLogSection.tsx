'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollText, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { erpFetch } from '@/lib/api-client';
import { useErpStore } from '@/lib/store';

interface Log {
  id: string; entity: string; entityId?: string; action: string;
  oldValues?: string; newValues?: string; performedBy?: string; createdAt: string;
}

interface Filters {
  entities: string[];
  users: string[];
  actions: string[];
}

export default function AuditLogSection() {
  const { user } = useErpStore();
  const [logs, setLogs] = useState<Log[]>([]);
  const [filters, setFilters] = useState<Filters>({ entities: [], users: [], actions: [] });
  const [entity, setEntity] = useState('All');
  const [action, setAction] = useState('All');
  const [performedBy, setPerformedBy] = useState('All');
  const [entityIdFilter, setEntityIdFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entity !== 'All') params.set('entity', entity);
      if (action !== 'All') params.set('action', action);
      if (performedBy !== 'All') params.set('performedBy', performedBy);
      if (entityIdFilter.trim()) params.set('entityId', entityIdFilter.trim());
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('page', String(page));
      params.set('limit', '100');

      const res = await erpFetch(`/api/audit-log?${params}`);
      if (res.ok) {
        const d = await res.json();
        setLogs(d.data || []);
        setFilters(d.filters || { entities: [], users: [], actions: [] });
        setTotalPages(d.pagination?.totalPages || 1);
      }
    } finally { setLoading(false); }
  }, [entity, action, performedBy, entityIdFilter, dateFrom, dateTo, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const parseJson = (str?: string) => {
    try { return str ? JSON.parse(str) : null; } catch { return null; }
  };

  const diffView = (oldV?: string, newV?: string) => {
    const o = parseJson(oldV);
    const n = parseJson(newV);
    if (!o && !n) return <span className="text-muted-foreground text-xs">—</span>;
    return (
      <div className="flex gap-3 text-xs font-mono max-w-md">
        <div className="flex-1 min-w-0">
          {o ? <pre className="bg-red-50 dark:bg-red-950/30 p-2 rounded text-red-700 dark:text-red-400 overflow-x-auto text-[11px]">{JSON.stringify(o, null, 2)}</pre> : <span className="text-muted-foreground">—</span>}
        </div>
        <span className="text-muted-foreground self-center flex-shrink-0">→</span>
        <div className="flex-1 min-w-0">
          {n ? <pre className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded text-emerald-700 dark:text-emerald-400 overflow-x-auto text-[11px]">{JSON.stringify(n, null, 2)}</pre> : <span className="text-muted-foreground">—</span>}
        </div>
      </div>
    );
  };

  const clearFilters = () => {
    setEntity('All'); setAction('All'); setPerformedBy('All');
    setEntityIdFilter(''); setDateFrom(''); setDateTo(''); setPage(1);
  };

  const hasActiveFilters = entity !== 'All' || action !== 'All' || performedBy !== 'All' || entityIdFilter || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ScrollText className="h-6 w-6" style={{ color: '#C9A227' }} />
          <div>
            <h2 className="text-2xl font-bold">Audit Log</h2>
            <p className="text-xs text-muted-foreground">Complete traceability — who did what, when</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1">
              <X className="h-3 w-3" /> Clear filters
            </Button>
          )}
          <Button
            variant="outline" size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'border-primary' : ''}
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filters {hasActiveFilters ? <Badge variant="secondary" className="ml-1.5 text-[10px]">Active</Badge> : null}
          </Button>
          {user && <Badge variant="outline" className="text-xs">Viewing as: {user.role}</Badge>}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Entity</label>
                <Select value={entity} onValueChange={(v) => { setEntity(v); setPage(1); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All Entities" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Entities</SelectItem>
                    {filters.entities.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Action</label>
                <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All Actions" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Actions</SelectItem>
                    {filters.actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Performed By</label>
                <Select value={performedBy} onValueChange={(v) => { setPerformedBy(v); setPage(1); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All Users" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Users</SelectItem>
                    {filters.users.map((u) => u && <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Record ID</label>
                <Input placeholder="Entity ID..." value={entityIdFilter} onChange={(e) => { setEntityIdFilter(e.target.value); setPage(1); }} className="h-9" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date From</label>
                <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-9" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date To</label>
                <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-9" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3"><p className="text-2xl font-bold text-emerald-600">{logs.filter(l => l.action === 'CREATE').length}</p><p className="text-xs text-muted-foreground">Creates</p></Card>
        <Card className="p-3"><p className="text-2xl font-bold text-blue-600">{logs.filter(l => l.action === 'UPDATE').length}</p><p className="text-xs text-muted-foreground">Updates</p></Card>
        <Card className="p-3"><p className="text-2xl font-bold text-red-600">{logs.filter(l => l.action === 'DELETE').length}</p><p className="text-xs text-muted-foreground">Deletes</p></Card>
        <Card className="p-3"><p className="text-2xl font-bold">{new Set(logs.map(l => l.performedBy)).size}</p><p className="text-xs text-muted-foreground">Active Users</p></Card>
      </div>

      {/* Log Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {logs.length} log entries {hasActiveFilters ? '(filtered)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading audit logs...</p>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader sticky>
                  <TableRow>
                    <TableHead className="w-40">Time</TableHead>
                    <TableHead className="w-28">User</TableHead>
                    <TableHead className="w-20">Action</TableHead>
                    <TableHead className="w-32">Entity</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ backgroundColor: '#C9A227' }}>
                            {(log.performedBy || 's').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium">{log.performedBy || 'system'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' : log.action === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">{log.entity}</div>
                        {log.entityId && <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">{log.entityId.slice(0, 12)}...</div>}
                      </TableCell>
                      <TableCell className="min-w-[300px]">{diffView(log.oldValues, log.newValues)}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No audit logs found. {hasActiveFilters ? 'Try adjusting your filters.' : 'Logs will appear here when data is modified.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}