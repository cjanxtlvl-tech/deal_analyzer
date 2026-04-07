# IDX Integration Guide (Deal Analyzer)

This guide explains how to connect the Deal Analyzer comparable-property search to your authorized IDX provider.

## What Is Already Implemented

The Deal Analyzer already includes a backend API route:

- GET /api/properties/search

The frontend "Search Comparable Properties" form calls this route.

The backend then:

1. Calls your IDX provider endpoint.
2. Normalizes returned listing fields.
3. Returns comparable properties to the UI.
4. Falls back to sample data if enabled.

## Data Flow

1. User enters search filters in the Deal Analyzer UI.
2. Frontend calls local API: /api/properties/search.
3. Local API calls your IDX API:
   - {IDX_API_BASE_URL}/properties/search
4. IDX response is normalized into this shape:
   - address
   - price
   - rent
   - capRate
   - beds
   - baths
   - sqft
5. Frontend renders cards and allows "Use This Data".

## Required Environment Variables

Quick start:

- Copy `.env.example` and fill in your provider credentials.

Set these on the Deal Analyzer server/container:

- IDX_API_BASE_URL
  - Example: https://your-idx-provider.example.com/v1
- IDX_API_KEY
  - Your provider credential
- IDX_API_KEY_HEADER
  - Default: x-api-key
  - Change if your provider expects a different header name
- IDX_API_TIMEOUT_MS
  - Default: 10000
- ENABLE_MOCK_COMPS
  - Default: true
  - Set false to disable sample fallback

## Expected IDX Provider Endpoint

The current adapter calls:

- GET {IDX_API_BASE_URL}/properties/search

With query params:

- location
- propertyType (optional)
- minBeds (optional)
- minPrice (optional)
- maxPrice (optional)
- limit=12

Header sent:

- {IDX_API_KEY_HEADER}: {IDX_API_KEY}

## Supported Query Inputs From Frontend

Your local API accepts:

- location (required)
- propertyType: all | single-family | multi-family | condo | commercial
- priceRange: all | 0-200000 | 200000-400000 | 400000-600000 | 600000-1000000 | 1000000+
- bedrooms: all | 1 | 2 | 3 | 4 | 5

## IDX Response Mapping

The adapter currently maps these possible provider fields:

- address from:
  - address | fullAddress | unparsedAddress | streetAddress | displayAddress
- price from:
  - listPrice | price | askingPrice
- beds from:
  - bedrooms | beds
- baths from:
  - bathrooms | baths
- sqft from:
  - livingArea | sqft | squareFeet
- rent from:
  - estimatedRent | rentEstimate
- capRate from:
  - capRate

If your provider uses different property names, update the normalizeIdxProperty function in server.js.

## Local Run (Node)

From the deal_analyzer folder:

1. Install dependencies
   - npm install
2. Set environment variables (PowerShell example):
   - $env:IDX_API_BASE_URL="https://your-idx-provider.example.com/v1"
   - $env:IDX_API_KEY="YOUR_KEY"
   - $env:IDX_API_KEY_HEADER="x-api-key"
   - $env:ENABLE_MOCK_COMPS="false"
3. Start app
   - npm start
4. Test endpoint
   - curl "http://localhost:3001/api/properties/search?location=Austin,%20TX&propertyType=all&priceRange=all&bedrooms=all"

## Docker / Compose Run

If you run through the shared calculators compose file, pass these vars into the deal-analyzer service environment:

- IDX_API_BASE_URL
- IDX_API_KEY
- IDX_API_KEY_HEADER
- IDX_API_TIMEOUT_MS
- ENABLE_MOCK_COMPS

Then rebuild/restart deal-analyzer service.

## Response Examples

Success from IDX source:

{
  "source": "idx",
  "total": 3,
  "properties": [
    {
      "address": "123 Main St, Austin, TX",
      "price": 425000,
      "rent": 2900,
      "capRate": 7.2,
      "beds": 4,
      "baths": 2.5,
      "sqft": 2200
    }
  ]
}

Fallback sample response:

{
  "source": "mock",
  "total": 5,
  "properties": [ ... ]
}

## Troubleshooting

1. Always getting source=mock
   - Verify IDX_API_BASE_URL and IDX_API_KEY are actually set in the running process/container.
   - Set ENABLE_MOCK_COMPS=false to surface real provider errors.

2. 502 from /api/properties/search
   - Check provider URL path and auth header format.
   - Increase IDX_API_TIMEOUT_MS if provider is slow.

3. Empty properties array
   - Confirm provider query parameter names match expectations.
   - Confirm mapping keys in normalizeIdxProperty match provider payload fields.

4. Works locally but not in Docker
   - Ensure env vars are passed into the container, not only your host shell.

## Compliance Notes

Because you are IDX-authorized, keep these guardrails in place:

1. Follow your MLS/IDX display and attribution rules.
2. Do not expose disallowed fields to public users.
3. Respect retention/refresh limits in your agreement.
4. Log API errors and sync access for auditing.

## Suggested Next Enhancements

1. Add request logging and latency metrics for IDX calls.
2. Add provider-specific adapter file (idxProvider.js) for easier maintenance.
3. Add optional caching (30 to 120 seconds) for repeated searches.
4. Add stricter validation for location and filters.
