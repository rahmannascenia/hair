import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'inventory', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const buckets = await db.inventoryBucket.findMany({ orderBy: { id: 'asc' } });
    return NextResponse.json({ data: buckets });
  } catch (error) {
    console.error('Inventory buckets GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory buckets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'inventory', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);
    const bucket = await db.inventoryBucket.create({
      data: {
        bucketName: body.bucketName,
        weightKg: body.weightKg ?? 0,
        valueBdt: body.valueBdt ?? 0,
      },
    });
    await writeAuditLog({
      entity: 'InventoryBucket',
      entityId: bucket.id,
      action: 'CREATE',
      newValues: body,
      performedBy: actor,
    });
    return NextResponse.json(bucket, { status: 201 });
  } catch (error) {
    console.error('Inventory bucket create error:', error);
    return NextResponse.json({ error: 'Failed to create inventory bucket' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'inventory', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const oldBucket = await db.inventoryBucket.findUnique({ where: { id: body.id } });
    const oldPlain = oldBucket ? JSON.parse(JSON.stringify(oldBucket)) : {};

    const bucket = await db.inventoryBucket.update({
      where: { id: body.id },
      data: {
        bucketName: body.bucketName,
        weightKg: body.weightKg,
        valueBdt: body.valueBdt,
      },
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'InventoryBucket',
      entityId: body.id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(bucket);
  } catch (error) {
    console.error('Inventory bucket update error:', error);
    return NextResponse.json({ error: 'Failed to update inventory bucket' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'inventory', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const actor = getActorFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const oldBucket = await db.inventoryBucket.findUnique({ where: { id } });

    await db.inventoryBucket.delete({ where: { id } });

    await writeAuditLog({
      entity: 'InventoryBucket',
      entityId: id,
      action: 'DELETE',
      oldValues: oldBucket ? JSON.parse(JSON.stringify(oldBucket)) : undefined,
      performedBy: actor,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inventory bucket delete error:', error);
    return NextResponse.json({ error: 'Failed to delete inventory bucket' }, { status: 500 });
  }
}