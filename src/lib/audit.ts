/**
 * Hairlan International ERP — Audit Logging Utility
 *
 * Every data change (CREATE, UPDATE, DELETE) is logged with:
 * - entity: The model/table name
 * - entityId: The record's ID
 * - action: CREATE | UPDATE | DELETE
 * - oldValues: JSON string of previous values (for UPDATE/DELETE)
 * - newValues: JSON string of new values (for CREATE/UPDATE)
 * - performedBy: Username of the person who made the change
 *
 * Based on Combined_transcription 6.4: Every data change logged, viewable per record.
 */

import { db } from './db';
import { hasPermission, canViewFullAuditLog } from './permissions';

interface AuditParams {
  entity: string;
  entityId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  performedBy?: string;
}

/**
 * Write an audit log entry
 * This should be called from every API route that modifies data
 */
export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        entity: params.entity,
        entityId: params.entityId || null,
        action: params.action,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValues: params.newValues ? JSON.stringify(params.newValues) : null,
        performedBy: params.performedBy || 'system',
      },
    });
  } catch (error) {
    // Audit log failure should never break the main operation
    console.error('[AuditLog] Failed to write audit log:', error);
  }
}

/**
 * Write audit logs for bulk operations (e.g., batch updates)
 */
export async function writeBulkAuditLogs(params: AuditParams[]): Promise<void> {
  try {
    await db.auditLog.createMany({
      data: params.map(p => ({
        entity: p.entity,
        entityId: p.entityId || null,
        action: p.action,
        oldValues: p.oldValues ? JSON.stringify(p.oldValues) : null,
        newValues: p.newValues ? JSON.stringify(p.newValues) : null,
        performedBy: p.performedBy || 'system',
      })),
    });
  } catch (error) {
    console.error('[AuditLog] Failed to write bulk audit logs:', error);
  }
}

/**
 * Get the changed fields between old and new values (for UPDATE operations)
 * Returns only the fields that actually changed
 */
export function getChangedFields(
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): { oldValues: Record<string, unknown>; newValues: Record<string, unknown> } {
  const changedOld: Record<string, unknown> = {};
  const changedNew: Record<string, unknown> = {};

  for (const key of Object.keys(newValues)) {
    const oldVal = oldValues[key];
    const newVal = newValues[key];

    // Skip fields that haven't changed
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changedOld[key] = oldVal;
      changedNew[key] = newVal;
    }
  }

  return { oldValues: changedOld, newValues: changedNew };
}

/**
 * Check if a user can view a specific audit log entry
 * Based on transcription 6.4: Only Owner/Accountant see full trail; others see own changes only
 */
export function canViewAuditEntry(requestingRole: string, performedBy?: string, requestUsername?: string): boolean {
  if (canViewFullAuditLog(requestingRole)) return true;
  // Others can only see their own changes
  return performedBy === requestUsername;
}

/**
 * Extract username from request headers or body
 */
export function getActorFromRequest(request: Request): string {
  // Try header first (set by auth middleware)
  const headerUser = request.headers.get('x-erp-user');
  if (headerUser) return headerUser;

  // Fallback: try body for POST/PATCH/PUT
  // Note: We don't consume the body here since it may be needed by the caller
  return 'anonymous';
}

/**
 * Permission check helper for API routes
 * Returns true if the role has the required permission, false otherwise
 * Also returns a helpful error message if permission is denied
 */
export function checkPermission(
  role: string,
  section: string,
  permission: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'
): { allowed: boolean; error?: string } {
  if (!role || role === 'anonymous') {
    return { allowed: false, error: 'Authentication required' };
  }

  const allowed = hasPermission(role, section as any, permission);
  if (!allowed) {
    return {
      allowed: false,
      error: `Role '${role}' does not have '${permission}' permission for '${section}'`,
    };
  }

  return { allowed: true };
}