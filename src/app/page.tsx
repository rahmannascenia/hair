'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useErpStore } from '@/lib/store';
import { initApiClient } from '@/lib/api-client';
import LoginScreen from '@/components/erp/LoginScreen';
import Sidebar from '@/components/erp/Sidebar';
import GlobalSearchDialog from '@/components/erp/GlobalSearchDialog';
import NotificationPanel from '@/components/erp/NotificationPanel';

const Spin = () => <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

const DashboardSection = dynamic(() => import('@/components/erp/DashboardSection'), { loading: Spin });
const LotTrackerSection = dynamic(() => import('@/components/erp/LotTrackerSection'), { loading: Spin });
const WorkerProfileSection = dynamic(() => import('@/components/erp/WorkerProfileSection'), { loading: Spin });
const DailyReportsSection = dynamic(() => import('@/components/erp/DailyReportsSection'), { loading: Spin });
const LeaderboardSection = dynamic(() => import('@/components/erp/LeaderboardSection'), { loading: Spin });
const ProcurementSection = dynamic(() => import('@/components/erp/ProcurementSection'), { loading: Spin });
const SupplierSection = dynamic(() => import('@/components/erp/SupplierSection'), { loading: Spin });
const BuyerSection = dynamic(() => import('@/components/erp/BuyerSection'), { loading: Spin });
const LCManagementSection = dynamic(() => import('@/components/erp/LcManagementSection'), { loading: Spin });
const LotMasterSection = dynamic(() => import('@/components/erp/LotMasterSection'), { loading: Spin });
const InventorySection = dynamic(() => import('@/components/erp/InventorySection'), { loading: Spin });
const WashingLogSection = dynamic(() => import('@/components/erp/WashingLogSection'), { loading: Spin });
const Phase1Section = dynamic(() => import('@/components/erp/Phase1Section'), { loading: Spin });
const OrganizationSection = dynamic(() => import('@/components/erp/OrganizationSection'), { loading: Spin });
const FactorySection = dynamic(() => import('@/components/erp/FactorySection'), { loading: Spin });
const QcSection = dynamic(() => import('@/components/erp/QcSection'), { loading: Spin });
const PayrollSection = dynamic(() => import('@/components/erp/PayrollSection'), { loading: Spin });
const Phase2Section = dynamic(() => import('@/components/erp/Phase2Section'), { loading: Spin });
const SizePricingSection = dynamic(() => import('@/components/erp/SizePricingSection'), { loading: Spin });
const SalesSection = dynamic(() => import('@/components/erp/SalesSection'), { loading: Spin });
const CostingSection = dynamic(() => import('@/components/erp/CostingSection'), { loading: Spin });
const KpiSection = dynamic(() => import('@/components/erp/KpiSection'), { loading: Spin });
const RiskSection = dynamic(() => import('@/components/erp/RiskSection'), { loading: Spin });
const ConsumablesSection = dynamic(() => import('@/components/erp/ConsumablesSection'), { loading: Spin });
const HierarchySection = dynamic(() => import('@/components/erp/HierarchySection'), { loading: Spin });
const RejectionInvestigationSection = dynamic(() => import('@/components/erp/RejectionInvestigationSection'), { loading: Spin });
const AuditLogSection = dynamic(() => import('@/components/erp/AuditLogSection'), { loading: Spin });
const GradeDisputeSection = dynamic(() => import('@/components/erp/GradeDisputeSection'), { loading: Spin });
const ApprovalWorkflowSection = dynamic(() => import('@/components/erp/ApprovalWorkflowSection'), { loading: Spin });
const SettingsSection = dynamic(() => import('@/components/erp/SettingsSection'), { loading: Spin });

const sections: Record<string, React.ComponentType> = {
  dashboard: DashboardSection, 'lot-tracker': LotTrackerSection, 'worker-profile': WorkerProfileSection,
  'daily-reports': DailyReportsSection, leaderboard: LeaderboardSection, procurement: ProcurementSection,
  suppliers: SupplierSection, buyers: BuyerSection, 'lc-management': LCManagementSection,
  'lot-master': LotMasterSection, inventory: InventorySection, 'washing-log': WashingLogSection,
  phase1: Phase1Section, organization: OrganizationSection, factory: FactorySection,
  qc: QcSection, payroll: PayrollSection, phase2: Phase2Section, 'size-pricing': SizePricingSection,
  sales: SalesSection, costing: CostingSection, kpi: KpiSection, risks: RiskSection,
  consumables: ConsumablesSection, hierarchy: HierarchySection, 'rejection-investigation': RejectionInvestigationSection,
  'audit-log': AuditLogSection, 'grade-dispute': GradeDisputeSection, 'approval-workflow': ApprovalWorkflowSection,
  settings: SettingsSection,
};

export default function Home() {
  const { user, activeSection } = useErpStore();

  // Initialize API client to inject auth headers
  useEffect(() => {
    initApiClient(() => useErpStore.getState().user);
  }, []);

  if (!user) return <LoginScreen />;
  const ActiveComponent = sections[activeSection] || DashboardSection;
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 md:ml-64 transition-all duration-300">
        <main className="p-4 md:p-6 max-w-[1600px] mx-auto">
          <ActiveComponent />
        </main>
        <footer className="mt-auto border-t bg-muted/30 px-6 py-4 md:ml-64 transition-all duration-300">
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