import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'settings', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const settings = await db.settings.findUnique({ where: { id: 'default' } });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'settings', 'edit');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const oldSettings = await db.settings.findUnique({ where: { id: 'default' } });
    const oldPlain = oldSettings ? JSON.parse(JSON.stringify(oldSettings)) : {};

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

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'Settings',
      entityId: 'default',
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}