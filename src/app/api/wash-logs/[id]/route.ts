import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'washing-log', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const washLog = await db.washLog.findUnique({
      where: { id },
      include: { lot: { include: { procurement: { include: { supplier: true } } } } },
    });
    if (!washLog) return NextResponse.json({ error: 'Wash log not found' }, { status: 404 });
    return NextResponse.json(washLog);
  } catch (error) {
    console.error('Wash log GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch wash log' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'washing-log', 'edit');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const actor = getActorFromRequest(request);
    const input = body.inputKg;
    const output = body.outputKg;
    const wastageKg = input - output;
    const wastagePct = input > 0 ? wastageKg / input : 0;
    const chemicalsBdt = Math.round(input * 12);
    const labourBdt = Math.round(input * 8);
    const costPerKgOut = output > 0 ? (chemicalsBdt + labourBdt) / output : 0;

    const settings = await db.settings.findUnique({ where: { id: 'default' } });
    const washTol = settings?.washTol ?? 0.15;
    const status = wastagePct > washTol ? 'INVESTIGATE' : 'OK';

    const oldWashLog = await db.washLog.findUnique({ where: { id } });
    const oldPlain = oldWashLog ? JSON.parse(JSON.stringify(oldWashLog)) : {};

    const updated = await db.washLog.update({
      where: { id },
      data: {
        washId: body.washId,
        lotId: body.lotId,
        washDate: new Date(body.washDate),
        operator: body.operator,
        inputKg: input,
        outputKg: output,
        wastageKg,
        wastagePct,
        chemicalsBdt,
        labourBdt,
        costPerKgOut,
        status,
      },
      include: { lot: true },
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'WashLog',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Wash log PUT error:', error);
    return NextResponse.json({ error: 'Failed to update wash log' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'washing-log', 'delete');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const actor = getActorFromRequest(request);

    const oldWashLog = await db.washLog.findUnique({ where: { id } });

    await db.washLog.delete({ where: { id } });

    await writeAuditLog({
      entity: 'WashLog',
      entityId: id,
      action: 'DELETE',
      oldValues: oldWashLog ? JSON.parse(JSON.stringify(oldWashLog)) : undefined,
      performedBy: actor,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wash log DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete wash log' }, { status: 500 });
  }
}