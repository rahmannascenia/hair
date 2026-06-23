import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.settings.findUnique({ where: { id: 'default' } });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const settings = await db.settings.update({
      where: { id: 'default' },
      data: {
        fxUsdBdt: body.fxUsdBdt,
        rateA: body.rateA,
        rateB: body.rateB,
        rateC: body.rateC,
        washTol: body.washTol,
        hackTol: body.hackTol,
        costPerKgTgt: body.costPerKgTgt,
        factoryAMin: body.factoryAMin,
        supMax: body.supMax,
        supMin: body.supMin,
        supExtra: body.supExtra,
        perfThreshold: body.perfThreshold,
        perfBonus: body.perfBonus,
        attDays: body.attDays,
        attBonus: body.attBonus,
        autoCGrams: body.autoCGrams,
        turnoverTgt: body.turnoverTgt,
      },
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}