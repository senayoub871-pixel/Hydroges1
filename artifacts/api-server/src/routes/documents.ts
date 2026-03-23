import { Router, type IRouter } from "express";
import { db, documentsTable, usersTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import QRCode from "qrcode";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";
import { CreateDocumentBody, UpdateDocumentBody, ListDocumentsQueryParams } from "@workspace/api-zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router: IRouter = Router();

async function formatDocument(doc: typeof documentsTable.$inferSelect) {
  const fromUser = await db.select().from(usersTable).where(eq(usersTable.id, doc.fromUserId)).limit(1);
  let toUser = null;
  if (doc.toUserId) {
    const toUserRows = await db.select().from(usersTable).where(eq(usersTable.id, doc.toUserId)).limit(1);
    if (toUserRows.length) {
      toUser = {
        id: toUserRows[0].id,
        firstName: toUserRows[0].firstName,
        lastName: toUserRows[0].lastName,
        jobTitle: toUserRows[0].jobTitle,
        department: toUserRows[0].department,
        username: toUserRows[0].username,
      };
    }
  }

  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    fileUrl: doc.fileUrl,
    fileName: doc.fileName,
    status: doc.status,
    fromUserId: doc.fromUserId,
    toUserId: doc.toUserId,
    fromUser: fromUser.length
      ? {
          id: fromUser[0].id,
          firstName: fromUser[0].firstName,
          lastName: fromUser[0].lastName,
          jobTitle: fromUser[0].jobTitle,
          department: fromUser[0].department,
          username: fromUser[0].username,
        }
      : null,
    toUser,
    hasSignature: doc.hasSignature,
    qrCodeUrl: doc.qrCodeUrl,
    scheduledAt: doc.scheduledAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { type } = req.query as { type?: string };

  let conditions;

  if (type === "inbox") {
    conditions = and(eq(documentsTable.toUserId, userId), eq(documentsTable.status, "sent"));
  } else if (type === "sent") {
    conditions = and(eq(documentsTable.fromUserId, userId), eq(documentsTable.status, "sent"));
  } else if (type === "pending_validation") {
    conditions = and(
      eq(documentsTable.fromUserId, userId),
      eq(documentsTable.status, "pending_validation")
    );
  } else if (type === "drafts") {
    conditions = and(eq(documentsTable.fromUserId, userId), eq(documentsTable.status, "draft"));
  } else if (type === "scheduled") {
    conditions = and(eq(documentsTable.fromUserId, userId), eq(documentsTable.status, "scheduled"));
  } else if (type === "outbox") {
    conditions = eq(documentsTable.fromUserId, userId);
  } else {
    conditions = or(eq(documentsTable.fromUserId, userId), eq(documentsTable.toUserId, userId));
  }

  const docs = conditions
    ? await db.select().from(documentsTable).where(conditions)
    : await db.select().from(documentsTable);

  const formatted = await Promise.all(docs.map(formatDocument));
  res.json(formatted);
});

router.post("/upload", requireAuth, upload.single("file"), async (req: AuthenticatedRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file", message: "Aucun fichier fourni" });
    return;
  }

  const fileUrl = `/api/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, fileName: req.file.originalname });
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [doc] = await db
    .insert(documentsTable)
    .values({
      title: data.title,
      content: data.content ?? null,
      fileUrl: data.fileUrl ?? null,
      fileName: data.fileName ?? null,
      status: data.status,
      fromUserId: req.userId!,
      toUserId: data.toUserId ?? null,
      hasSignature: data.hasSignature ?? false,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    })
    .returning();

  res.status(201).json(await formatDocument(doc));
});

router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = parseInt(String(req.params.id));
  const userId = req.userId!;

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id)).limit(1);

  if (!doc) {
    res.status(404).json({ error: "Not found", message: "Document introuvable" });
    return;
  }

  if (doc.fromUserId !== userId && doc.toUserId !== userId) {
    res.status(403).json({ error: "Forbidden", message: "Accès refusé" });
    return;
  }

  res.json(await formatDocument(doc));
});

router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = parseInt(String(req.params.id));
  const userId = req.userId!;

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id)).limit(1);
  if (!doc || doc.fromUserId !== userId) {
    res.status(404).json({ error: "Not found", message: "Document introuvable" });
    return;
  }

  const parsed = UpdateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updates: Partial<typeof documentsTable.$inferInsert> = { updatedAt: new Date() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.content !== undefined) updates.content = data.content ?? null;
  if (data.fileUrl !== undefined) updates.fileUrl = data.fileUrl ?? null;
  if (data.fileName !== undefined) updates.fileName = data.fileName ?? null;
  if (data.toUserId !== undefined) updates.toUserId = data.toUserId ?? null;
  if (data.hasSignature !== undefined) updates.hasSignature = data.hasSignature;
  if (data.status !== undefined) updates.status = data.status;
  if (data.scheduledAt !== undefined) updates.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;

  const [updated] = await db.update(documentsTable).set(updates).where(eq(documentsTable.id, id)).returning();
  res.json(await formatDocument(updated));
});

router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = parseInt(String(req.params.id));
  const userId = req.userId!;

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id)).limit(1);
  if (!doc || doc.fromUserId !== userId) {
    res.status(404).json({ error: "Not found", message: "Document introuvable" });
    return;
  }

  await db.delete(documentsTable).where(eq(documentsTable.id, id));
  res.json({ success: true, message: "Document supprimé" });
});

router.post("/:id/send", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = parseInt(String(req.params.id));
  const userId = req.userId!;

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id)).limit(1);
  if (!doc || doc.fromUserId !== userId) {
    res.status(404).json({ error: "Not found", message: "Document introuvable" });
    return;
  }

  const [updated] = await db
    .update(documentsTable)
    .set({ status: "sent", updatedAt: new Date() })
    .where(eq(documentsTable.id, id))
    .returning();

  res.json(await formatDocument(updated));
});

router.post("/:id/validate", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = parseInt(String(req.params.id));
  const userId = req.userId!;

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id)).limit(1);
  if (!doc || (doc.fromUserId !== userId && doc.toUserId !== userId)) {
    res.status(404).json({ error: "Not found", message: "Document introuvable" });
    return;
  }

  const qrData = JSON.stringify({ docId: doc.id, title: doc.title, validatedAt: new Date().toISOString() });
  const qrFileName = `qr-${doc.id}-${Date.now()}.png`;
  const qrPath = path.join(uploadsDir, qrFileName);
  await QRCode.toFile(qrPath, qrData);

  const qrCodeUrl = `/api/uploads/${qrFileName}`;

  const [updated] = await db
    .update(documentsTable)
    .set({ status: "validated", qrCodeUrl, updatedAt: new Date() })
    .where(eq(documentsTable.id, id))
    .returning();

  res.json(await formatDocument(updated));
});

export default router;
