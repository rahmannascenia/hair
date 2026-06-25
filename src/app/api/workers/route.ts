import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getChangedFields, getActorFromRequest } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'organization', 'view');
  if (!perm.allowed) return NextResponse.json({ error: perm.error }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const factoryId = searchParams.get('factoryId');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (factoryId) where.factoryId = factoryId;
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true';
    if (search) where.OR = [{ name: { contains: search } }, { workerId: { contains: search } }];

    const [workers, total] = await Promise.all([
      db.worker.findMany({ where, include: { factory: true }, orderBy: { workerId: 'asc' }, skip: (page - 1) * limit, take: limit }),
      db.worker.count({ where }),
    ]);

    return NextResponse.json({ data: workers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Workers list error:', error);
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'organization', 'create');
  if (!perm.allowed) return NextResponse.json({ error: perm.error }, { status: 403 });

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);
    const worker = await db.worker.create({
      data: { workerId: body.workerId, name: body.name, factoryId: body.factoryId, bKash: body.bKash, isActive: body.isActive ?? true },
      include: { factory: true },
    });
    await writeAuditLog({ entity: 'Worker', entityId: worker.id, action: 'CREATE', newValues: body, performedBy: actor });
    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    console.error('Worker create error:', error);
    return NextResponse.json({ error: 'Failed to create worker' }, { status: 500 });
  }
}