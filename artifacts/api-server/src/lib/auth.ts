import { createHmac, pbkdf2Sync, randomBytes } from "crypto";

const JWT_SECRET =
  process.env.JWT_SECRET ?? "hydroges-internal-dev-secret-2024-hydroges";

export interface JwtPayload {
  userId: number;
  loginId: string;
  name: string;
  role: string;
  department: string;
  companyNumber: string;
  iat?: number;
}

function b64url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

export function signJwt(payload: Omit<JwtPayload, "iat">): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })
  );
  const sig = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as JwtPayload;
  } catch {
    return null;
  }
}

export function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 10000, 32, "sha256").toString("hex");
}

export function verifyPassword(
  password: string,
  salt: string,
  hash: string
): boolean {
  return hashPassword(password, salt) === hash;
}
