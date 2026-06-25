import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'risks', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const minScore = searchParams.get('minScore');

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (minScore) where.riskScore = { gte: parseInt(minScore) };

    const risks = await db.risk.findMany({
      where,
      orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ data: risks });
  } catch (error) {
    console.error('Risks list error:', error);
    return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'risks', 'create');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const risk = await db.risk.create({
      data: {
        riskId: body.riskId,
        description: body.description,
        category: body.category,
        likelihood: body.likelihood,
        impact: body.impact,
        riskScore: body.likelihood * body.impact,
        mitigation: body.mitigation,
        owner: body.owner,
        status: body.status ?? 'Open',
      },
    });

    await writeAuditLog({
      entity: 'Risk',
      entityId: risk.id,
      action: 'CREATE',
      newValues: body,
      performedBy: actor,
    });

    return NextResponse.json(risk, { status: 201 });
  } catch (error) {
    console.error('Risk create error:', error);
    return NextResponse.json({ error: 'Failed to create risk' }, { status: 500 });
  }
}