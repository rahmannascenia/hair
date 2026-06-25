import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'suppliers', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const supplier = await db.supplier.findUnique({
      where: { id },
      include: {
        procurements: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Supplier detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'suppliers', 'edit');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const oldSupplier = await db.supplier.findUnique({ where: { id } });
    const oldPlain = oldSupplier ? JSON.parse(JSON.stringify(oldSupplier)) : {};

    const supplier = await db.supplier.update({
      where: { id },
      data: {
        name: body.name,
        country: body.country,
        contact: body.contact,
        phone: body.phone,
        isLocal: body.isLocal,
        isActive: body.isActive,
      },
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'Supplier',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Supplier update error:', error);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'suppliers', 'delete');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const actor = getActorFromRequest(request);

    const procurementCount = await db.procurement.count({
      where: { supplierId: id },
    });

    if (procurementCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with existing procurements' },
        { status: 400 }
      );
    }

    const oldSupplier = await db.supplier.findUnique({ where: { id } });

    await db.supplier.delete({ where: { id } });

    await writeAuditLog({
      entity: 'Supplier',
      entityId: id,
      action: 'DELETE',
      oldValues: oldSupplier ? JSON.parse(JSON.stringify(oldSupplier)) : undefined,
      performedBy: actor,
    });

    return NextResponse.json({ message: 'Supplier deleted' });
  } catch (error) {
    console.error('Supplier delete error:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}