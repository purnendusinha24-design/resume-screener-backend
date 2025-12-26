import express, { Response } from "express";
import cors from "cors";
import multer from "multer";
import { PrismaClient } from "@prisma/client";

import { authMiddleware, AuthRequest } from "./middleware/auth";
import { requireRole } from "./middleware/requireRole";
import { extractTextFromPDF } from "./utils/pdfParser";
import { scoreSalesFresherResume } from "./scoring/salesFresherScorer";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

/* =========================
   HEALTH CHECKS
========================= */

app.get("/", (_req, res) => {
  res.send("Backend running");
});

app.get(
  "/health/protected",
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    res.json({
      message: "Protected route working",
      userId: req.userId,
      companyId: req.companyId,
      role: req.role,
    });
  }
);

/* =========================
   BATCH ROUTES (RBAC)
========================= */

// CREATE BATCH — ADMIN ONLY
app.post(
  "/batch",
  authMiddleware,
  requireRole(["admin"]),
  async (req: AuthRequest, res: Response) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Batch name is required" });
    }

    const batch = await prisma.batch.create({
      data: {
        name,
        companyId: req.companyId!,
        createdBy: req.userId!,
      },
    });

    res.status(201).json(batch);
  }
);

// GET ALL BATCHES — ADMIN + RECRUITER
app.get(
  "/batch",
  authMiddleware,
  requireRole(["admin", "recruiter"]),
  async (req: AuthRequest, res: Response) => {
    const batches = await prisma.batch.findMany({
      where: { companyId: req.companyId! },
      orderBy: { createdAt: "desc" },
    });

    res.json(batches);
  }
);

// GET BATCH RESULTS — ADMIN + RECRUITER
app.get(
  "/batch/:batchId/results",
  authMiddleware,
  requireRole(["admin", "recruiter"]),
  async (req: AuthRequest, res: Response) => {
    const { batchId } = req.params;

    const batch = await prisma.batch.findFirst({
      where: {
        id: batchId,
        companyId: req.companyId!,
      },
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const candidates = await prisma.candidate.findMany({
      where: {
        batchId,
        companyId: req.companyId!,
      },
      orderBy: { score: "desc" },
    });

    res.json({ rankedCandidates: candidates });
  }
);

/* =========================
   DASHBOARD STATS — ADMIN + RECRUITER
========================= */

app.get(
  "/api/stats",
  authMiddleware,
  requireRole(["admin", "recruiter"]),
  async (req: AuthRequest, res: Response) => {
    const { batchId } = req.query;

    if (!batchId || typeof batchId !== "string") {
      return res.status(400).json({ error: "batchId required" });
    }

    const batch = await prisma.batch.findFirst({
      where: {
        id: batchId,
        companyId: req.companyId!,
      },
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const candidates = await prisma.candidate.findMany({
      where: {
        batchId,
        companyId: req.companyId!,
      },
      select: { decision: true },
    });

    const stats = {
      total: candidates.length,
      shortlisted: candidates.filter(c => c.decision === "hire").length,
      rejected: candidates.filter(c => c.decision === "reject").length,
      pending: candidates.filter(c => c.decision === "maybe").length,
    };

    res.json(stats);
  }
);

/* =========================
   RESUME UPLOAD — ADMIN + RECRUITER
========================= */

app.post(
  "/resume/upload",
  authMiddleware,
  requireRole(["admin", "recruiter"]),
  upload.single("resume"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { batchId } = req.body;

      if (!batchId) {
        return res.status(400).json({ error: "batchId is required" });
      }

      const batch = await prisma.batch.findFirst({
        where: {
          id: batchId,
          companyId: req.companyId!,
        },
      });

      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      const rawText = await extractTextFromPDF(req.file.path);
      const scoreResult = scoreSalesFresherResume(rawText);

      const candidate = await prisma.candidate.create({
        data: {
          resumeUrl: req.file.originalname,
          rawText,
          score: scoreResult.score,
          decision: scoreResult.verdict.toLowerCase(),
          explanation: "",
          batchId,
          companyId: req.companyId!,
        },
      });

      res.json({ success: true, candidate });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default app;
