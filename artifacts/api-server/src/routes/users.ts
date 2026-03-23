import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

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
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router: IRouter = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.companyNetwork, user.companyNetwork));

  res.json(
    users
      .filter((u) => u.id !== user.id)
      .map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        jobTitle: u.jobTitle,
        department: u.department,
        username: u.username,
      }))
  );
});

router.post("/signature", requireAuth, upload.single("file"), async (req: AuthenticatedRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file", message: "Aucun fichier fourni" });
    return;
  }

  const fileUrl = `/api/uploads/${req.file.filename}`;

  await db
    .update(usersTable)
    .set({ signatureUrl: fileUrl })
    .where(eq(usersTable.id, req.userId!));

  res.json({ url: fileUrl, fileName: req.file.originalname });
});

export default router;
