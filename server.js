const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const rootDir = __dirname;
const leadRateStore = new Map();
const IDX_API_BASE_URL = process.env.IDX_API_BASE_URL || "";
const IDX_API_KEY = process.env.IDX_API_KEY || "";
const IDX_API_KEY_HEADER = process.env.IDX_API_KEY_HEADER || "x-api-key";
const IDX_API_TIMEOUT_MS = Number(process.env.IDX_API_TIMEOUT_MS || 10000);
const ENABLE_MOCK_COMPS = String(process.env.ENABLE_MOCK_COMPS || "true").toLowerCase() !== "false";

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

function parsePriceRange(priceRange) {
  if (!priceRange || priceRange === "all") {
    return { minPrice: null, maxPrice: null };
  }

  if (priceRange.endsWith("+")) {
    return { minPrice: Number(priceRange.replace("+", "")) || null, maxPrice: null };
  }

  const [minRaw, maxRaw] = String(priceRange).split("-");
  const minPrice = Number(minRaw);
  const maxPrice = Number(maxRaw);

  return {
    minPrice: Number.isFinite(minPrice) ? minPrice : null,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : null
  };
}

function normalizeIdxProperty(item) {
  const address = item.address || item.fullAddress || item.unparsedAddress || item.streetAddress || item.displayAddress || "Address unavailable";
  const price = Number(item.listPrice || item.price || item.askingPrice || 0) || 0;
  const beds = Number(item.bedrooms || item.beds || 0) || 0;
  const baths = Number(item.bathrooms || item.baths || 0) || 0;
  const sqft = Number(item.livingArea || item.sqft || item.squareFeet || 0) || 0;

  const monthlyRent = Number(item.estimatedRent || item.rentEstimate || 0) || 0;
  const capRate = Number(item.capRate || 0) || 0;

  return {
    address,
    price,
    rent: monthlyRent,
    capRate,
    beds,
    baths,
    sqft
  };
}

function generateSampleProperties(location, propertyType, priceRange, bedrooms) {
  const { minPrice, maxPrice } = parsePriceRange(priceRange);
  const minBeds = Number(bedrooms);
  const bedroomFloor = Number.isFinite(minBeds) ? minBeds : 0;

  const seedProperties = [
    { street: "Oak Street", price: 385000, rent: 2650, capRate: 6.8, beds: 3, baths: 2, sqft: 1850 },
    { street: "Maple Avenue", price: 425000, rent: 2900, capRate: 7.2, beds: 4, baths: 2.5, sqft: 2200 },
    { street: "Pine Court", price: 320000, rent: 2400, capRate: 7.5, beds: 3, baths: 2, sqft: 1650 },
    { street: "Cedar Lane", price: 475000, rent: 3200, capRate: 6.5, beds: 4, baths: 3, sqft: 2500 },
    { street: "Elm Street", price: 355000, rent: 2550, capRate: 7.0, beds: 3, baths: 2, sqft: 1750 }
  ];

  const filtered = seedProperties.filter((property) => {
    if (propertyType && propertyType !== "all" && propertyType !== "single-family") {
      return false;
    }

    if (bedroomFloor > 0 && property.beds < bedroomFloor) {
      return false;
    }

    if (minPrice !== null && property.price < minPrice) {
      return false;
    }

    if (maxPrice !== null && property.price > maxPrice) {
      return false;
    }

    return true;
  });

  return filtered.map((property, index) => ({
    address: `${101 + index * 37} ${property.street}, ${location}`,
    price: property.price,
    rent: property.rent,
    capRate: property.capRate,
    beds: property.beds,
    baths: property.baths,
    sqft: property.sqft
  }));
}

async function fetchIdxProperties({ location, propertyType, priceRange, bedrooms }) {
  if (!IDX_API_BASE_URL || !IDX_API_KEY) {
    return null;
  }

  const { minPrice, maxPrice } = parsePriceRange(priceRange);
  const params = new URLSearchParams();
  params.set("location", location);

  if (propertyType && propertyType !== "all") {
    params.set("propertyType", propertyType);
  }

  if (Number.isFinite(Number(bedrooms)) && Number(bedrooms) > 0) {
    params.set("minBeds", String(Number(bedrooms)));
  }

  if (minPrice !== null) {
    params.set("minPrice", String(minPrice));
  }

  if (maxPrice !== null) {
    params.set("maxPrice", String(maxPrice));
  }

  params.set("limit", "12");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IDX_API_TIMEOUT_MS);

  try {
    const targetUrl = `${IDX_API_BASE_URL.replace(/\/$/, "")}/properties/search?${params.toString()}`;
    const response = await fetch(targetUrl, {
      headers: {
        [IDX_API_KEY_HEADER]: IDX_API_KEY
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`IDX request failed with status ${response.status}`);
    }

    const body = await response.json();
    const candidates = Array.isArray(body)
      ? body
      : Array.isArray(body.properties)
        ? body.properties
        : Array.isArray(body.results)
          ? body.results
          : [];

    return candidates.map(normalizeIdxProperty).filter((property) => property.address && property.price > 0);
  } finally {
    clearTimeout(timeout);
  }
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

app.get("/api/properties/search", async (req, res) => {
  const location = String(req.query.location || "").trim();
  const propertyType = String(req.query.propertyType || "all").trim();
  const priceRange = String(req.query.priceRange || "all").trim();
  const bedrooms = String(req.query.bedrooms || "all").trim();

  if (!location) {
    return res.status(400).json({ error: "Location is required" });
  }

  try {
    const idxProperties = await fetchIdxProperties({ location, propertyType, priceRange, bedrooms });

    if (Array.isArray(idxProperties) && idxProperties.length > 0) {
      return res.status(200).json({
        source: "idx",
        total: idxProperties.length,
        properties: idxProperties
      });
    }

    if (!ENABLE_MOCK_COMPS) {
      return res.status(200).json({
        source: "idx",
        total: 0,
        properties: []
      });
    }

    const mockProperties = generateSampleProperties(location, propertyType, priceRange, bedrooms);
    return res.status(200).json({
      source: "mock",
      total: mockProperties.length,
      properties: mockProperties
    });
  } catch (error) {
    if (!ENABLE_MOCK_COMPS) {
      return res.status(502).json({
        error: "Unable to fetch properties from IDX provider",
        detail: error.message
      });
    }

    const mockProperties = generateSampleProperties(location, propertyType, priceRange, bedrooms);
    return res.status(200).json({
      source: "mock",
      warning: "IDX provider unavailable; returned mock properties",
      total: mockProperties.length,
      properties: mockProperties
    });
  }
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
