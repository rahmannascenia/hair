import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const factories = await db.factory.findMany({
      where: { isActive: true },
      include: {
        lineLeader: { include: { headLeader: true } },
        workers: { where: { isActive: true } },
        dailyRecords: true,
      },
    });

    const settings = await db.settings.findUnique({ where: { id: 'default' } });

    const factorySummaries = factories.map((f) => {
      const totalRecords = f.dailyRecords.length;
      const totalInputKg = f.dailyRecords.reduce((sum, r) => sum + r.totalInputKg, 0);
      const totalAGradeKg = f.dailyRecords.reduce((sum, r) => sum + r.totalAGradeKg, 0);
      const totalBGradeKg = f.dailyRecords.reduce((sum, r) => sum + r.totalBGradeKg, 0);
      const totalCGradeKg = f.dailyRecords.reduce((sum, r) => sum + r.totalCGradeKg, 0);
      const totalWastageKg = f.dailyRecords.reduce((sum, r) => sum + r.totalWastageKg, 0);
      const totalPayrollBdt = f.dailyRecords.reduce((sum, r) => sum + r.totalPayrollBdt, 0);
      const grandTotalBdt = f.dailyRecords.reduce((sum, r) => sum + r.grandTotalBdt, 0);
      const totalHosting = f.dailyRecords.reduce((sum, r) => sum + r.hostingAllowance, 0);
      const totalPerfBonus = f.dailyRecords.reduce((sum, r) => sum + r.perfBonus, 0);
      const totalSupPay = f.dailyRecords.reduce((sum, r) => sum + r.totalSupPay, 0);
      const outputKg = totalAGradeKg + totalBGradeKg + totalCGradeKg;
      const avgCostPerKg = outputKg > 0 ? grandTotalBdt / outputKg : 0;

      // Get latest record date
      const latestRecord = f.dailyRecords.length > 0
        ? f.dailyRecords.reduce((latest, r) =>
            r.recordDate > latest.recordDate ? r : latest
          , f.dailyRecords[0])
        : null;

      // Get latest WIP status
      const latestWipStatus = latestRecord?.wipStatus ?? 'N/A';

      return {
        factoryId: f.factoryId,
        factoryName: f.name,
        supervisorName: f.supervisorName,
        supervisorBkash: f.supervisorBkash,
        location: f.location,
        lineLeader: f.lineLeader.name,
        headLeader: f.lineLeader.headLeader?.name ?? 'N/A',
        groupHead: f.groupHead,
        workerCount: f.workers.length,
        totalRecords,
        latestRecordDate: latestRecord?.recordDate ?? null,
        latestWipStatus,
        totalInputKg: Math.round(totalInputKg * 100) / 100,
        totalAGradeKg: Math.round(totalAGradeKg * 100) / 100,
        totalBGradeKg: Math.round(totalBGradeKg * 100) / 100,
        totalCGradeKg: Math.round(totalCGradeKg * 100) / 100,
        totalWastageKg: Math.round(totalWastageKg * 100) / 100,
        outputKg: Math.round(outputKg * 100) / 100,
        totalPayrollBdt: Math.round(totalPayrollBdt * 100) / 100,
        grandTotalBdt: Math.round(grandTotalBdt * 100) / 100,
        hostingAllowance: Math.round(totalHosting * 100) / 100,
        perfBonus: Math.round(totalPerfBonus * 100) / 100,
        totalSupPay: Math.round(totalSupPay * 100) / 100,
        avgCostPerKg: Math.round(avgCostPerKg * 100) / 100,
        aGradePct: outputKg > 0 ? Math.round((totalAGradeKg / outputKg) * 10000) / 100 : 0,
        wastagePct: totalInputKg > 0 ? Math.round((totalWastageKg / totalInputKg) * 10000) / 100 : 0,
      };
    });

    // Company-wide totals
    const companyTotals = {
      totalFactories: factories.length,
      totalWorkers: factories.reduce((sum, f) => sum + f.workers.length, 0),
      totalInputKg: factorySummaries.reduce((sum, f) => sum + f.totalInputKg, 0),
      totalOutputKg: factorySummaries.reduce((sum, f) => sum + f.outputKg, 0),
      totalAGradeKg: factorySummaries.reduce((sum, f) => sum + f.totalAGradeKg, 0),
      totalBGradeKg: factorySummaries.reduce((sum, f) => sum + f.totalBGradeKg, 0),
      totalCGradeKg: factorySummaries.reduce((sum, f) => sum + f.totalCGradeKg, 0),
      totalWastageKg: factorySummaries.reduce((sum, f) => sum + f.totalWastageKg, 0),
      totalPayrollBdt: factorySummaries.reduce((sum, f) => sum + f.totalPayrollBdt, 0),
      grandTotalBdt: factorySummaries.reduce((sum, f) => sum + f.grandTotalBdt, 0),
      hostingAllowance: factorySummaries.reduce((sum, f) => sum + f.hostingAllowance, 0),
      perfBonus: factorySummaries.reduce((sum, f) => sum + f.perfBonus, 0),
      totalSupPay: factorySummaries.reduce((sum, f) => sum + f.totalSupPay, 0),
      avgCostPerKg: factorySummaries.reduce((sum, f) => sum + f.totalOutputKg, 0) > 0
        ? Math.round(
            (factorySummaries.reduce((sum, f) => sum + f.grandTotalBdt, 0) /
              factorySummaries.reduce((sum, f) => sum + f.totalOutputKg, 0)) * 100
          ) / 100
        : 0,
      aGradePct: factorySummaries.reduce((sum, f) => sum + f.totalOutputKg, 0) > 0
        ? Math.round(
            (factorySummaries.reduce((sum, f) => sum + f.totalAGradeKg, 0) /
              factorySummaries.reduce((sum, f) => sum + f.totalOutputKg, 0)) * 10000
          ) / 100
        : 0,
    };

    return NextResponse.json({
      factories: factorySummaries,
      companyTotals,
    });
  } catch (error) {
    console.error('Payroll API error:', error);
    return NextResponse.json({ error: 'Failed to fetch payroll data' }, { status: 500 });
  }
}