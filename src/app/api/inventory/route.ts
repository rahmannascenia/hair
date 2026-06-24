import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const buckets = await db.inventoryBucket.findMany({ orderBy: { id: 'asc' } });
    const totalValueBdt = buckets.reduce((s, b) => s + b.valueBdt, 0);
    const totalWeightKg = buckets.reduce((s, b) => s + b.weightKg, 0);

    // Get FX rate for USD conversion
    const settings = await db.settings.findUnique({ where: { id: 'default' } });
    const fxRate = settings?.fxUsdBdt ?? 120;

    const data = buckets.map((b) => ({
      id: b.id,
      name: b.bucketName,
      weightKg: b.weightKg,
      valueBdt: b.valueBdt,
      unitCostPerKg: b.weightKg > 0 ? b.valueBdt / b.weightKg : 0,
      pctOfTotal: totalValueBdt > 0 ? Math.round((b.valueBdt / totalValueBdt) * 10000) / 100 : 0,
    }));

    return NextResponse.json({
      buckets: data,
      totals: {
        weightKg: Math.round(totalWeightKg * 100) / 100,
        valueBdt: Math.round(totalValueBdt * 100) / 100,
        valueUsd: Math.round((totalValueBdt / fxRate) * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Inventory API error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}