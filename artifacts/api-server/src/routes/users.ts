import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { generateSalt, hashPassword } from "../lib/auth";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.name);
    res.json(users);
  } catch (err) {
    req.log.error({ err }, "Failed to get users");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { adminSecret, loginId, newPassword } = req.body;
    const expected = process.env.ADMIN_SECRET || "hydroges-admin-2024";
    if (adminSecret !== expected) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const salt = generateSalt();
    const hash = hashPassword(newPassword, salt);
    const [user] = await db
      .update(usersTable)
      .set({ passwordHash: hash, passwordSalt: salt })
      .where(eq(usersTable.loginId, loginId))
      .returning({ id: usersTable.id, name: usersTable.name, loginId: usersTable.loginId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ ok: true, user });
  } catch (err) {
    req.log.error({ err }, "Failed to reset password");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
