const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const rootDir = __dirname;
const leadRateStore = new Map();

const LEAD_WINDOW_MS = 10 * 60 * 1000;
const MAX_LEADS_PER_WINDOW = 5;
const MIN_SUBMIT_SECONDS = 4;

app.disable("x-powered-by");
app.use(express.json({ limit: "200kb" }));

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function isLeadRateLimited(clientIp) {
  const now = Date.now();
  const cutoff = now - LEAD_WINDOW_MS;
  const record = leadRateStore.get(clientIp) || [];
  const fresh = record.filter((timestamp) => timestamp > cutoff);

  if (fresh.length >= MAX_LEADS_PER_WINDOW) {
    leadRateStore.set(clientIp, fresh);
    return true;
  }

  fresh.push(now);
  leadRateStore.set(clientIp, fresh);
  return false;
}

function validateLead(payload) {
  const requiredFields = ["name", "email", "goal"];
  const missing = requiredFields.filter((field) => {
    const value = payload[field];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missing.length > 0) {
    return { ok: false, error: "Missing required fields", missing };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.email)) {
    return { ok: false, error: "Invalid email address" };
  }

  if (typeof payload.website === "string" && payload.website.trim().length > 0) {
    return { ok: false, error: "Spam detected" };
  }

  const startedAt = Number(payload.startedAt || 0);
  if (Number.isFinite(startedAt) && startedAt > 0) {
    const ageSeconds = (Date.now() - startedAt) / 1000;
    if (ageSeconds >= 0 && ageSeconds < MIN_SUBMIT_SECONDS) {
      return { ok: false, error: "Submitted too quickly" };
    }
  }

  return { ok: true };
}

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", app: "veecasa-deal-analyzer" });
});

app.post("/api/leads", (req, res) => {
  const payload = req.body || {};
  const clientIp = getClientIp(req);

  if (isLeadRateLimited(clientIp)) {
    return res.status(429).json({ error: "Too many submissions. Please try again later." });
  }

  const validation = validateLead(payload);
  if (!validation.ok) {
    return res.status(400).json({
      error: validation.error,
      missing: validation.missing || []
    });
  }

  const lead = {
    id: `lead_${Date.now()}`,
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: typeof payload.phone === "string" ? payload.phone.trim() : "",
    goal: payload.goal.trim(),
    notes: typeof payload.notes === "string" ? payload.notes.trim() : "",
    createdAt: new Date().toISOString(),
    source: "veecasa-deal-analyzer"
  };

  console.log("Lead captured:", lead);

  return res.status(201).json({
    message: "Lead submitted successfully",
    leadId: lead.id
  });
});

app.use(express.static(rootDir, {
  extensions: ["html"],
  maxAge: "1h"
}));

app.get("/", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.get("*", (_req, res) => {
  res.status(404).sendFile(path.join(rootDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`VeeCasa Deal Analyzer running at http://localhost:${PORT}`);
});
