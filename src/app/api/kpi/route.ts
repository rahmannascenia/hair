import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'kpi', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const settings = await db.settings.findUnique({ where: { id: 'default' } });
    const s = settings ?? {
      fxUsdBdt: 120,
      rateA: 500,
      rateB: 400,
      rateC: 300,
      washTol: 0.15,
      hackTol: 0.15,
      costPerKgTgt: 320,
      factoryAMin: 0.6,
      supMax: 400,
      supMin: 100,
      supExtra: 150,
      perfThreshold: 0.9,
      perfBonus: 300,
      attDays: 30,
      attBonus: 200,
      autoCGrams: 50,
      turnoverTgt: 5,
    };

    // === Aggregates ===
    const [washAgg, recordAgg, salesAgg, procurementAgg, phase2Agg] = await Promise.all([
      db.washLog.aggregate({
        _sum: { inputKg: true, outputKg: true, wastageKg: true },
        _count: true,
      }),
      db.factoryDailyRecord.aggregate({
        _sum: {
          totalInputKg: true,
          totalAGradeKg: true,
          totalBGradeKg: true,
          totalCGradeKg: true,
          totalWastageKg: true,
          totalPayrollBdt: true,
          grandTotalBdt: true,
          hostingAllowance: true,
          perfBonus: true,
          totalSupPay: true,
        },
        _count: true,
      }),
      db.sale.aggregate({
        _sum: { qtyKg: true, usdValue: true, bdtValue: true, totalMarginBdt: true, totalCostBdt: true },
      }),
      db.procurement.aggregate({
        _sum: { rawWeightKg: true, totalLandedCostBdt: true },
        _count: true,
      }),
      db.phase2Job.aggregate({
        _sum: { inputKg: true, totalSizedKg: true, combingLossKg: true, costBdt: true, marginBdt: true },
        _count: true,
      }),
    ]);

    const washInput = washAgg._sum.inputKg ?? 0;
    const washOutput = washAgg._sum.outputKg ?? 0;
    const washWastage = washAgg._sum.wastageKg ?? 0;

    const totalInput = recordAgg._sum.totalInputKg ?? 0;
    const totalA = recordAgg._sum.totalAGradeKg ?? 0;
    const totalB = recordAgg._sum.totalBGradeKg ?? 0;
    const totalC = recordAgg._sum.totalCGradeKg ?? 0;
    const totalWastage = recordAgg._sum.totalWastageKg ?? 0;
    const totalPayroll = recordAgg._sum.totalPayrollBdt ?? 0;
    const grandTotal = recordAgg._sum.grandTotalBdt ?? 0;
    const totalHosting = recordAgg._sum.hostingAllowance ?? 0;
    const totalPerfBonus = recordAgg._sum.perfBonus ?? 0;
    const totalSupPay = recordAgg._sum.totalSupPay ?? 0;
    const recordCount = recordAgg._count;

    const salesQty = salesAgg._sum.qtyKg ?? 0;
    const salesUsd = salesAgg._sum.usdValue ?? 0;
    const salesBdt = salesAgg._sum.bdtValue ?? 0;
    const salesMargin = salesAgg._sum.totalMarginBdt ?? 0;
    const salesCost = salesAgg._sum.totalCostBdt ?? 0;

    const procWeight = procurementAgg._sum.rawWeightKg ?? 0;
    const procCost = procurementAgg._sum.totalLandedCostBdt ?? 0;

    const p2Input = phase2Agg._sum.inputKg ?? 0;
    const p2Sized = phase2Agg._sum.totalSizedKg ?? 0;
    const p2Loss = phase2Agg._sum.combingLossKg ?? 0;
    const p2Cost = phase2Agg._sum.costBdt ?? 0;
    const p2Margin = phase2Agg._sum.marginBdt ?? 0;

    const totalOutput = totalA + totalB + totalC;
    const activeLots = await db.lot.count({ where: { status: { notIn: ['Raw Material', 'Finished'] } } });
    const totalWorkers = await db.worker.count({ where: { isActive: true } });
    const activeFactories = await db.factory.count({ where: { isActive: true } });
    const openRisks = await db.risk.count({ where: { status: 'Open' } });
    const highRisks = await db.risk.count({ where: { status: 'Open', riskScore: { gte: 15 } } });

    // Attendance
    const entryAgg = await db.workerDailyEntry.aggregate({
      _sum: { daysPresent: true },
    });
    const totalDaysPresent = entryAgg._sum.daysPresent ?? 0;
    const entryCount = await db.workerDailyEntry.count();
    const maxPossibleDays = entryCount * s.attDays;

    // Supplier concentration
    const topSupplier = await db.procurement.groupBy({
      by: ['supplierId'],
      _sum: { totalLandedCostBdt: true },
      orderBy: { _sum: { totalLandedCostBdt: 'desc' } },
      take: 1,
    });
    const supplierConcentration = procCost > 0 && topSupplier.length > 0
      ? ((topSupplier[0]._sum.totalLandedCostBdt ?? 0) / procCost) * 100
      : 0;

    // Buyer concentration
    const topBuyer = await db.sale.groupBy({
      by: ['buyerId'],
      _sum: { bdtValue: true },
      orderBy: { _sum: { bdtValue: 'desc' } },
      take: 1,
    });
    const buyerConcentration = salesBdt > 0 && topBuyer.length > 0
      ? ((topBuyer[0]._sum.bdtValue ?? 0) / salesBdt) * 100
      : 0;

    // Distribution efficiency
    const lotAgg = await db.lot.aggregate({
      _sum: { rawWeightKg: true, distributedKg: true, finishedKg: true },
      where: { washStatus: 'Done' },
    });

    // Helper
    const r = (v: number) => Math.round(v * 100) / 100;
    const status = (onTarget: boolean) => onTarget ? 'ON TARGET' : 'OFF TARGET';

    // === 26 KPIs ===
    const kpis = [
      // -- Production KPIs (1-8) --
      {
        id: 'wash-yield',
        name: 'Wash Yield %',
        category: 'Production',
        target: r((1 - s.washTol) * 100),
        actual: washInput > 0 ? r((washOutput / washInput) * 100) : 0,
        unit: '%',
        status: status(washInput > 0 && (washOutput / washInput) >= (1 - s.washTol)),
      },
      {
        id: 'wash-wastage',
        name: 'Wash Wastage %',
        category: 'Production',
        target: r(s.washTol * 100),
        actual: washInput > 0 ? r((washWastage / washInput) * 100) : 0,
        unit: '%',
        status: status(washInput > 0 && (washWastage / washInput) <= s.washTol),
      },
      {
        id: 'a-grade-pct',
        name: 'A-Grade %',
        category: 'Production',
        target: r(s.factoryAMin * 100),
        actual: totalOutput > 0 ? r((totalA / totalOutput) * 100) : 0,
        unit: '%',
        status: status(totalOutput > 0 && (totalA / totalOutput) >= s.factoryAMin),
      },
      {
        id: 'b-grade-pct',
        name: 'B-Grade %',
        category: 'Production',
        target: 25,
        actual: totalOutput > 0 ? r((totalB / totalOutput) * 100) : 0,
        unit: '%',
        status: status(totalOutput > 0 && (totalB / totalOutput) <= 0.25),
      },
      {
        id: 'c-grade-pct',
        name: 'C-Grade %',
        category: 'Production',
        target: 15,
        actual: totalOutput > 0 ? r((totalC / totalOutput) * 100) : 0,
        unit: '%',
        status: status(totalOutput > 0 && (totalC / totalOutput) <= 0.15),
      },
      {
        id: 'factory-wastage-pct',
        name: 'Factory Wastage %',
        category: 'Production',
        target: r(s.washTol * 100),
        actual: totalInput > 0 ? r((totalWastage / totalInput) * 100) : 0,
        unit: '%',
        status: status(totalInput > 0 && (totalWastage / totalInput) <= s.washTol),
      },
      {
        id: 'daily-output',
        name: 'Daily Output (kg)',
        category: 'Production',
        target: 100,
        actual: r(totalOutput),
        unit: 'kg',
        status: status(totalOutput >= 100),
      },
      {
        id: 'active-lots',
        name: 'Active Lots',
        category: 'Production',
        target: null,
        actual: activeLots,
        unit: 'count',
        status: 'ON TARGET' as const,
      },

      // -- Financial KPIs (9-16) --
      {
        id: 'cost-per-kg',
        name: 'Cost per kg (BDT)',
        category: 'Financial',
        target: s.costPerKgTgt,
        actual: totalOutput > 0 ? r(grandTotal / totalOutput) : 0,
        unit: 'BDT',
        status: status(totalOutput > 0 && (grandTotal / totalOutput) <= s.costPerKgTgt),
      },
      {
        id: 'export-revenue',
        name: 'Export Revenue (BDT)',
        category: 'Financial',
        target: null,
        actual: r(salesBdt),
        unit: 'BDT',
        status: 'ON TARGET' as const,
      },
      {
        id: 'export-revenue-usd',
        name: 'Export Revenue (USD)',
        category: 'Financial',
        target: null,
        actual: r(salesBdt / s.fxUsdBdt),
        unit: 'USD',
        status: 'ON TARGET' as const,
      },
      {
        id: 'gross-margin-pct',
        name: 'Gross Margin %',
        category: 'Financial',
        target: 20,
        actual: salesBdt > 0 ? r((salesMargin / salesBdt) * 100) : 0,
        unit: '%',
        status: status(salesBdt > 0 && (salesMargin / salesBdt) >= 0.2),
      },
      {
        id: 'margin-per-kg',
        name: 'Margin per kg (BDT)',
        category: 'Financial',
        target: 50,
        actual: salesQty > 0 ? r(salesMargin / salesQty) : 0,
        unit: 'BDT/kg',
        status: status(salesQty > 0 && (salesMargin / salesQty) >= 50),
      },
      {
        id: 'total-payroll',
        name: 'Total Payroll (BDT)',
        category: 'Financial',
        target: null,
        actual: r(grandTotal),
        unit: 'BDT',
        status: 'ON TARGET' as const,
      },
      {
        id: 'fx-rate',
        name: 'FX Rate (USD/BDT)',
        category: 'Financial',
        target: 120,
        actual: s.fxUsdBdt,
        unit: 'BDT/USD',
        status: status(s.fxUsdBdt <= 120),
      },
      {
        id: 'avg-procurement-cost',
        name: 'Avg Procurement Cost/kg',
        category: 'Financial',
        target: 300,
        actual: procWeight > 0 ? r(procCost / procWeight) : 0,
        unit: 'BDT/kg',
        status: status(procWeight > 0 && (procCost / procWeight) <= 300),
      },

      // -- Operational KPIs (17-22) --
      {
        id: 'total-workers',
        name: 'Total Workers',
        category: 'Operational',
        target: null,
        actual: totalWorkers,
        unit: 'count',
        status: 'ON TARGET' as const,
      },
      {
        id: 'active-factories',
        name: 'Active Factories',
        category: 'Operational',
        target: null,
        actual: activeFactories,
        unit: 'count',
        status: 'ON TARGET' as const,
      },
      {
        id: 'worker-productivity',
        name: 'Worker Productivity (kg/worker)',
        category: 'Operational',
        target: 2,
        actual: totalWorkers > 0 ? r(totalOutput / totalWorkers) : 0,
        unit: 'kg/worker',
        status: status(totalWorkers > 0 && (totalOutput / totalWorkers) >= 2),
      },
      {
        id: 'attendance-rate',
        name: 'Attendance Rate %',
        category: 'Operational',
        target: r((s.attDays / 30) * 100),
        actual: maxPossibleDays > 0 ? r((totalDaysPresent / maxPossibleDays) * 100) : 0,
        unit: '%',
        status: status(maxPossibleDays > 0 && (totalDaysPresent / maxPossibleDays) >= (s.attDays / 30)),
      },
      {
        id: 'distribution-rate',
        name: 'Distribution Rate %',
        category: 'Operational',
        target: 90,
        actual: (lotAgg._sum.rawWeightKg ?? 0) > 0
          ? r(((lotAgg._sum.distributedKg ?? 0) / (lotAgg._sum.rawWeightKg ?? 1)) * 100)
          : 0,
        unit: '%',
        status: status(
          (lotAgg._sum.rawWeightKg ?? 0) > 0 &&
          ((lotAgg._sum.distributedKg ?? 0) / (lotAgg._sum.rawWeightKg ?? 1)) >= 0.9
        ),
      },
      {
        id: 'supplier-concentration',
        name: 'Supplier Concentration %',
        category: 'Operational',
        target: 50,
        actual: r(supplierConcentration),
        unit: '%',
        status: status(supplierConcentration <= 50),
      },

      // -- Phase 2 KPIs (23-24) --
      {
        id: 'phase2-yield',
        name: 'Phase 2 Yield %',
        category: 'Phase 2',
        target: 90,
        actual: p2Input > 0 ? r((p2Sized / p2Input) * 100) : 0,
        unit: '%',
        status: status(p2Input > 0 && (p2Sized / p2Input) >= 0.9),
      },
      {
        id: 'phase2-loss-pct',
        name: 'Phase 2 Combing Loss %',
        category: 'Phase 2',
        target: 10,
        actual: p2Input > 0 ? r((p2Loss / p2Input) * 100) : 0,
        unit: '%',
        status: status(p2Input > 0 && (p2Loss / p2Input) <= 0.1),
      },

      // -- Risk KPIs (25-26) --
      {
        id: 'open-risks',
        name: 'Open Risks',
        category: 'Risk',
        target: 0,
        actual: openRisks,
        unit: 'count',
        status: status(openRisks === 0),
      },
      {
        id: 'high-risks',
        name: 'High Risks (score ≥ 15)',
        category: 'Risk',
        target: 0,
        actual: highRisks,
        unit: 'count',
        status: status(highRisks === 0),
      },
    ];

    return NextResponse.json({ kpis });
  } catch (error) {
    console.error('KPI API error:', error);
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
  }
}