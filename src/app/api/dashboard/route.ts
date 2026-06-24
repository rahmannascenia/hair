import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // 1. Total Active Lots (status != 'Raw Material' AND status != 'Finished')
    const totalActiveLots = await db.lot.count({
      where: {
        status: { notIn: ['Raw Material', 'Finished'] },
      },
    });

    // 2. Total Workers
    const totalWorkers = await db.worker.count({
      where: { isActive: true },
    });

    // 3-6. Factory daily record aggregates
    const recordAggregates = await db.factoryDailyRecord.aggregate({
      _sum: {
        totalAGradeKg: true,
        totalBGradeKg: true,
        totalCGradeKg: true,
        grandTotalBdt: true,
      },
    });

    const totalA = recordAggregates._sum.totalAGradeKg ?? 0;
    const totalB = recordAggregates._sum.totalBGradeKg ?? 0;
    const totalC = recordAggregates._sum.totalCGradeKg ?? 0;
    const totalPayroll = recordAggregates._sum.grandTotalBdt ?? 0;

    // 3. Daily Output (kg) = A + B + C
    const dailyOutputKg = totalA + totalB + totalC;

    // 4. A-Grade % (company level)
    const aGradePct = dailyOutputKg > 0 ? (totalA / dailyOutputKg) * 100 : 0;

    // 5. Avg Cost/kg
    const avgCostPerKg = dailyOutputKg > 0 ? totalPayroll / dailyOutputKg : 0;

    // 7. Export Revenue BDT
    const salesAgg = await db.sale.aggregate({
      _sum: { bdtValue: true },
    });
    const exportRevenueBDT = salesAgg._sum.bdtValue ?? 0;

    // 8. FX Rate
    const settings = await db.settings.findUnique({ where: { id: 'default' } });
    const fxRate = settings?.fxUsdBdt ?? 120.0;

    return NextResponse.json({
      totalActiveLots,
      totalWorkers,
      dailyOutputKg: Math.round(dailyOutputKg * 100) / 100,
      aGradePct: Math.round(aGradePct * 100) / 100,
      avgCostPerKg: Math.round(avgCostPerKg * 100) / 100,
      totalPayroll: Math.round(totalPayroll * 100) / 100,
      exportRevenueBDT: Math.round(exportRevenueBDT * 100) / 100,
      fxRate,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}