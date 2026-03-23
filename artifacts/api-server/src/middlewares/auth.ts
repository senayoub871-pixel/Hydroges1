import { type Request, type Response, type NextFunction } from "express";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  userId?: number;
  user?: typeof usersTable.$inferSelect;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.["session_token"];
  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "Not authenticated" });
    return;
  }

  const session = await db
    .select()
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.token, token),
        gt(sessionsTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session.length) {
    res.status(401).json({ error: "Unauthorized", message: "Session expired or invalid" });
    return;
  }

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session[0].userId))
    .limit(1);

  if (!user.length) {
    res.status(401).json({ error: "Unauthorized", message: "User not found" });
    return;
  }

  req.userId = user[0].id;
  req.user = user[0];
  next();
}
