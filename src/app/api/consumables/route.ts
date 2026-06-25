import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'consumables', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock');
    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (lowStock === 'true') {
      // @ts-expect-error Prisma comparison filter
      where.stockQty = { lt: db.consumable.fields.reorderLevel };
    }
    const data = await db.consumable.findMany({
      where,
      orderBy: { itemName: 'asc' },
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Consumables list error:', error);
    return NextResponse.json({ error: 'Failed to fetch consumables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'consumables', 'create');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);
    const item = await db.consumable.create({
      data: {
        itemName: body.itemName,
        category: body.category,
        unit: body.unit ?? 'pcs',
        stockQty: body.stockQty ?? 0,
        reorderLevel: body.reorderLevel ?? 0,
        costPerUnit: body.costPerUnit ?? 0,
        supplierName: body.supplierName,
        lastOrderDate: body.lastOrderDate ? new Date(body.lastOrderDate) : null,
      },
    });
    await writeAuditLog({
      entity: 'Consumable',
      entityId: item.id,
      action: 'CREATE',
      newValues: body,
      performedBy: actor,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Consumable create error:', error);
    return NextResponse.json({ error: 'Failed to create consumable' }, { status: 500 });
  }
}