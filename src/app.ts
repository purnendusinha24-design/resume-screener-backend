import express from "express";
import cors from "cors";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { extractTextFromPDF } from "./utils/pdfParser";
import { scoreSalesFresherResume } from "./scoring/salesFresherScorer";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// ---------- HEALTH CHECK ----------
app.get("/", (_req, res) => {
  res.send("Backend running");
});

// ---------- DASHBOARD STATS ----------
app.get("/api/stats", async (_req, res) => {
  res.json({
    total: 42,
    shortlisted: 18,
    rejected: 16,
    pending: 8,
  });
});

// ---------- CREATE BATCH ----------
app.post("/batch", async (req, res) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: "role is required" });

  const batch = await prisma.batch.create({ data: { role } });
  res.json(batch);
});

// ---------- GET BATCH RESULTS ----------
app.get("/batch/:batchId/results", async (req, res) => {
  const { batchId } = req.params;

  try {
    const resumes = await prisma.resume.findMany({
      where: { batchId },
      orderBy: { score: "desc" },
    });

    res.json({
      rankedResumes: resumes,
    });
  } catch (error) {
    console.error("Failed to fetch batch results:", error);
    res.status(500).json({ error: "Failed to fetch batch results" });
  }
});

// ---------- UPLOAD RESUME ----------
app.post("/resume/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
const { batchId } = req.body;

if (!batchId) {
  return res.status(400).json({ error: "batchId is required" });
}

const rawText = await extractTextFromPDF(req.file.path);
const scoreResult = scoreSalesFresherResume(rawText);

const resume = await prisma.resume.create({
  data: {
    filename: req.file.originalname,
    rawText,
    score: scoreResult.score,
    verdict: scoreResult.verdict,
    reasons: "", // placeholder for now
    batchId,
  },
});

res.json({ success: true, resume });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/batch", async (_req, res) => {
  const batches = await prisma.batch.findMany({
    orderBy: { createdAt: "desc" }
  });
  res.json(batches);
});

export default app;
