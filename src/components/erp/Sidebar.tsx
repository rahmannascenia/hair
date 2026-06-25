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
  Truck,
  Users,
  Search,
  Bell,
  LogOut,
  ClipboardCheck,
  ScrollText,
  MessageSquare,
  AlertOctagon,
  UserCircle,
  BarChart3,
  Network,
  CreditCard,
  PackageCheck,
} from 'lucide-react';
import { useErpStore } from '@/lib/store';
import { getSectionPermissions, type SectionKey } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from 'sonner';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'procurement', label: 'Procurement', icon: Package },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'lot-master', label: 'Lot Master', icon: FileText },
  { id: 'lot-tracker', label: 'Lot Tracker', icon: PackageCheck },
  { id: 'inventory', label: 'Inventory', icon: Warehouse },
  { id: 'washing-log', label: 'Washing Log', icon: Droplets },
  { id: 'phase1', label: 'Phase 1 Distribution', icon: GitBranch },
  { id: 'organization', label: 'Organization', icon: Users },
  { id: 'factory', label: 'Factory Records', icon: Factory },
  { id: 'qc', label: 'QC & Grading', icon: ShieldCheck },
  { id: 'payroll', label: 'Payroll', icon: Banknote },
  { id: 'phase2', label: 'Phase 2 Production', icon: Cog },
  { id: 'size-pricing', label: 'Size Pricing', icon: Ruler },
  { id: 'sales', label: 'Sales & Export', icon: DollarSign },
  { id: 'costing', label: 'Costing Analysis', icon: Calculator },
  { id: 'kpi', label: 'KPI Tracker', icon: Target },
  { id: 'risks', label: 'Risk Register', icon: AlertTriangle },
  { id: 'lc-management', label: 'LC Management', icon: CreditCard },
  { id: 'consumables', label: 'Consumables', icon: Package },
  // Management sections
  { id: 'approval-workflow', label: 'Approval Workflow', icon: ClipboardCheck, category: 'management' },
  { id: 'audit-log', label: 'Audit Log', icon: ScrollText, category: 'management' },
  { id: 'grade-dispute', label: 'Grade Disputes', icon: MessageSquare, category: 'management' },
  { id: 'rejection-investigation', label: 'Rejection Investigation', icon: AlertOctagon, category: 'management' },
  { id: 'worker-profile', label: 'Worker Profiles', icon: UserCircle, category: 'insights' },
  { id: 'daily-reports', label: 'Daily Reports', icon: BarChart3, category: 'insights' },
  { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3, category: 'insights' },
  { id: 'hierarchy', label: 'Hierarchy View', icon: Network, category: 'insights' },
  { id: 'settings', label: 'Settings', icon: Settings, category: 'system' },
];

export default function Sidebar() {
  const { activeSection, setActiveSection, user, setUser, setSearchOpen, setNotificationsOpen, visibleSections } = useErpStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: string) => {
    setActiveSection(id);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveSection('dashboard');
    toast.info('Logged out successfully.');
  };

  // Filter nav items based on role permissions
  const filteredNavItems = navItems.filter(item =>
    visibleSections.includes(item.id as SectionKey)
  );

  // Separate main items and management items
  const mainItems = filteredNavItems.filter(item => !item.category);
  const managementItems = filteredNavItems.filter(item => item.category === 'management');
  const insightItems = filteredNavItems.filter(item => item.category === 'insights');
  const systemItems = filteredNavItems.filter(item => item.category === 'system');

  const renderNavGroup = (items: typeof navItems, label?: string) => (
    <div className="space-y-1">
      {label && !collapsed && (
        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300/70">{label}</p>
      )}
      {items.map((item) => {
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
    </div>
  );

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
            <div className="overflow-hidden flex-1 min-w-0">
              <h1 className="text-white font-bold text-sm leading-tight truncate">Barendra International</h1>
              <p className="text-blue-200 text-xs truncate">ERP System</p>
            </div>
          )}
          {!collapsed && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-blue-300 hover:text-white hover:bg-blue-700/50"
                onClick={() => setSearchOpen(true)}
                title="Search (Ctrl+K)"
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-blue-300 hover:text-white hover:bg-blue-700/50"
                onClick={() => setNotificationsOpen(true)}
                title="Notifications"
              >
                <Bell className="h-3.5 w-3.5" />
              </Button>
              <ThemeToggle />
            </div>
          )}
        </div>

        <Separator className="bg-blue-700/50" />

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-2">
            {renderNavGroup(mainItems)}
            {managementItems.length > 0 && (
              <>
                <Separator className="bg-blue-700/30 my-1" />
                {renderNavGroup(managementItems, 'Management')}
              </>
            )}
            {insightItems.length > 0 && (
              <>
                <Separator className="bg-blue-700/30 my-1" />
                {renderNavGroup(insightItems, 'Insights')}
              </>
            )}
            {systemItems.length > 0 && (
              <>
                <Separator className="bg-blue-700/30 my-1" />
                {renderNavGroup(systemItems, 'System')}
              </>
            )}
          </nav>
        </ScrollArea>

        <Separator className="bg-blue-700/50" />

        {/* Footer */}
        <div className="p-3 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#C9A227' }}>
                {user?.displayName?.charAt(0) || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-blue-100 text-xs font-medium truncate">{user?.displayName || 'User'}</p>
                <p className="text-blue-300 text-[10px] truncate">{user?.role || ''}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1">
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-300 hover:text-red-300 hover:bg-blue-700/50 h-8 w-8"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-blue-300 hover:text-white hover:bg-blue-700/50 hidden md:flex h-8 w-8"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}