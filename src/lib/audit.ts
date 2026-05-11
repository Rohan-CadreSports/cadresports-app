import { db } from "@/lib/db";

export async function logAudit({
  action,
  userId,
  userName,
  entityType,
  entityId,
  before,
  after,
  metadata,
}: {
  action: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}) {
  try {
    await db.auditLog.create({
      data: {
        action,
        userId,
        userName,
        entityType,
        entityId,
        before: before ? JSON.parse(JSON.stringify(before)) : null,
        after: after ? JSON.parse(JSON.stringify(after)) : null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    });
  } catch {
    // Don't crash the app if audit logging fails
  }
}
