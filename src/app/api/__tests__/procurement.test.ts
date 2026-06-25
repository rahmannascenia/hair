import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockProcurementFindMany,
  mockProcurementCount,
  mockProcurementCreate,
  mockAuditLogCreate,
} from './mocks';
import { authedRequest, unauthedRequest } from './mocks';
import { GET, POST } from '../procurement/route';

// Mock writeAuditLog to avoid side effects
vi.mock('@/lib/audit', async () => {
  const actual = await vi.importActual('@/lib/audit');
  return {
    ...actual,
    writeAuditLog: vi.fn().mockResolvedValue(undefined),
  };
});

const MOCK_PROCUREMENTS = [
  {
    id: 'p1',
    voucherNo: 'V-001',
    date: '2025-01-15T00:00:00.000Z',
    supplierId: 's1',
    originCountry: 'India',
    rawWeightKg: 1000,
    status: 'Received',
    lcNo: null,
    supplier: { id: 's1', name: 'Supplier A' },
    lots: [],
  },
  {
    id: 'p2',
    voucherNo: 'V-002',
    date: '2025-01-14T00:00:00.000Z',
    supplierId: 's2',
    originCountry: 'China',
    rawWeightKg: 500,
    status: 'Pending Approval',
    lcNo: 'LC-001',
    supplier: { id: 's2', name: 'Supplier B' },
    lots: [],
  },
];

describe('GET /api/procurement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcurementFindMany.mockResolvedValue(MOCK_PROCUREMENTS);
    mockProcurementCount.mockResolvedValue(2);
  });

  it('returns 200 and procurement list for owner', async () => {
    const req = authedRequest('http://localhost/api/procurement', {
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
  });

  it('returns 403 for supervisor1 (no procurement access)', async () => {
    const req = authedRequest('http://localhost/api/procurement', {
      role: 'supervisor1',
      user: 'sup1',
    });
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('supervisor1');
  });

  it('returns 403 for qc1 (no procurement access)', async () => {
    const req = authedRequest('http://localhost/api/procurement', {
      role: 'qc1',
      user: 'qc1',
    });
    const res = await GET(req as any);

    expect(res.status).toBe(403);
  });

  it('returns 403 when no auth headers', async () => {
    const req = unauthedRequest('http://localhost/api/procurement');
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('Authentication required');
  });

  it('returns 200 for accountant (has procurement view)', async () => {
    const req = authedRequest('http://localhost/api/procurement', {
      role: 'accountant',
      user: 'acc1',
    });
    const res = await GET(req as any);

    expect(res.status).toBe(200);
  });

  it('returns 200 for pm (has procurement view/edit)', async () => {
    const req = authedRequest('http://localhost/api/procurement', {
      role: 'pm',
      user: 'pm',
    });
    const res = await GET(req as any);

    expect(res.status).toBe(200);
  });

  it('returns 200 for viewer (has procurement view)', async () => {
    const req = authedRequest('http://localhost/api/procurement', {
      role: 'viewer',
      user: 'viewer1',
    });
    const res = await GET(req as any);

    expect(res.status).toBe(200);
  });

  it('filters by status', async () => {
    const req = authedRequest('http://localhost/api/procurement?status=Received');
    await GET(req as any);

    expect(mockProcurementFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'Received' }),
      })
    );
  });

  it('filters by supplierId', async () => {
    const req = authedRequest('http://localhost/api/procurement?supplierId=s1');
    await GET(req as any);

    expect(mockProcurementFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ supplierId: 's1' }),
      })
    );
  });

  it('filters import vs local via isImport', async () => {
    const req = authedRequest('http://localhost/api/procurement?isImport=true');
    await GET(req as any);

    expect(mockProcurementFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ lcNo: { not: null } }),
      })
    );
  });

  it('filters local (non-import) via isImport=false', async () => {
    const req = authedRequest('http://localhost/api/procurement?isImport=false');
    await GET(req as any);

    expect(mockProcurementFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ lcNo: null }),
      })
    );
  });

  it('searches across voucherNo, lcNo, originCountry', async () => {
    const req = authedRequest('http://localhost/api/procurement?search=India');
    await GET(req as any);

    expect(mockProcurementFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { voucherNo: { contains: 'India' } },
            { lcNo: { contains: 'India' } },
            { originCountry: { contains: 'India' } },
          ],
        }),
      })
    );
  });

  it('supports pagination', async () => {
    const req = authedRequest('http://localhost/api/procurement?page=3&limit=25');
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.pagination.page).toBe(3);
    expect(json.pagination.limit).toBe(25);

    expect(mockProcurementFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 50, take: 25 })
    );
  });

  it('returns 500 on DB error', async () => {
    mockProcurementFindMany.mockRejectedValue(new Error('DB down'));
    const req = authedRequest('http://localhost/api/procurement');
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to fetch procurements');
  });
});

describe('POST /api/procurement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const LOCAL_PROCUREMENT_BODY = {
    voucherNo: 'V-100',
    date: '2025-02-01',
    supplierId: 's1',
    originCountry: 'Bangladesh',
    rawWeightKg: 800,
    costPerKgBdt: 150,
    status: 'Received',
  };

  const IMPORT_PROCUREMENT_BODY = {
    voucherNo: 'V-200',
    date: '2025-02-01',
    supplierId: 's2',
    originCountry: 'India',
    rawWeightKg: 1000,
    usdPerKg: 5.0,
    lcNo: 'LC-100',
    status: 'Received',
  };

  it('returns 201 and creates local procurement for owner', async () => {
    const created = { id: 'p-new', ...LOCAL_PROCUREMENT_BODY, supplier: { id: 's1', name: 'Supplier A' } };
    mockProcurementCreate.mockResolvedValue(created);

    const req = authedRequest('http://localhost/api/procurement', {
      method: 'POST',
      body: JSON.stringify(LOCAL_PROCUREMENT_BODY),
      role: 'owner',
      user: 'owner',
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.id).toBe('p-new');
    expect(json.voucherNo).toBe('V-100');
    expect(mockProcurementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          voucherNo: 'V-100',
          originCountry: 'Bangladesh',
        }),
      })
    );
  });

  it('calculates import landed costs automatically', async () => {
    const created = { id: 'p-import', ...IMPORT_PROCUREMENT_BODY, supplier: null };
    mockProcurementCreate.mockResolvedValue(created);

    const req = authedRequest('http://localhost/api/procurement', {
      method: 'POST',
      body: JSON.stringify(IMPORT_PROCUREMENT_BODY),
      role: 'owner',
      user: 'owner',
    });
    await POST(req as any);

    // Import with usdPerKg=5, rawWeightKg=1000:
    // goodsUsd = 5000, freightUsd = 150, dutyUsd = 600, bankChargesUsd = 50
    // landedUsd = 5800, fxRate = 120 (default), totalLandedCostBdt = 696000
    expect(mockProcurementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          goodsUsd: 5000,
          freightUsd: 150,
          dutyUsd: 600,
          bankChargesUsd: 50,
          landedUsd: 5800,
          totalLandedCostBdt: 696000,
          fxRate: 120,
        }),
      })
    );
  });

  it('returns 200 for pm (has procurement create)', async () => {
    const created = { id: 'p-pm', ...LOCAL_PROCUREMENT_BODY, supplier: null };
    mockProcurementCreate.mockResolvedValue(created);

    const req = authedRequest('http://localhost/api/procurement', {
      method: 'POST',
      body: JSON.stringify(LOCAL_PROCUREMENT_BODY),
      role: 'pm',
      user: 'pm',
    });
    const res = await POST(req as any);

    expect(res.status).toBe(201);
    expect(mockProcurementCreate).toHaveBeenCalled();
  });

  it('returns 403 for viewer (no procurement create)', async () => {
    const req = authedRequest('http://localhost/api/procurement', {
      method: 'POST',
      body: JSON.stringify(LOCAL_PROCUREMENT_BODY),
      role: 'viewer',
      user: 'viewer1',
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('viewer');
    expect(mockProcurementCreate).not.toHaveBeenCalled();
  });

  it('returns 403 for supervisor1 (no procurement access at all)', async () => {
    const req = authedRequest('http://localhost/api/procurement', {
      method: 'POST',
      body: JSON.stringify(LOCAL_PROCUREMENT_BODY),
      role: 'supervisor1',
      user: 'sup1',
    });
    const res = await POST(req as any);

    expect(res.status).toBe(403);
  });

  it('returns 403 when no auth headers', async () => {
    const req = new Request('http://localhost/api/procurement', {
      method: 'POST',
      body: JSON.stringify(LOCAL_PROCUREMENT_BODY),
    });
    const res = await POST(req as any);

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    mockProcurementCreate.mockRejectedValue(new Error('Constraint violation'));
    const req = authedRequest('http://localhost/api/procurement', {
      method: 'POST',
      body: JSON.stringify(LOCAL_PROCUREMENT_BODY),
      role: 'owner',
    });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to create procurement');
  });
});