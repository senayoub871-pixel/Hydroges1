import { Request, Response, NextFunction } from "express";
import { verifyJwt, JwtPayload } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      currentUser?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const token = auth.slice(7);
  const payload = verifyJwt(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.currentUser = payload;
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    const payload = verifyJwt(token);
    if (payload) req.currentUser = payload;
  }
  next();
}
