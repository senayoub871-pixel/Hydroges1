import { Router, type IRouter } from "express";
import { db, usersTable, sessionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { companyNetwork, firstName, lastName, jobTitle, department, email, username, password, confirmPassword, signatureUrl } = parsed.data;

  if (password !== confirmPassword) {
    res.status(400).json({ error: "Validation error", message: "Passwords do not match" });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.companyNetwork, companyNetwork), eq(usersTable.username, username)))
    .limit(1);

  if (existing.length) {
    res.status(409).json({ error: "Conflict", message: "Username already exists in this company network" });
    return;
  }

  const emailExists = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (emailExists.length) {
    res.status(409).json({ error: "Conflict", message: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({
      companyNetwork,
      firstName,
      lastName,
      jobTitle,
      department,
      email,
      username,
      passwordHash,
      signatureUrl: signatureUrl ?? null,
    })
    .returning();

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: user.id, token, expiresAt });

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("session_token", token, {
    httpOnly: true,
    expires: expiresAt,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  });

  res.status(201).json({
    user: {
      id: user.id,
      companyNetwork: user.companyNetwork,
      firstName: user.firstName,
      lastName: user.lastName,
      jobTitle: user.jobTitle,
      department: user.department,
      email: user.email,
      username: user.username,
      signatureUrl: user.signatureUrl,
      createdAt: user.createdAt,
    },
    message: "Compte créé avec succès",
  });
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { companyNetwork, username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.companyNetwork, companyNetwork), eq(usersTable.username, username)))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "Identifiants invalides" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Unauthorized", message: "Identifiants invalides" });
    return;
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: user.id, token, expiresAt });

  const isProd = process.env.NODE_ENV === "production";
  res.cookie("session_token", token, {
    httpOnly: true,
    expires: expiresAt,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });

  res.json({
    user: {
      id: user.id,
      companyNetwork: user.companyNetwork,
      firstName: user.firstName,
      lastName: user.lastName,
      jobTitle: user.jobTitle,
      department: user.department,
      email: user.email,
      username: user.username,
      signatureUrl: user.signatureUrl,
      createdAt: user.createdAt,
    },
    message: "Connexion réussie",
  });
});

router.post("/logout", requireAuth, async (req: AuthenticatedRequest, res) => {
  const token = req.cookies?.["session_token"];
  if (token) {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
    res.clearCookie("session_token");
  }
  res.json({ success: true, message: "Déconnexion réussie" });
});

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  res.json({
    id: user.id,
    companyNetwork: user.companyNetwork,
    firstName: user.firstName,
    lastName: user.lastName,
    jobTitle: user.jobTitle,
    department: user.department,
    email: user.email,
    username: user.username,
    signatureUrl: user.signatureUrl,
    createdAt: user.createdAt,
  });
});

export default router;
