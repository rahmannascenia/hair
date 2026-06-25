import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockWorkerFindMany,
  mockWorkerFindUnique,
  mockWorkerCreate,
  mockWorkerUpdate,
  mockWorkerDelete,
  mockWorkerCount,
  mockWorkerDailyEntryCount,
  mockAuditLogCreate,
} from './mocks';
import { authedRequest, unauthedRequest } from './mocks';
import { GET, POST } from '../workers/route';
import { GET as GET_BY_ID, PUT, DELETE } from '../workers/[id]/route';

// Mock writeAuditLog to avoid hitting the real DB in audit module
vi.mock('@/lib/audit', async () => {
  const actual = await vi.importActual('@/lib/audit');
  return {
    ...actual,
    writeAuditLog: vi.fn().mockResolvedValue(undefined),
  };
});

const MOCK_WORKERS = [
  { id: 'w1', workerId: 'W001', name: 'Alice', factoryId: 'f1', isActive: true, factory: { id: 'f1', name: 'Factory A' } },
  { id: 'w2', workerId: 'W002', name: 'Bob', factoryId: 'f2', isActive: true, factory: { id: 'f2', name: 'Factory B' } },
];

const MOCK_WORKER_DETAIL = {
  id: 'w1',
  workerId: 'W001',
  name: 'Alice',
  factoryId: 'f1',
  bKash: '01711111111',
  isActive: true,
  factory: { id: 'f1', name: 'Factory A' },
  dailyEntries: [],
};

describe('GET /api/workers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkerFindMany.mockResolvedValue(MOCK_WORKERS);
    mockWorkerCount.mockResolvedValue(2);
  });

  it('returns 200 and workers array for owner role', async () => {
    const req = authedRequest('http://localhost/api/workers', {
      role: 'owner',
      user: 'owner',
    });
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.pagination).toEqual({
      page: 1,
      limit: 50,
      total: 2,
      totalPages: 1,
    });
    expect(mockWorkerFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { workerId: 'asc' },
        skip: 0,
        take: 50,
      })
    );
  });

  it('returns 403 when no auth headers are present', async () => {
    const req = unauthedRequest('http://localhost/api/workers');
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('Authentication required');
  });

  it('returns 200 for viewer role (view-only access to organization)', async () => {
    const req = authedRequest('http://localhost/api/workers', {
      role: 'viewer',
      user: 'viewer1',
    });
    const res = await GET(req as any);

    expect(res.status).toBe(200);
  });

  it('returns 403 for supervisor1 (no organization access)', async () => {
    const req = authedRequest('http://localhost/api/workers', {
      role: 'supervisor1',
      user: 'sup1',
    });
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('supervisor1');
  });

  it('passes factoryId filter to query', async () => {
    const req = authedRequest('http://localhost/api/workers?factoryId=f1');
    await GET(req as any);

    expect(mockWorkerFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ factoryId: 'f1' }),
      })
    );
  });

  it('passes isActive filter to query', async () => {
    const req = authedRequest('http://localhost/api/workers?isActive=true');
    await GET(req as any);

    expect(mockWorkerFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
  });

  it('passes search filter with OR clause', async () => {
    const req = authedRequest('http://localhost/api/workers?search=Alice');
    await GET(req as any);

    expect(mockWorkerFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'Alice' } },
            { workerId: { contains: 'Alice' } },
          ],
        }),
      })
    );
  });

  it('supports pagination via page and limit params', async () => {
    const req = authedRequest('http://localhost/api/workers?page=2&limit=10');
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.pagination).toEqual({ page: 2, limit: 10, total: 2, totalPages: 1 });
    expect(mockWorkerFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });

  it('returns 500 on DB error', async () => {
    mockWorkerFindMany.mockRejectedValue(new Error('DB down'));
    const req = authedRequest('http://localhost/api/workers');
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to fetch workers');
  });
});

describe('POST /api/workers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 and creates worker for owner role', async () => {
    const newWorker = { id: 'w3', workerId: 'W003', name: 'Charlie', factoryId: 'f1', isActive: true, factory: null };
    mockWorkerCreate.mockResolvedValue(newWorker);

    const req = authedRequest('http://localhost/api/workers', {
      method: 'POST',
      body: JSON.stringify({ workerId: 'W003', name: 'Charlie', factoryId: 'f1' }),
      role: 'owner',
      user: 'owner',
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.id).toBe('w3');
    expect(json.workerId).toBe('W003');
    expect(mockWorkerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workerId: 'W003',
          name: 'Charlie',
          factoryId: 'f1',
          isActive: true,
        }),
      })
    );
  });

  it('returns 403 for viewer role (no create permission)', async () => {
    const req = authedRequest('http://localhost/api/workers', {
      method: 'POST',
      body: JSON.stringify({ workerId: 'W004', name: 'Dave' }),
      role: 'viewer',
      user: 'viewer1',
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('viewer');
  });

  it('returns 403 when no auth headers', async () => {
    const req = new Request('http://localhost/api/workers', {
      method: 'POST',
      body: JSON.stringify({ workerId: 'W004', name: 'Dave' }),
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('Authentication required');
  });

  it('defaults isActive to true when not provided', async () => {
    mockWorkerCreate.mockResolvedValue({ id: 'w4', workerId: 'W004', name: 'Dave', isActive: true });
    const req = authedRequest('http://localhost/api/workers', {
      method: 'POST',
      body: JSON.stringify({ workerId: 'W004', name: 'Dave' }),
    });
    await POST(req as any);

    expect(mockWorkerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: true }),
      })
    );
  });

  it('returns 500 on DB error', async () => {
    mockWorkerCreate.mockRejectedValue(new Error('Unique constraint'));
    const req = authedRequest('http://localhost/api/workers', {
      method: 'POST',
      body: JSON.stringify({ workerId: 'W_DUP', name: 'Dup' }),
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to create worker');
  });
});

describe('GET /api/workers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkerFindUnique.mockResolvedValue(MOCK_WORKER_DETAIL);
  });

  it('returns 200 and worker detail for owner', async () => {
    const req = authedRequest('http://localhost/api/workers/w1', { role: 'owner' });
    const res = await GET_BY_ID(req as any, { params: Promise.resolve({ id: 'w1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.id).toBe('w1');
    expect(json.workerId).toBe('W001');
    expect(mockWorkerFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'w1' },
      })
    );
  });

  it('returns 404 when worker not found', async () => {
    mockWorkerFindUnique.mockResolvedValue(null);
    const req = authedRequest('http://localhost/api/workers/nonexistent', { role: 'owner' });
    const res = await GET_BY_ID(req as any, { params: Promise.resolve({ id: 'nonexistent' }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe('Worker not found');
  });

  it('returns 403 for unauthorized role', async () => {
    const req = authedRequest('http://localhost/api/workers/w1', { role: 'supervisor1' });
    const res = await GET_BY_ID(req as any, { params: Promise.resolve({ id: 'w1' }) });
    const json = await res.json();

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/workers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkerFindUnique.mockResolvedValue(MOCK_WORKER_DETAIL);
    mockWorkerUpdate.mockResolvedValue({ ...MOCK_WORKER_DETAIL, name: 'Alice Updated' });
  });

  it('returns 200 and updates worker with edit permission', async () => {
    const req = authedRequest('http://localhost/api/workers/w1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Alice Updated' }),
      role: 'owner',
      user: 'owner',
    });
    const res = await PUT(req as any, { params: Promise.resolve({ id: 'w1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.name).toBe('Alice Updated');
    expect(mockWorkerUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'w1' },
        data: expect.objectContaining({ name: 'Alice Updated' }),
      })
    );
  });

  it('returns 403 for viewer role (no edit permission)', async () => {
    const req = authedRequest('http://localhost/api/workers/w1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Hacked' }),
      role: 'viewer',
    });
    const res = await PUT(req as any, { params: Promise.resolve({ id: 'w1' }) });

    expect(res.status).toBe(403);
    expect(mockWorkerUpdate).not.toHaveBeenCalled();
  });

  it('returns 404 when worker to update not found', async () => {
    mockWorkerFindUnique.mockResolvedValue(null);
    const req = authedRequest('http://localhost/api/workers/nonexistent', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Ghost' }),
      role: 'owner',
    });
    const res = await PUT(req as any, { params: Promise.resolve({ id: 'nonexistent' }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe('Worker not found');
  });
});

describe('DELETE /api/workers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkerFindUnique.mockResolvedValue(MOCK_WORKER_DETAIL);
    mockWorkerDailyEntryCount.mockResolvedValue(0);
    mockWorkerDelete.mockResolvedValue(MOCK_WORKER_DETAIL);
  });

  it('returns 200 and deletes worker with delete permission', async () => {
    const req = authedRequest('http://localhost/api/workers/w1', {
      method: 'DELETE',
      role: 'owner',
      user: 'owner',
    });
    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'w1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe('Worker deleted');
    expect(mockWorkerDelete).toHaveBeenCalledWith({ where: { id: 'w1' } });
  });

  it('returns 403 for viewer role (no delete permission)', async () => {
    const req = authedRequest('http://localhost/api/workers/w1', {
      method: 'DELETE',
      role: 'viewer',
    });
    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'w1' }) });

    expect(res.status).toBe(403);
    expect(mockWorkerDelete).not.toHaveBeenCalled();
  });

  it('returns 400 when worker has existing daily entries', async () => {
    mockWorkerDailyEntryCount.mockResolvedValue(5);
    const req = authedRequest('http://localhost/api/workers/w1', {
      method: 'DELETE',
      role: 'owner',
    });
    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'w1' }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Cannot delete worker with existing daily entries');
    expect(mockWorkerDelete).not.toHaveBeenCalled();
  });

  it('returns 500 on DB error during delete', async () => {
    mockWorkerDelete.mockRejectedValue(new Error('Foreign key'));
    const req = authedRequest('http://localhost/api/workers/w1', {
      method: 'DELETE',
      role: 'owner',
    });
    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'w1' }) });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to delete worker');
  });
});