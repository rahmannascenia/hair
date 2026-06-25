import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'consumables', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const item = await db.consumable.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Consumable not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Consumable detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch consumable' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'consumables', 'edit');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const oldItem = await db.consumable.findUnique({ where: { id } });
    const oldPlain = oldItem ? JSON.parse(JSON.stringify(oldItem)) : {};

    const item = await db.consumable.update({
      where: { id },
      data: {
        itemName: body.itemName,
        category: body.category,
        unit: body.unit,
        stockQty: body.stockQty,
        reorderLevel: body.reorderLevel,
        costPerUnit: body.costPerUnit,
        supplierName: body.supplierName,
        lastOrderDate: body.lastOrderDate ? new Date(body.lastOrderDate) : undefined,
      },
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'Consumable',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Consumable update error:', error);
    return NextResponse.json({ error: 'Failed to update consumable' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'consumables', 'delete');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const actor = getActorFromRequest(request);

    const oldItem = await db.consumable.findUnique({ where: { id } });

    await db.consumable.delete({ where: { id } });

    await writeAuditLog({
      entity: 'Consumable',
      entityId: id,
      action: 'DELETE',
      oldValues: oldItem ? JSON.parse(JSON.stringify(oldItem)) : undefined,
      performedBy: actor,
    });

    return NextResponse.json({ message: 'Consumable deleted' });
  } catch (error) {
    console.error('Consumable delete error:', error);
    return NextResponse.json({ error: 'Failed to delete consumable' }, { status: 500 });
  }
}