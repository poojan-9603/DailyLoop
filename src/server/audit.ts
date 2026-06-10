import { db } from "@/server/db";

/**
 * Write an AuditLog row for a mutating action. Per CLAUDE.md, every mutating
 * action should call this. Failures are swallowed (logging must never break the
 * user-facing action) but reported to the console.
 */
export async function audit(
  userId: string | null | undefined,
  action: string,
  entity: string,
  entityId?: string | null,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write audit log", { action, entity, err });
  }
}
