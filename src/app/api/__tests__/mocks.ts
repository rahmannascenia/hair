import { vi } from 'vitest';

// Worker model mocks
export const mockWorkerFindMany = vi.fn();
export const mockWorkerFindUnique = vi.fn();
export const mockWorkerCreate = vi.fn();
export const mockWorkerUpdate = vi.fn();
export const mockWorkerDelete = vi.fn();
export const mockWorkerCount = vi.fn();

// Procurement model mocks
export const mockProcurementFindMany = vi.fn();
export const mockProcurementFindUnique = vi.fn();
export const mockProcurementCreate = vi.fn();
export const mockProcurementUpdate = vi.fn();
export const mockProcurementDelete = vi.fn();
export const mockProcurementCount = vi.fn();

// AuditLog model mocks
export const mockAuditLogFindMany = vi.fn();
export const mockAuditLogCreate = vi.fn();
export const mockAuditLogCreateMany = vi.fn();
export const mockAuditLogCount = vi.fn();
export const mockAuditLogGroupBy = vi.fn();

// WorkerDailyEntry model mocks (used by DELETE worker)
export const mockWorkerDailyEntryCount = vi.fn();

// Factory model mocks
export const mockFactoryFindMany = vi.fn();
export const mockFactoryFindUnique = vi.fn();

// Supplier model mocks
export const mockSupplierFindMany = vi.fn();
export const mockSupplierFindUnique = vi.fn();

// Lot model mocks
export const mockLotFindMany = vi.fn();
export const mockLotFindUnique = vi.fn();

export const mockDb = {
  worker: {
    findMany: mockWorkerFindMany,
    findUnique: mockWorkerFindUnique,
    create: mockWorkerCreate,
    update: mockWorkerUpdate,
    delete: mockWorkerDelete,
    count: mockWorkerCount,
  },
  procurement: {
    findMany: mockProcurementFindMany,
    findUnique: mockProcurementFindUnique,
    create: mockProcurementCreate,
    update: mockProcurementUpdate,
    delete: mockProcurementDelete,
    count: mockProcurementCount,
  },
  auditLog: {
    findMany: mockAuditLogFindMany,
    create: mockAuditLogCreate,
    createMany: mockAuditLogCreateMany,
    count: mockAuditLogCount,
    groupBy: mockAuditLogGroupBy,
  },
  workerDailyEntry: {
    count: mockWorkerDailyEntryCount,
  },
  factory: {
    findMany: mockFactoryFindMany,
    findUnique: mockFactoryFindUnique,
  },
  supplier: {
    findMany: mockSupplierFindMany,
    findUnique: mockSupplierFindUnique,
  },
  lot: {
    findMany: mockLotFindMany,
    findUnique: mockLotFindUnique,
  },
};

// Mock @/lib/db — this is hoisted by vitest
vi.mock('@/lib/db', () => ({ db: mockDb }));

// Helper to create authed request
export function authedRequest(
  url: string,
  options: RequestInit & { role?: string; user?: string } = {}
): Request {
  const { role = 'owner', user = 'owner', ...rest } = options;
  return new Request(url, {
    ...rest,
    headers: {
      'x-erp-role': role,
      'x-erp-user': user,
      ...rest.headers,
    },
  });
}

// Helper to create unauthed request
export function unauthedRequest(url: string, options: RequestInit = {}): Request {
  return new Request(url, options);
}