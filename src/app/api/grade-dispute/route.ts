import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'grade-dispute', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const data = await db.gradeDispute.findMany({
      where,
      include: { worker: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Grade dispute list error:', error);
    return NextResponse.json({ error: 'Failed to fetch grade disputes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'grade-dispute', 'create');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);
    const dispute = await db.gradeDispute.create({
      data: {
        entryId: body.entryId,
        workerId: body.workerId,
        reason: body.reason,
        status: 'Pending',
      },
      include: { worker: true },
    });
    await writeAuditLog({
      entity: 'GradeDispute',
      entityId: dispute.id,
      action: 'CREATE',
      newValues: body,
      performedBy: actor,
    });
    return NextResponse.json(dispute, { status: 201 });
  } catch (error) {
    console.error('Grade dispute create error:', error);
    return NextResponse.json({ error: 'Failed to create grade dispute' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'grade-dispute', 'edit');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);
    const { id, status, resolution } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const oldDispute = await db.gradeDispute.findUnique({ where: { id } });
    const oldPlain = oldDispute ? JSON.parse(JSON.stringify(oldDispute)) : {};

    const dispute = await db.gradeDispute.update({
      where: { id },
      data: {
        status,
        resolution,
        resolvedAt: status === 'Upheld' || status === 'Overturned' ? new Date() : null,
      },
      include: { worker: true },
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'GradeDispute',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(dispute);
  } catch (error) {
    console.error('Grade dispute PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update grade dispute' }, { status: 500 });
  }
}