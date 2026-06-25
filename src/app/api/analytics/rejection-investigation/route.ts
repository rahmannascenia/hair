import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const entries = await db.workerDailyEntry.findMany({
      include: { worker: { include: { factory: true } }, record: true },
    });

    // Root causes analysis
    const rootCauses: { cause: string; count: number; avgWastage: number }[] = [];
    const cGradeBuckets = new Map<string, { count: number; totalC: number; totalOutput: number }>();

    for (const e of entries) {
      const total = e.aWeightKg + e.bWeightKg + e.cWeightKg;
      const wastagePct = total > 0 ? (e.wastageKg / total) * 100 : 0;
      const cPct = total > 0 ? (e.cWeightKg / total) * 100 : 0;

      if (wastagePct > 15) {
        const cause = wastagePct > 25 ? 'Raw Material Issue' : wastagePct > 20 ? 'Worker Skill' : 'Process Issue';
        const existing = rootCauses.find((r) => r.cause === cause);
        if (existing) { existing.count++; existing.avgWastage += wastagePct; }
        else rootCauses.push({ cause, count: 1, avgWastage: wastagePct });
      }

      if (cPct > 20) {
        const fId = e.worker?.factory?.name ?? 'Unknown';
        const existing = cGradeBuckets.get(fId);
        if (existing) { existing.count++; existing.totalC += e.cWeightKg; existing.totalOutput += total; }
        else cGradeBuckets.set(fId, { count: 1, totalC: e.cWeightKg, totalOutput: total });
      }
    }

    for (const r of rootCauses) r.avgWastage = Math.round((r.avgWastage / r.count) * 10) / 10;

    const highWastage = entries
      .filter((e) => {
        const t = e.aWeightKg + e.bWeightKg + e.cWeightKg;
        return t > 0 && (e.wastageKg / t) * 100 > 15;
      })
      .slice(0, 20)
      .map((e) => {
        const t = e.aWeightKg + e.bWeightKg + e.cWeightKg;
        return {
          entryId: e.id,
          worker: e.worker?.name,
          factory: e.worker?.factory?.name,
          date: e.record?.recordDate,
          input: e.inputGivenKg,
          wastage: e.wastageKg,
          wastagePct: t > 0 ? Math.round((e.wastageKg / t) * 1000) / 10 : 0,
        };
      });

    const cGradeFlags = Array.from(cGradeBuckets.entries()).map(([factory, d]) => ({
      factory,
      count: d.count,
      cPct: d.totalOutput > 0 ? Math.round((d.totalC / d.totalOutput) * 1000) / 10 : 0,
    }));

    const shortageEntries = entries
      .filter((e) => e.balanceStatus === 'MISMATCH')
      .slice(0, 20)
      .map((e) => ({
        entryId: e.id,
        worker: e.worker?.name,
        factory: e.worker?.factory?.name,
        date: e.record?.recordDate,
        input: e.inputGivenKg,
        output: e.aWeightKg + e.bWeightKg + e.cWeightKg,
        wastage: e.wastageKg,
        shortage: e.inputGivenKg - (e.aWeightKg + e.bWeightKg + e.cWeightKg + e.wastageKg),
      }));

    return NextResponse.json({
      rootCauses,
      highWastage,
      cGradeFlags,
      shortages: shortageEntries,
      summary: {
        totalEntries: entries.length,
        highWastageCount: highWastage.length,
        cGradeFlagCount: cGradeFlags.length,
        shortageCount: shortageEntries.length,
      },
    });
  } catch (error) {
    console.error('Rejection investigation error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}