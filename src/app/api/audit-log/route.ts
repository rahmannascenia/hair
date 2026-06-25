import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, canViewAuditEntry } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const username = request.headers.get('x-erp-user') || '';
  const perm = checkPermission(role, 'audit-log', 'view');
  if (!perm.allowed) return NextResponse.json({ error: perm.error }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');
    const action = searchParams.get('action');
    const performedBy = searchParams.get('performedBy');
    const entityId = searchParams.get('entityId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '100');

    const where: Record<string, unknown> = {};

    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (performedBy) where.performedBy = performedBy;
    if (entityId) where.entityId = entityId;
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo + 'T23:59:59');
      where.createdAt = dateFilter;
    }

    const [data, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    // Apply role-based visibility filtering:
    // Owner/Accountant see all; others see only their own changes
    const filteredData = role === 'owner' || role === 'admin' || role === 'accountant'
      ? data
      : data.filter(log => canViewAuditEntry(role, log.performedBy || undefined, username));

    // Get unique values for filter dropdowns
    const [entities, users] = await Promise.all([
      db.auditLog.findMany({ select: { entity: true }, distinct: true, orderBy: { entity: 'asc' } }),
      db.auditLog.findMany({ select: { performedBy: true }, distinct: true, orderBy: { performedBy: 'asc' } }),
    ]);

    return NextResponse.json({
      data: filteredData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      filters: {
        entities: entities.map(e => e.entity),
        users: users.map(u => u.performedBy).filter(Boolean),
        actions: ['CREATE', 'UPDATE', 'DELETE'],
      },
    });
  } catch (error) {
    console.error('Audit log list error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}