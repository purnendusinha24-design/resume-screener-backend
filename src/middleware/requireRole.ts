import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export function requireRole(allowed: Array<"admin" | "recruiter">) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowed.includes(req.role as any)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}
