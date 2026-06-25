'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Users, UserCog, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HeadLeader { id: string; name: string; phone: string | null; region: string; isActive: boolean; lineLeaders?: LineLeader[]; _count?: { lineLeaders: number }; }
interface LineLeader { id: string; name: string; phone: string | null; bKash: string | null; headLeaderId: string; headLeader?: HeadLeader; isActive: boolean; factories?: Factory[]; _count?: { factories: number }; }
interface Factory { id: string; factoryId: string; name: string; location: string; _count?: { workers: number }; }

export default function OrganizationSection() {
  // State for each entity
  const [headLeaders, setHeadLeaders] = useState<HeadLeader[]>([]);
  const [lineLeaders, setLineLeaders] = useState<LineLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEntity, setDialogEntity] = useState<'head-leader' | 'line-leader'>('head-leader');
  const [editing, setEditing] = useState<any>(null);
  const [hlForm, setHlForm] = useState({ name: '', phone: '', region: '', isActive: true });
  const [llForm, setLlForm] = useState({ name: '', phone: '', bKash: '', headLeaderId: '', isActive: true });

  const fetchHeadLeaders = async () => {
    try {
      const url = search ? `/api/head-leaders?search=${encodeURIComponent(search)}` : '/api/head-leaders';
      const res = await erpFetch(url);
      const json = await res.json();
      setHeadLeaders(json.data || json || []);
    } catch {}
  };

  const fetchLineLeaders = async () => {
    try {
      const url = search ? `/api/line-leaders?search=${encodeURIComponent(search)}` : '/api/line-leaders';
      const res = await erpFetch(url);
      const json = await res.json();
      setLineLeaders(json.data || json || []);
    } catch {}
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchHeadLeaders(), fetchLineLeaders()]);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchAll(); }, [search]);

  // Head Leader CRUD
  const openCreateHL = () => {
    setEditing(null); setDialogEntity('head-leader');
    setHlForm({ name: '', phone: '', region: '', isActive: true });
    setDialogOpen(true);
  };

  const openEditHL = (item: HeadLeader) => {
    setEditing(item); setDialogEntity('head-leader');
    setHlForm({ name: item.name, phone: item.phone || '', region: item.region, isActive: item.isActive });
    setDialogOpen(true);
  };

  const handleSubmitHL = async () => {
    if (!hlForm.name || !hlForm.region) { toast.error('Name and region required'); return; }
    const url = editing ? `/api/head-leaders/${editing.id}` : '/api/head-leaders';
    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await erpFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(hlForm) });
      if (res.ok) { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); fetchAll(); }
      else { const err = await res.json(); toast.error(err.error || 'Failed'); }
    } catch { toast.error('Failed'); }
  };

  const deleteHL = async (id: string) => {
    if (!confirm('Delete this Head Leader?')) return;
    try {
      const res = await erpFetch(`/api/head-leaders/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Deleted'); fetchAll(); }
      else { const err = await res.json(); toast.error(err.error || 'Failed'); }
    } catch { toast.error('Failed'); }
  };

  // Line Leader CRUD
  const openCreateLL = () => {
    setEditing(null); setDialogEntity('line-leader');
    setLlForm({ name: '', phone: '', bKash: '', headLeaderId: '', isActive: true });
    setDialogOpen(true);
  };

  const openEditLL = (item: LineLeader) => {
    setEditing(item); setDialogEntity('line-leader');
    setLlForm({ name: item.name, phone: item.phone || '', bKash: item.bKash || '', headLeaderId: item.headLeaderId, isActive: item.isActive });
    setDialogOpen(true);
  };

  const handleSubmitLL = async () => {
    if (!llForm.name || !llForm.headLeaderId) { toast.error('Name and Head Leader required'); return; }
    const url = editing ? `/api/line-leaders/${editing.id}` : '/api/line-leaders';
    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await erpFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(llForm) });
      if (res.ok) { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); fetchAll(); }
      else { const err = await res.json(); toast.error(err.error || 'Failed'); }
    } catch { toast.error('Failed'); }
  };

  const deleteLL = async (id: string) => {
    if (!confirm('Delete this Line Leader?')) return;
    try {
      const res = await erpFetch(`/api/line-leaders/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Deleted'); fetchAll(); }
      else { const err = await res.json(); toast.error(err.error || 'Failed'); }
    } catch { toast.error('Failed'); }
  };

  const handleSubmit = () => {
    if (dialogEntity === 'head-leader') handleSubmitHL();
    else handleSubmitLL();
  };

  const totalFactories = lineLeaders.reduce((s, ll) => s + (ll._count?.factories || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3864]">Organization</h2>
        <p className="text-sm text-muted-foreground">Manage Head Leaders, Line Leaders, and organizational hierarchy</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Head Leaders', value: headLeaders.length, icon: Users },
          { label: 'Line Leaders', value: lineLeaders.length, icon: UserCog },
          { label: 'Total Factories', value: totalFactories, icon: Building2 },
          { label: 'Avg LL per HL', value: headLeaders.length > 0 ? (lineLeaders.length / headLeaders.length).toFixed(1) : '0', icon: Users },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1F3864]/10">
                <c.icon className="h-5 w-5 text-[#1F3864]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="head-leaders">
        <TabsList>
          <TabsTrigger value="head-leaders">Head Leaders ({headLeaders.length})</TabsTrigger>
          <TabsTrigger value="line-leaders">Line Leaders ({lineLeaders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="head-leaders">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Group Heads (Head Leaders)</CardTitle>
              <Button onClick={openCreateHL} className="bg-[#1F3864] hover:bg-[#1F3864]/90" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Head Leader
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#1F3864] text-white hover:bg-[#1F3864]">
                        <TableHead className="text-white">Name</TableHead>
                        <TableHead className="text-white">Region</TableHead>
                        <TableHead className="text-white">Phone</TableHead>
                        <TableHead className="text-white text-center">Line Leaders</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {headLeaders.map((hl) => (
                        <TableRow key={hl.id} className={!hl.isActive ? 'opacity-50' : ''}>
                          <TableCell className="font-medium">{hl.name}</TableCell>
                          <TableCell><Badge variant="outline">{hl.region}</Badge></TableCell>
                          <TableCell className="font-mono text-sm">{hl.phone || '—'}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{hl._count?.lineLeaders || hl.lineLeaders?.length || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={hl.isActive ? 'default' : 'destructive'}>{hl.isActive ? 'Active' : 'Inactive'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditHL(hl)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => deleteHL(hl.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {headLeaders.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No head leaders found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="line-leaders">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Line Leaders (Field Supervisors)</CardTitle>
              <Button onClick={openCreateLL} className="bg-[#1F3864] hover:bg-[#1F3864]/90" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Line Leader
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#1F3864] text-white hover:bg-[#1F3864]">
                        <TableHead className="text-white">Name</TableHead>
                        <TableHead className="text-white">Head Leader</TableHead>
                        <TableHead className="text-white">Phone</TableHead>
                        <TableHead className="text-white">bKash</TableHead>
                        <TableHead className="text-white text-center">Factories</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineLeaders.map((ll) => (
                        <TableRow key={ll.id} className={!ll.isActive ? 'opacity-50' : ''}>
                          <TableCell className="font-medium">{ll.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ll.headLeader?.name || 'Unassigned'}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{ll.phone || '—'}</TableCell>
                          <TableCell className="font-mono text-sm">{ll.bKash || '—'}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{ll._count?.factories || ll.factories?.length || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ll.isActive ? 'default' : 'destructive'}>{ll.isActive ? 'Active' : 'Inactive'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditLL(ll)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => deleteLL(ll.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {lineLeaders.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No line leaders found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1F3864]">
              {dialogEntity === 'head-leader'
                ? (editing ? 'Edit Head Leader' : 'New Head Leader')
                : (editing ? 'Edit Line Leader' : 'New Line Leader')}
            </DialogTitle>
          </DialogHeader>
          {dialogEntity === 'head-leader' ? (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input value={hlForm.name} onChange={(e) => setHlForm({ ...hlForm, name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="grid gap-2">
                <Label>Region *</Label>
                <Input value={hlForm.region} onChange={(e) => setHlForm({ ...hlForm, region: e.target.value })} placeholder="e.g. Dinajpur, Rangpur" />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input value={hlForm.phone} onChange={(e) => setHlForm({ ...hlForm, phone: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="hlActive" checked={hlForm.isActive}
                  onChange={(e) => setHlForm({ ...hlForm, isActive: e.target.checked })} className="rounded border-gray-300" />
                <Label htmlFor="hlActive" className="text-sm">Active</Label>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input value={llForm.name} onChange={(e) => setLlForm({ ...llForm, name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="grid gap-2">
                <Label>Head Leader *</Label>
                <Select value={llForm.headLeaderId} onValueChange={(v) => setLlForm({ ...llForm, headLeaderId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Head Leader" /></SelectTrigger>
                  <SelectContent>
                    {headLeaders.filter((hl) => hl.isActive).map((hl) => (
                      <SelectItem key={hl.id} value={hl.id}>{hl.name} — {hl.region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input value={llForm.phone} onChange={(e) => setLlForm({ ...llForm, phone: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>bKash</Label>
                  <Input value={llForm.bKash} onChange={(e) => setLlForm({ ...llForm, bKash: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="llActive" checked={llForm.isActive}
                  onChange={(e) => setLlForm({ ...llForm, isActive: e.target.checked })} className="rounded border-gray-300" />
                <Label htmlFor="llActive" className="text-sm">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-[#1F3864] hover:bg-[#1F3864]/90">
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}