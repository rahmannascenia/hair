import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'risks', 'edit');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const oldRisk = await db.risk.findUnique({ where: { id } });
    const oldPlain = oldRisk ? JSON.parse(JSON.stringify(oldRisk)) : {};

    const risk = await db.risk.update({
      where: { id },
      data: {
        description: body.description,
        category: body.category,
        likelihood: body.likelihood,
        impact: body.impact,
        riskScore: body.riskScore ?? (body.likelihood * body.impact),
        mitigation: body.mitigation,
        owner: body.owner,
        status: body.status,
      },
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'Risk',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(risk);
  } catch (error) {
    console.error('Risk update error:', error);
    return NextResponse.json({ error: 'Failed to update risk' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'risks', 'delete');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const actor = getActorFromRequest(request);

    const oldRisk = await db.risk.findUnique({ where: { id } });

    await db.risk.delete({ where: { id } });

    await writeAuditLog({
      entity: 'Risk',
      entityId: id,
      action: 'DELETE',
      oldValues: oldRisk ? JSON.parse(JSON.stringify(oldRisk)) : undefined,
      performedBy: actor,
    });

    return NextResponse.json({ message: 'Risk deleted' });
  } catch (error) {
    console.error('Risk delete error:', error);
    return NextResponse.json({ error: 'Failed to delete risk' }, { status: 500 });
  }
}