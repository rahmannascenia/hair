'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useErpStore } from '@/lib/store';
import { Search, Package, Users, Factory, Truck, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  section: string;
  icon: 'lot' | 'worker' | 'factory' | 'supplier';
}

export default function GlobalSearchDialog() {
  const { searchOpen, setSearchOpen, setActiveSection } = useErpStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];
      const lower = q.toLowerCase();

      // Search lots
      const lotsRes = await fetch('/api/lots?limit=20');
      if (lotsRes.ok) {
        const lotsData = await lotsRes.json();
        for (const lot of (lotsData.data || lotsData || [])) {
          if (lot.lotNo?.toLowerCase().includes(lower) || lot.colour?.toLowerCase().includes(lower)) {
            searchResults.push({ id: lot.id, label: lot.lotNo, sublabel: `Lot — ${lot.colour || ''} ${lot.rawWeightKg}kg`, section: 'lot-master', icon: 'lot' });
          }
        }
      }

      // Search workers
      const workersRes = await fetch('/api/workers?limit=20');
      if (workersRes.ok) {
        const workersData = await workersRes.json();
        for (const w of (workersData.data || workersData || [])) {
          if (w.name?.toLowerCase().includes(lower) || w.workerId?.toLowerCase().includes(lower)) {
            searchResults.push({ id: w.id, label: w.name, sublabel: `Worker — ${w.workerId || ''}`, section: 'factory', icon: 'worker' });
          }
        }
      }

      // Search factories
      const factoriesRes = await fetch('/api/factories?limit=20');
      if (factoriesRes.ok) {
        const factoriesData = await factoriesRes.json();
        for (const f of (factoriesData.data || factoriesData || [])) {
          if (f.name?.toLowerCase().includes(lower) || f.factoryId?.toLowerCase().includes(lower)) {
            searchResults.push({ id: f.id, label: f.name, sublabel: `Factory — ${f.location || ''}`, section: 'factory', icon: 'factory' });
          }
        }
      }

      // Search suppliers
      const suppliersRes = await fetch('/api/suppliers?limit=20');
      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        for (const s of (suppliersData.data || suppliersData || [])) {
          if (s.name?.toLowerCase().includes(lower) || s.country?.toLowerCase().includes(lower)) {
            searchResults.push({ id: s.id, label: s.name, sublabel: `Supplier — ${s.country || ''}`, section: 'suppliers', icon: 'supplier' });
          }
        }
      }

      setResults(searchResults.slice(0, 20));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, setSearchOpen]);

  const iconMap = {
    lot: <Package className="h-4 w-4 text-muted-foreground" />,
    worker: <Users className="h-4 w-4 text-muted-foreground" />,
    factory: <Factory className="h-4 w-4 text-muted-foreground" />,
    supplier: <Truck className="h-4 w-4 text-muted-foreground" />,
  };

  const handleSelect = (r: SearchResult) => {
    setActiveSection(r.section);
    setSearchOpen(false);
    setQuery('');
  };

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Search className="h-4 w-4" />
            Global Search
            <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded border">Ctrl+K</kbd>
          </DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-2">
          <Input
            placeholder="Search lots, workers, factories, suppliers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <div className="max-h-96 overflow-y-auto border-t">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No results found.</p>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={r.id + r.section}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleSelect(r)}
              >
                {iconMap[r.icon]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.sublabel}</p>
                </div>
              </button>
            ))}
          {!loading && !query && (
            <p className="text-sm text-muted-foreground text-center py-8">Type to search across the ERP system.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}