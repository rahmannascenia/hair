import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockAuditLogFindMany,
  mockAuditLogCount,
} from './mocks';
import { authedRequest } from './mocks';
import { GET } from '../audit-log/route';

const MOCK_AUDIT_LOGS = [
  {
    id: 'a1',
    entity: 'Worker',
    entityId: 'w1',
    action: 'CREATE',
    oldValues: null,
    newValues: '{"name":"Alice"}',
    performedBy: 'owner',
    createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'a2',
    entity: 'Procurement',
    entityId: 'p1',
    action: 'UPDATE',
    oldValues: '{"status":"Pending"}',
    newValues: '{"status":"Received"}',
    performedBy: 'pm',
    createdAt: '2025-01-14T09:00:00.000Z',
  },
  {
    id: 'a3',
    entity: 'Worker',
    entityId: 'w2',
    action: 'DELETE',
    oldValues: '{"name":"Bob"}',
    newValues: null,
    performedBy: 'owner',
    createdAt: '2025-01-13T08:00:00.000Z',
  },
];

const MOCK_DISTINCT_ENTITIES = [
  { entity: 'Procurement' },
  { entity: 'Worker' },
];

const MOCK_DISTINCT_USERS = [
  { performedBy: 'owner' },
  { performedBy: 'pm' },
];

describe('GET /api/audit-log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditLogFindMany.mockImplementation(async (opts: any) => {
      // If distinct/select is used for filter dropdowns, return distinct values
      if (opts?.distinct) {
        if (opts?.select?.entity !== undefined) return MOCK_DISTINCT_ENTITIES;
        if (opts?.select?.performedBy !== undefined) return MOCK_DISTINCT_USERS;
      }
      return MOCK_AUDIT_LOGS;
    });
    mockAuditLogCount.mockResolvedValue(3);
  });

  it('returns 200 and full audit log for owner role', async () => {
    const req = authedRequest('http://localhost/api/audit-log', {
      role: 'owner',
      user: 'owner',
    });
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(3);
    expect(json.pagination).toEqual({
      page: 1,
      limit: 100,
      total: 3,
      totalPages: 1,
    });
    expect(json.filters.entities).toContain('Worker');
    expect(json.filters.entities).toContain('Procurement');
    expect(json.filters.users).toContain('owner');
    expect(json.filters.users).toContain('pm');
    expect(json.filters.actions).toEqual(['CREATE', 'UPDATE', 'DELETE']);
  });

  it('returns 200 and full audit log for admin role', async () => {
    const req = authedRequest('http://localhost/api/audit-log', {
      role: 'admin',
      user: 'admin1',
    });
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    // Admin sees all logs (canViewFullAuditLog = true)
    expect(json.data).toHaveLength(3);
  });

  it('returns 200 and full audit log for accountant role', async () => {
    const req = authedRequest('http://localhost/api/audit-log', {
      role: 'accountant',
      user: 'acc1',
    });
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    // Accountant sees all logs (canViewFullAuditLog = true)
    expect(json.data).toHaveLength(3);
  });

  it('returns 403 for viewer role (no audit-log access)', async () => {
    const req = authedRequest('http://localhost/api/audit-log', {
      role: 'viewer',
      user: 'viewer1',
    });
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('viewer');
  });

  it('returns 403 when no auth headers present', async () => {
    const req = new Request('http://localhost/api/audit-log');
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('Authentication required');
  });

  it('filters to only own entries for pm role', async () => {
    const req = authedRequest('http://localhost/api/audit-log', {
      role: 'pm',
      user: 'pm',
    });
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    // PM can view audit-log but only sees own entries
    expect(json.data).toHaveLength(1);
    expect(json.data[0].performedBy).toBe('pm');
  });

  it('filters by entity query param', async () => {
    const req = authedRequest('http://localhost/api/audit-log?entity=Worker');
    await GET(req as any);

    // Check the main data query
    const mainCalls = mockAuditLogFindMany.mock.calls.filter(
      (call: any) => !call[0]?.distinct
    );
    expect(mainCalls[0][0].where.entity).toBe('Worker');
  });

  it('filters by action query param', async () => {
    const req = authedRequest('http://localhost/api/audit-log?action=DELETE');
    await GET(req as any);

    const mainCalls = mockAuditLogFindMany.mock.calls.filter(
      (call: any) => !call[0]?.distinct
    );
    expect(mainCalls[0][0].where.action).toBe('DELETE');
  });

  it('filters by performedBy query param', async () => {
    const req = authedRequest('http://localhost/api/audit-log?performedBy=owner');
    await GET(req as any);

    const mainCalls = mockAuditLogFindMany.mock.calls.filter(
      (call: any) => !call[0]?.distinct
    );
    expect(mainCalls[0][0].where.performedBy).toBe('owner');
  });

  it('filters by date range', async () => {
    const req = authedRequest(
      'http://localhost/api/audit-log?dateFrom=2025-01-14&dateTo=2025-01-15'
    );
    await GET(req as any);

    const mainCalls = mockAuditLogFindMany.mock.calls.filter(
      (call: any) => !call[0]?.distinct
    );
    const dateFilter = mainCalls[0][0].where.createdAt;
    expect(dateFilter.gte).toBeInstanceOf(Date);
    expect(dateFilter.gte.toISOString()).toContain('2025-01-14');
    expect(dateFilter.lte).toBeInstanceOf(Date);
    expect(dateFilter.lte.toISOString()).toContain('2025-01-15T23:59:59');
  });

  it('filters by entityId query param', async () => {
    const req = authedRequest('http://localhost/api/audit-log?entityId=w1');
    await GET(req as any);

    const mainCalls = mockAuditLogFindMany.mock.calls.filter(
      (call: any) => !call[0]?.distinct
    );
    expect(mainCalls[0][0].where.entityId).toBe('w1');
  });

  it('supports pagination', async () => {
    const req = authedRequest('http://localhost/api/audit-log?page=2&limit=10');
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.pagination.page).toBe(2);
    expect(json.pagination.limit).toBe(10);

    const mainCalls = mockAuditLogFindMany.mock.calls.filter(
      (call: any) => !call[0]?.distinct
    );
    expect(mainCalls[0][0].skip).toBe(10);
    expect(mainCalls[0][0].take).toBe(10);
  });

  it('returns 500 on DB error', async () => {
    mockAuditLogFindMany.mockRejectedValue(new Error('DB down'));
    const req = authedRequest('http://localhost/api/audit-log', { role: 'owner' });
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to fetch audit logs');
  });
});