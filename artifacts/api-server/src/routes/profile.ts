import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.currentUser!.userId;
    const user = await db.query.usersTable.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { passwordHash, passwordSalt, ...safe } = user;
    res.json(safe);
  } catch (err) {
    req.log.error({ err }, "Failed to get profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/", requireAuth, async (req, res) => {
  try {
    const userId = req.currentUser!.userId;
    const { signatureImage } = req.body;

    const [user] = await db
      .update(usersTable)
      .set({ signatureImage: signatureImage ?? null })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { passwordHash, passwordSalt, ...safe } = user;
    res.json(safe);
  } catch (err) {
    req.log.error({ err }, "Failed to update profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
