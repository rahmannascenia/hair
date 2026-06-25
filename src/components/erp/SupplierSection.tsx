'use client';

import { erpFetch } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Globe, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Supplier {
  id: string; name: string; country: string; contact: string | null; phone: string | null;
  isLocal: boolean; isActive: boolean; createdAt: string;
  _count?: { procurements: number };
}

export default function SupplierSection() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [form, setForm] = useState({
    name: '', country: '', contact: '', phone: '', isLocal: false, isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/suppliers?limit=200';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (filterType === 'import') url += '&isLocal=false';
      if (filterType === 'local') url += '&isLocal=true';
      const res = await erpFetch(url);
      const json = await res.json();
      setData(json.data || []);
    } catch { toast.error('Failed to load suppliers'); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [search, filterType]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', country: '', contact: '', phone: '', isLocal: false, isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (item: Supplier) => {
    setEditing(item);
    setForm({ name: item.name, country: item.country, contact: item.contact || '', phone: item.phone || '', isLocal: item.isLocal, isActive: item.isActive });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.country) { toast.error('Name and country are required'); return; }
    const url = editing ? `/api/suppliers/${editing.id}` : '/api/suppliers';
    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await erpFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); fetchData(); }
      else { const err = await res.json(); toast.error(err.error || 'Failed'); }
    } catch { toast.error('Request failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier? This will fail if they have procurements.')) return;
    try {
      const res = await erpFetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Deleted'); fetchData(); }
      else { const err = await res.json(); toast.error(err.error || 'Failed'); }
    } catch { toast.error('Request failed'); }
  };

  const importSuppliers = data.filter((s) => !s.isLocal);
  const localSuppliers = data.filter((s) => s.isLocal);
  const totalProcCount = data.reduce((sum, s) => sum + (s._count?.procurements || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1F3864]">Supplier Management</h2>
          <p className="text-sm text-muted-foreground">Manage raw hair suppliers — import & local</p>
        </div>
        <Button onClick={openCreate} className="bg-[#1F3864] hover:bg-[#1F3864]/90">
          <Plus className="h-4 w-4 mr-2" /> Add Supplier
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Suppliers', value: data.length, icon: Globe },
          { label: 'Import Suppliers', value: importSuppliers.length, icon: Globe },
          { label: 'Local Suppliers', value: localSuppliers.length, icon: MapPin },
          { label: 'Total Procurements', value: totalProcCount, icon: Phone },
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or country..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="import">Import Only</SelectItem>
            <SelectItem value="local">Local Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Suppliers
            <Badge variant="secondary">{data.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1F3864] text-white hover:bg-[#1F3864]">
                    <TableHead className="text-white">Name</TableHead>
                    <TableHead className="text-white">Country</TableHead>
                    <TableHead className="text-white">Type</TableHead>
                    <TableHead className="text-white">Contact</TableHead>
                    <TableHead className="text-white">Phone</TableHead>
                    <TableHead className="text-white text-center">Procurements</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((s) => (
                    <TableRow key={s.id} className={!s.isActive ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.country}</TableCell>
                      <TableCell>
                        <Badge variant={s.isLocal ? 'outline' : 'default'} className={s.isLocal ? '' : 'bg-[#C9A227] text-white'}>
                          {s.isLocal ? 'Local' : 'Import'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{s.contact || '—'}</TableCell>
                      <TableCell className="font-mono text-sm">{s.phone || '—'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{s._count?.procurements || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.isActive ? 'default' : 'destructive'}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => handleDelete(s.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No suppliers found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1F3864]">{editing ? 'Edit Supplier' : 'New Supplier'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Supplier Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Company name" />
            </div>
            <div className="grid gap-2">
              <Label>Country *</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. India, Uzbekistan" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Contact Person</Label>
                <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isLocal" checked={form.isLocal}
                  onChange={(e) => setForm({ ...form, isLocal: e.target.checked })}
                  className="rounded border-gray-300" />
                <Label htmlFor="isLocal" className="text-sm">Local Supplier</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300" />
                <Label htmlFor="isActive" className="text-sm">Active</Label>
              </div>
            </div>
          </div>
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