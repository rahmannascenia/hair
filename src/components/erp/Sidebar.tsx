'use client';

import {
  LayoutDashboard,
  Package,
  FileText,
  Warehouse,
  Droplets,
  GitBranch,
  Factory,
  ShieldCheck,
  Banknote,
  Cog,
  Ruler,
  DollarSign,
  Calculator,
  Target,
  AlertTriangle,
  Settings,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { useErpStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'procurement', label: 'Procurement', icon: Package },
  { id: 'lot-master', label: 'Lot Master', icon: FileText },
  { id: 'inventory', label: 'Inventory', icon: Warehouse },
  { id: 'washing-log', label: 'Washing Log', icon: Droplets },
  { id: 'phase1', label: 'Phase 1 Distribution', icon: GitBranch },
  { id: 'factory', label: 'Factory Records', icon: Factory },
  { id: 'qc', label: 'QC & Grading', icon: ShieldCheck },
  { id: 'payroll', label: 'Payroll', icon: Banknote },
  { id: 'phase2', label: 'Phase 2 Production', icon: Cog },
  { id: 'size-pricing', label: 'Size Pricing', icon: Ruler },
  { id: 'sales', label: 'Sales & Export', icon: DollarSign },
  { id: 'costing', label: 'Costing Analysis', icon: Calculator },
  { id: 'kpi', label: 'KPI Tracker', icon: Target },
  { id: 'risks', label: 'Risk Register', icon: AlertTriangle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { activeSection, setActiveSection } = useErpStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: string) => {
    setActiveSection(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden bg-white shadow-md border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-40 transition-all duration-300 flex flex-col',
          'md:translate-x-0',
          collapsed ? 'md:w-16' : 'md:w-64',
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'
        )}
        style={{ backgroundColor: '#1F3864' }}
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-3 min-h-[64px]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C9A227' }}>
            <span className="text-white font-bold text-sm">BI</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-white font-bold text-sm leading-tight truncate">Barendra International</h1>
              <p className="text-blue-200 text-xs truncate">ERP System</p>
            </div>
          )}
        </div>

        <Separator className="bg-blue-700/50" />

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer',
                    isActive
                      ? 'bg-white text-[#1F3864] font-semibold shadow-sm'
                      : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-[#C9A227]' : '')} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator className="bg-blue-700/50" />

        {/* Footer */}
        <div className="p-3 flex items-center justify-between">
          {!collapsed && <span className="text-blue-300 text-xs">v1.0</span>}
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-300 hover:text-white hover:bg-blue-700/50 hidden md:flex h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        </div>
      </aside>
    </>
  );
}