import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.settings.findUnique({ where: { id: 'default' } });
    const s = settings ?? {
      fxUsdBdt: 120, rateA: 500, rateB: 400, rateC: 300,
      washTol: 0.15, hackTol: 0.15, costPerKgTgt: 320, factoryAMin: 0.6,
      supMax: 400, supMin: 100, supExtra: 150, attDays: 30, attBonus: 200,
    };

    const factories = await db.factory.findMany({
      where: { isActive: true },
      include: {
        dailyRecords: { include: { lot: true } },
        workers: { where: { isActive: true } },
      },
    });

    const r = (v: number) => Math.round(v * 100) / 100;

    const factoryCosting = factories.map((f) => {
      const totalInputKg = f.dailyRecords.reduce((sum, rec) => sum + rec.totalInputKg, 0);
      const totalAGradeKg = f.dailyRecords.reduce((sum, rec) => sum + rec.totalAGradeKg, 0);
      const totalBGradeKg = f.dailyRecords.reduce((sum, rec) => sum + rec.totalBGradeKg, 0);
      const totalCGradeKg = f.dailyRecords.reduce((sum, rec) => sum + rec.totalCGradeKg, 0);
      const outputKg = totalAGradeKg + totalBGradeKg + totalCGradeKg;
      const totalPayrollBdt = f.dailyRecords.reduce((sum, rec) => sum + rec.totalPayrollBdt, 0);
      const totalSupPay = f.dailyRecords.reduce((sum, rec) => sum + rec.totalSupPay, 0);
      const hostingAllowance = f.dailyRecords.reduce((sum, rec) => sum + rec.hostingAllowance, 0);
      const perfBonus = f.dailyRecords.reduce((sum, rec) => sum + rec.perfBonus, 0);
      const grandTotalBdt = f.dailyRecords.reduce((sum, rec) => sum + rec.grandTotalBdt, 0);

      const fuelBdt = f.fuelBdt;
      const transportBdt = f.transportBdt;
      const totalCost = totalPayrollBdt + hostingAllowance + perfBonus + fuelBdt + transportBdt;
      const costPerKg = outputKg > 0 ? totalCost / outputKg : 0;

      return {
        factoryId: f.factoryId,
        factoryName: f.name,
        location: f.location,
        workerCount: f.workers.length,
        outputKg: r(outputKg),
        totalInputKg: r(totalInputKg),
        totalAGradeKg: r(totalAGradeKg),
        totalBGradeKg: r(totalBGradeKg),
        totalCGradeKg: r(totalCGradeKg),
        workerCostBdt: r(totalPayrollBdt),
        supervisorCostBdt: r(totalSupPay),
        overheadCostBdt: r(fuelBdt + transportBdt),
        totalProcessingCostBdt: r(totalCost),
        costPerKg: r(costPerKg),
        costPerKgTarget: s.costPerKgTgt,
        costTargetMet: costPerKg > 0 ? costPerKg <= s.costPerKgTgt : null,
        aGradePct: outputKg > 0 ? r((totalAGradeKg / outputKg) * 100) : 0,
        aGradeTarget: s.factoryAMin * 100,
        aGradeTargetMet: outputKg > 0 ? (totalAGradeKg / outputKg) >= s.factoryAMin : null,
        fuelBdt, transportBdt,
      };
    });

    const companyTotals = {
      totalInputKg: r(factoryCosting.reduce((s, f) => s + f.totalInputKg, 0)),
      outputKg: r(factoryCosting.reduce((s, f) => s + f.outputKg, 0)),
      totalProcessingCostBdt: r(factoryCosting.reduce((s, f) => s + f.totalProcessingCostBdt, 0)),
      costPerKg: factoryCosting.reduce((s, f) => s + f.outputKg, 0) > 0
        ? r(factoryCosting.reduce((s, f) => s + f.totalProcessingCostBdt, 0) / factoryCosting.reduce((s, f) => s + f.outputKg, 0)) : 0,
    };

    return NextResponse.json({ factories: factoryCosting, companyTotals, settings: { costPerKgTgt: s.costPerKgTgt, factoryAMin: s.factoryAMin * 100 } });
  } catch (error) {
    console.error('Costing API error:', error);
    return NextResponse.json({ error: 'Failed to fetch costing data' }, { status: 500 });
  }
}