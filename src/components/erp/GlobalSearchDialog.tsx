'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useErpStore } from '@/lib/store';
import { Search, Loader2, Package, User, Factory, Truck, Globe, DollarSign, FileText, Users, CreditCard, ShoppingBag } from 'lucide-react';

interface SearchResult {
  type: string;
  id: string;
  label: string;
  sub: string;
  section: string;
}

const typeColors: Record<string, string> = {
  Worker: 'bg-emerald-100 text-emerald-800',
  Lot: 'bg-amber-100 text-amber-800',
  Factory: 'bg-violet-100 text-violet-800',
  Supplier: 'bg-cyan-100 text-cyan-800',
  Buyer: 'bg-rose-100 text-rose-800',
  Sale: 'bg-orange-100 text-orange-800',
  LC: 'bg-blue-100 text-blue-800',
  Procurement: 'bg-teal-100 text-teal-800',
  'Head Leader': 'bg-indigo-100 text-indigo-800',
  'Line Leader': 'bg-pink-100 text-pink-800',
};

const typeIcons: Record<string, React.ReactNode> = {
  Worker: <User className="h-4 w-4" />,
  Lot: <Package className="h-4 w-4" />,
  Factory: <Factory className="h-4 w-4" />,
  Supplier: <Truck className="h-4 w-4" />,
  Buyer: <Globe className="h-4 w-4" />,
  Sale: <DollarSign className="h-4 w-4" />,
  LC: <CreditCard className="h-4 w-4" />,
  Procurement: <ShoppingBag className="h-4 w-4" />,
  'Head Leader': <Users className="h-4 w-4" />,
  'Line Leader': <Users className="h-4 w-4" />,
};

export default function GlobalSearchDialog() {
  const { searchOpen, setSearchOpen, setActiveSection } = useErpStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

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

  const handleSelect = (r: SearchResult) => {
    setActiveSection(r.section);
    setSearchOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) { e.preventDefault(); handleSelect(results[activeIndex]); }
  };

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] = acc[r.type] || []).push(r);
    return acc;
  }, {});

  let flatIndex = 0;

  return (
    <Dialog open={searchOpen} onOpenChange={(open) => { setSearchOpen(open); if (!open) setQuery(''); }}>
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
            ref={inputRef}
            placeholder="Search workers, lots, factories, suppliers, buyers, LCs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <div ref={listRef} className="max-h-96 overflow-y-auto border-t">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No results found.</p>
          )}
          {!loading && results.length > 0 && Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div className="px-4 pt-3 pb-1">
                <Badge variant="outline" className="text-xs">{type} ({items.length})</Badge>
              </div>
              {items.map((r) => {
                const idx = flatIndex++;
                return (
                  <button
                    key={r.id + r.type}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${idx === activeIndex ? 'bg-muted' : 'hover:bg-muted/50'}`}
                    onClick={() => handleSelect(r)}
                  >
                    {typeIcons[r.type] || <FileText className="h-4 w-4" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{r.label}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 ${typeColors[r.type] || 'bg-gray-100 text-gray-800'}`}>{type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{r.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
          {!loading && !query && (
            <p className="text-sm text-muted-foreground text-center py-8">Type to search across all entities.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}