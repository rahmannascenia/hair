/**
 * Global fetch wrapper that adds auth headers to all ERP API calls.
 * Components should use this instead of raw fetch() to ensure:
 * 1. Role-based permission headers are sent
 * 2. Audit trail actor is identified
 */

let getUser: (() => { username?: string; roleKey?: string } | null) | null = null;

/**
 * Initialize with the store's user getter (called once from app init)
 */
export function initApiClient(getUserFn: () => { username?: string; roleKey?: string } | null) {
  getUser = getUserFn;
}

/**
 * Authenticated fetch - adds x-erp-role and x-erp-user headers automatically
 */
export function erpFetch(url: string, options: RequestInit = {}): Response {
  const headers = new Headers(options.headers || {});
  
  if (getUser) {
    const user = getUser();
    if (user?.roleKey) headers.set('x-erp-role', user.roleKey);
    if (user?.username) headers.set('x-erp-user', user.username);
  }

  return fetch(url, { ...options, headers });
}

/**
 * Async version for convenience with await
 */
export async function erpFetchAsync(url: string, options: RequestInit = {}): Promise<Response> {
  return erpFetch(url, options);
}