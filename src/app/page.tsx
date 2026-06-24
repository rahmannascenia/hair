'use client';

import dynamic from 'next/dynamic';
import { useErpStore } from '@/lib/store';
import Sidebar from '@/components/erp/Sidebar';
import LoginScreen from '@/components/erp/LoginScreen';
import GlobalSearchDialog from '@/components/erp/GlobalSearchDialog';
import NotificationPanel from '@/components/erp/NotificationPanel';
import { Loader2 } from 'lucide-react';

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

const sections: Record<string, React.ComponentType> = {
  'dashboard': dynamic(() => import('@/components/erp/DashboardSection'), { loading: SectionLoader, ssr: false }),
  'lot-tracker': dynamic(() => import('@/components/erp/LotTrackerSection'), { loading: SectionLoader, ssr: false }),
  'worker-profile': dynamic(() => import('@/components/erp/WorkerProfileSection'), { loading: SectionLoader, ssr: false }),
  'daily-reports': dynamic(() => import('@/components/erp/DailyReportsSection'), { loading: SectionLoader, ssr: false }),
  'leaderboard': dynamic(() => import('@/components/erp/LeaderboardSection'), { loading: SectionLoader, ssr: false }),
  'procurement': dynamic(() => import('@/components/erp/ProcurementSection'), { loading: SectionLoader, ssr: false }),
  'suppliers': dynamic(() => import('@/components/erp/SupplierSection'), { loading: SectionLoader, ssr: false }),
  'buyers': dynamic(() => import('@/components/erp/BuyerSection'), { loading: SectionLoader, ssr: false }),
  'lc-management': dynamic(() => import('@/components/erp/LcManagementSection'), { loading: SectionLoader, ssr: false }),
  'lot-master': dynamic(() => import('@/components/erp/LotMasterSection'), { loading: SectionLoader, ssr: false }),
  'inventory': dynamic(() => import('@/components/erp/InventorySection'), { loading: SectionLoader, ssr: false }),
  'washing-log': dynamic(() => import('@/components/erp/WashingLogSection'), { loading: SectionLoader, ssr: false }),
  'phase1': dynamic(() => import('@/components/erp/Phase1Section'), { loading: SectionLoader, ssr: false }),
  'organization': dynamic(() => import('@/components/erp/OrganizationSection'), { loading: SectionLoader, ssr: false }),
  'factory': dynamic(() => import('@/components/erp/FactorySection'), { loading: SectionLoader, ssr: false }),
  'qc': dynamic(() => import('@/components/erp/QcSection'), { loading: SectionLoader, ssr: false }),
  'payroll': dynamic(() => import('@/components/erp/PayrollSection'), { loading: SectionLoader, ssr: false }),
  'phase2': dynamic(() => import('@/components/erp/Phase2Section'), { loading: SectionLoader, ssr: false }),
  'size-pricing': dynamic(() => import('@/components/erp/SizePricingSection'), { loading: SectionLoader, ssr: false }),
  'sales': dynamic(() => import('@/components/erp/SalesSection'), { loading: SectionLoader, ssr: false }),
  'costing': dynamic(() => import('@/components/erp/CostingSection'), { loading: SectionLoader, ssr: false }),
  'kpi': dynamic(() => import('@/components/erp/KpiSection'), { loading: SectionLoader, ssr: false }),
  'risks': dynamic(() => import('@/components/erp/RiskSection'), { loading: SectionLoader, ssr: false }),
  'consumables': dynamic(() => import('@/components/erp/ConsumablesSection'), { loading: SectionLoader, ssr: false }),
  'hierarchy': dynamic(() => import('@/components/erp/HierarchySection'), { loading: SectionLoader, ssr: false }),
  'rejection-investigation': dynamic(() => import('@/components/erp/RejectionInvestigationSection'), { loading: SectionLoader, ssr: false }),
  'audit-log': dynamic(() => import('@/components/erp/AuditLogSection'), { loading: SectionLoader, ssr: false }),
  'grade-dispute': dynamic(() => import('@/components/erp/GradeDisputeSection'), { loading: SectionLoader, ssr: false }),
  'approval-workflow': dynamic(() => import('@/components/erp/ApprovalWorkflowSection'), { loading: SectionLoader, ssr: false }),
  'settings': dynamic(() => import('@/components/erp/SettingsSection'), { loading: SectionLoader, ssr: false }),
};

export default function Home() {
  const { user, activeSection } = useErpStore();

  if (!user) {
    return <LoginScreen />;
  }

  const ActiveComponent = sections[activeSection] || sections['dashboard'];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 md:ml-64 transition-all duration-300 flex flex-col">
        <main className="flex-1 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
          <div className="mb-4 md:ml-0 ml-10" />
          <ActiveComponent />
        </main>
        <footer className="mt-auto border-t bg-muted/30 px-6 py-4">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Barendra International. Human Hair Wig Manufacturing, Bangladesh.</p>
            <p>ERP System v1.0 — All rights reserved.</p>
          </div>
        </footer>
      </div>
      <GlobalSearchDialog />
      <NotificationPanel />
    </div>
  );
}