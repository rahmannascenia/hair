import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getChangedFields, getActorFromRequest } from '@/lib/audit';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const role = _request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'organization', 'view');
  if (!perm.allowed) return NextResponse.json({ error: perm.error }, { status: 403 });

  try {
    const { id } = await params;
    const worker = await db.worker.findUnique({ where: { id }, include: { factory: true, dailyEntries: { include: { record: { include: { lot: true } } }, orderBy: { createdAt: 'desc' } } } });
    if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    return NextResponse.json(worker);
  } catch (error) {
    console.error('Worker detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch worker' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'organization', 'edit');
  if (!perm.allowed) return NextResponse.json({ error: perm.error }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json();
    const actor = getActorFromRequest(request);
    const old = await db.worker.findUnique({ where: { id } });
    if (!old) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

    const worker = await db.worker.update({ where: { id }, data: { workerId: body.workerId, name: body.name, factoryId: body.factoryId, bKash: body.bKash, isActive: body.isActive }, include: { factory: true } });

    const { oldValues, newValues } = getChangedFields(JSON.parse(JSON.stringify(old)), body);
    await writeAuditLog({ entity: 'Worker', entityId: id, action: 'UPDATE', oldValues, newValues, performedBy: actor });
    return NextResponse.json(worker);
  } catch (error) {
    console.error('Worker update error:', error);
    return NextResponse.json({ error: 'Failed to update worker' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const role = _request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'organization', 'delete');
  if (!perm.allowed) return NextResponse.json({ error: perm.error }, { status: 403 });

  try {
    const { id } = await params;
    const actor = getActorFromRequest(_request);
    const entryCount = await db.workerDailyEntry.count({ where: { workerId: id } });
    if (entryCount > 0) return NextResponse.json({ error: 'Cannot delete worker with existing daily entries' }, { status: 400 });

    const old = await db.worker.findUnique({ where: { id } });
    await db.worker.delete({ where: { id } });
    await writeAuditLog({ entity: 'Worker', entityId: id, action: 'DELETE', oldValues: old ? JSON.parse(JSON.stringify(old)) : undefined, performedBy: actor });
    return NextResponse.json({ message: 'Worker deleted' });
  } catch (error) {
    console.error('Worker delete error:', error);
    return NextResponse.json({ error: 'Failed to delete worker' }, { status: 500 });
  }
}