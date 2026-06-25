import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'lc-management', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const lc = await db.lCManagement.findUnique({
      where: { id },
      include: { procurement: { include: { supplier: true } } },
    });

    if (!lc) {
      return NextResponse.json({ error: 'LC not found' }, { status: 404 });
    }

    return NextResponse.json(lc);
  } catch (error) {
    console.error('LC detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch LC' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'lc-management', 'edit');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const oldLC = await db.lCManagement.findUnique({ where: { id } });
    const oldPlain = oldLC ? JSON.parse(JSON.stringify(oldLC)) : {};

    const lc = await db.lCManagement.update({
      where: { id },
      data: {
        lcNo: body.lcNo,
        procurementId: body.procurementId,
        lcDate: body.lcDate ? new Date(body.lcDate) : undefined,
        bankName: body.bankName,
        usdAmount: body.usdAmount,
        bdtAmount: body.bdtAmount,
        fxRate: body.fxRate,
        status: body.status,
        shipmentDate: body.shipmentDate ? new Date(body.shipmentDate) : null,
        clearanceDate: body.clearanceDate ? new Date(body.clearanceDate) : null,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
        notes: body.notes,
      },
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'LCManagement',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(lc);
  } catch (error) {
    console.error('LC update error:', error);
    return NextResponse.json({ error: 'Failed to update LC' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'lc-management', 'delete');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const actor = getActorFromRequest(request);

    const oldLC = await db.lCManagement.findUnique({ where: { id } });

    await db.lCManagement.delete({ where: { id } });

    await writeAuditLog({
      entity: 'LCManagement',
      entityId: id,
      action: 'DELETE',
      oldValues: oldLC ? JSON.parse(JSON.stringify(oldLC)) : undefined,
      performedBy: actor,
    });

    return NextResponse.json({ message: 'LC deleted' });
  } catch (error) {
    console.error('LC delete error:', error);
    return NextResponse.json({ error: 'Failed to delete LC' }, { status: 500 });
  }
}
