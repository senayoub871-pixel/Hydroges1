import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { documentsTable } from "@workspace/db/schema";
import { eq, and, or } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.currentUser!.userId;
    const { status } = req.query as { status?: string };

    const userFilter = or(
      eq(documentsTable.senderId, userId),
      eq(documentsTable.recipientId, userId)
    );

    const conditions = [userFilter!];
    if (status) {
      conditions.push(eq(documentsTable.status, status));
    }

    const docs = await db
      .select()
      .from(documentsTable)
      .where(and(...conditions))
      .orderBy(documentsTable.createdAt);

    res.json(docs);
  } catch (err) {
    req.log.error({ err }, "Failed to get documents");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const currentUser = req.currentUser!;
    const { title, content, recipientId, scheduledAt, category, fileType, status: bodyStatus } = req.body;

    const recipient = await db.query.usersTable.findFirst({
      where: (u, { eq }) => eq(u.id, recipientId),
    });
    if (!recipient) {
      res.status(400).json({ error: "Recipient not found" });
      return;
    }

    const status = bodyStatus ?? (scheduledAt ? "scheduled" : "sent");

    const contentStr = content ?? "";
    const fileSizeKb = Math.round((contentStr.length / 1024) * 10) / 10 || 1;

    const [doc] = await db
      .insert(documentsTable)
      .values({
        title,
        content: contentStr,
        status,
        senderId: currentUser.userId,
        senderName: currentUser.name,
        recipientId,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        fileType: fileType || "PDF",
        fileSize: `${fileSizeKb} KB`,
        category: category || "Général",
      })
      .returning();

    res.status(201).json(doc);
  } catch (err) {
    req.log.error({ err }, "Failed to create document");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.currentUser!.userId;
    const doc = await db.query.documentsTable.findFirst({
      where: (d, { eq, and, or }) =>
        and(
          eq(d.id, id),
          or(eq(d.senderId, userId), eq(d.recipientId, userId))
        ),
    });
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    res.json(doc);
  } catch (err) {
    req.log.error({ err }, "Failed to get document");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.currentUser!.userId;
    const { title, content, recipientId, scheduledAt, status, category } = req.body;

    const existing = await db.query.documentsTable.findFirst({
      where: (d, { eq }) => eq(d.id, id),
    });
    if (!existing || existing.senderId !== userId) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (scheduledAt !== undefined)
      updates.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (status !== undefined) updates.status = status;
    if (category !== undefined) updates.category = category;
    if (recipientId !== undefined) {
      const recipient = await db.query.usersTable.findFirst({
        where: (u, { eq }) => eq(u.id, recipientId),
      });
      if (recipient) {
        updates.recipientId = recipientId;
        updates.recipientName = recipient.name;
        updates.recipientEmail = recipient.email;
      }
    }
    const [doc] = await db
      .update(documentsTable)
      .set(updates)
      .where(eq(documentsTable.id, id))
      .returning();
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    res.json(doc);
  } catch (err) {
    req.log.error({ err }, "Failed to update document");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.currentUser!.userId;
    const existing = await db.query.documentsTable.findFirst({
      where: (d, { eq }) => eq(d.id, id),
    });
    if (!existing || existing.senderId !== userId) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    await db.delete(documentsTable).where(eq(documentsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete document");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/sign", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.currentUser!.userId;
    const { signatureData, signatureX, signatureY } = req.body;

    const existing = await db.query.documentsTable.findFirst({
      where: (d, { eq }) => eq(d.id, id),
    });
    if (!existing) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    if (existing.senderId !== userId && existing.recipientId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const [doc] = await db
      .update(documentsTable)
      .set({
        signatureData,
        signatureX,
        signatureY,
        signedAt: new Date(),
        status: "sent",
        updatedAt: new Date(),
      })
      .where(eq(documentsTable.id, id))
      .returning();
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    res.json(doc);
  } catch (err) {
    req.log.error({ err }, "Failed to sign document");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/send", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.currentUser!.userId;
    const { scheduledAt } = req.body;

    const existing = await db.query.documentsTable.findFirst({
      where: (d, { eq }) => eq(d.id, id),
    });
    if (!existing || existing.senderId !== userId) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const status = scheduledAt ? "scheduled" : "sent";
    const [doc] = await db
      .update(documentsTable)
      .set({
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        updatedAt: new Date(),
      })
      .where(eq(documentsTable.id, id))
      .returning();
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    res.json(doc);
  } catch (err) {
    req.log.error({ err }, "Failed to send document");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
