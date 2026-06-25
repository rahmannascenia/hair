import { describe, it, expect, beforeEach } from 'vitest';
import { mockAuditLogCreate } from './mocks';
import { POST } from '../auth/route';

// Mock @/lib/db — the auth route does a dynamic import for audit logging
// The vi.mock from mocks.ts should intercept both static and dynamic imports,
// but we re-declare here to be explicit and ensure it's set up for this file's
// dependency tree (the dynamic `await import('@/lib/db')` in auth/route.ts).
vi.mock('@/lib/db', () => ({
  db: {
    auditLog: {
      create: mockAuditLogCreate,
    },
  },
}));

describe('POST /api/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure audit log create doesn't throw
    mockAuditLogCreate.mockResolvedValue(undefined);
  });

  it('returns 200 with user data and roleKey for valid credentials (owner)', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'owner', password: 'owner123' }),
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user.username).toBe('owner');
    expect(json.user.roleKey).toBe('owner');
    expect(json.user.role).toBe('Owner');
    expect(json.user.displayName).toBe('Owner');
  });

  it('returns 200 with user data for valid credentials (pm)', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'pm', password: 'pm123' }),
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user.roleKey).toBe('pm');
    expect(json.user.role).toBe('Project Manager');
  });

  it('returns 200 with user data for valid credentials (viewer)', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'viewer', password: 'viewer123' }),
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user.roleKey).toBe('viewer');
    expect(json.user.role).toBe('Viewer');
  });

  it('returns 401 for invalid password', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'owner', password: 'wrongpassword' }),
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Invalid credentials');
  });

  it('returns 401 for non-existent username', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'nonexistent', password: 'anything' }),
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Invalid credentials');
  });

  it('returns 400 when username is missing', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password: 'owner123' }),
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Username and password are required');
  });

  it('returns 400 when password is missing', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'owner' }),
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Username and password are required');
  });

  it('returns 400 for empty body / non-JSON request', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: '',
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid request body');
  });

  it('writes audit log entry on successful login', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    await POST(req as any);

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entity: 'Auth',
        action: 'CREATE',
        performedBy: 'admin',
      }),
    });
  });

  it('login still succeeds even if audit log write fails', async () => {
    mockAuditLogCreate.mockRejectedValue(new Error('Audit DB down'));
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'owner', password: 'owner123' }),
    });
    const res = await POST(req as any);
    const json = await res.json();

    // Login should still succeed — audit failure is caught and ignored
    expect(res.status).toBe(200);
    expect(json.user.roleKey).toBe('owner');
  });
});