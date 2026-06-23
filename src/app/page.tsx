'use client';

import { useErpStore } from '@/lib/store';
import Sidebar from '@/components/erp/Sidebar';
import DashboardSection from '@/components/erp/DashboardSection';
import ProcurementSection from '@/components/erp/ProcurementSection';
import LotMasterSection from '@/components/erp/LotMasterSection';
import InventorySection from '@/components/erp/InventorySection';
import WashingLogSection from '@/components/erp/WashingLogSection';
import Phase1Section from '@/components/erp/Phase1Section';
import FactorySection from '@/components/erp/FactorySection';
import QcSection from '@/components/erp/QcSection';
import PayrollSection from '@/components/erp/PayrollSection';
import Phase2Section from '@/components/erp/Phase2Section';
import SizePricingSection from '@/components/erp/SizePricingSection';
import SalesSection from '@/components/erp/SalesSection';
import CostingSection from '@/components/erp/CostingSection';
import KpiSection from '@/components/erp/KpiSection';
import RiskSection from '@/components/erp/RiskSection';
import SettingsSection from '@/components/erp/SettingsSection';

const sections: Record<string, React.ComponentType> = {
  dashboard: DashboardSection,
  procurement: ProcurementSection,
  'lot-master': LotMasterSection,
  inventory: InventorySection,
  'washing-log': WashingLogSection,
  phase1: Phase1Section,
  factory: FactorySection,
  qc: QcSection,
  payroll: PayrollSection,
  phase2: Phase2Section,
  'size-pricing': SizePricingSection,
  sales: SalesSection,
  costing: CostingSection,
  kpi: KpiSection,
  risks: RiskSection,
  settings: SettingsSection,
};

export default function Home() {
  const { activeSection } = useErpStore();
  const ActiveComponent = sections[activeSection] || DashboardSection;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Sidebar />
      <div className="flex-1 md:ml-64 transition-all duration-300">
        <main className="p-4 md:p-6 max-w-[1600px] mx-auto">
          <div className="mb-4 md:ml-0 ml-10" />
          <ActiveComponent />
        </main>
        <footer className="mt-auto border-t bg-gray-50 px-6 py-4 md:ml-64 transition-all duration-300">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Barendra International. Human Hair Wig Manufacturing, Bangladesh.</p>
            <p>ERP System v1.0 — All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}