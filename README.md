# VeeCasa Deal Analyzer

Lightweight Node/Express wrapper for the VeeCasa Deal Analyzer frontend.

## Local Run (One Command)

From this folder:

```bash
npm install
npm start
```

Open:

- http://localhost:3001

Health endpoint:

- http://localhost:3001/health

Comparable search endpoint:

- http://localhost:3001/api/properties/search?location=Austin%2C%20TX&propertyType=all&priceRange=all&bedrooms=all

## Docker Option

Build and run with Docker Compose:

```bash
docker-compose up --build
```

Open:

- http://localhost:3001

## Files

- `index.html` - main app shell
- `styles.css` - styles
- `app.js` - calculator and feature logic
- `server.js` - Express wrapper
- `Dockerfile` - container image build
- `docker-compose.yml` - local container runtime

## Notes

- The app is served as static files via Express.
- `real-estate-analysis.html` is kept as the original source snapshot.

## Lead Capture API

Endpoint:

- `POST /api/leads`

Required fields:

- `name`
- `email`
- `goal`

Spam protection enabled:

- Honeypot field check (`website`)
- Fast-submit timing check (`startedAt`)
- Per-IP rate limit (5 submissions per 10 minutes)

## Comparable Properties API (IDX)

Detailed setup guide:

- See `README-IDX-INTEGRATION.md` for step-by-step IDX wiring and troubleshooting.
- See `.env.example` for all environment variables used by the API.

Endpoint:

- `GET /api/properties/search`

Query parameters:

- `location` (required)
- `propertyType` (`all`, `single-family`, `multi-family`, `condo`, `commercial`)
- `priceRange` (`all`, `0-200000`, `200000-400000`, `400000-600000`, `600000-1000000`, `1000000+`)
- `bedrooms` (`all`, `1`, `2`, `3`, `4`, `5`)

Configure your IDX provider via environment variables:

- `IDX_API_BASE_URL` (example: `https://your-idx-provider.example.com/v1`)
- `IDX_API_KEY`
- `IDX_API_KEY_HEADER` (default: `x-api-key`)
- `IDX_API_TIMEOUT_MS` (default: `10000`)
- `ENABLE_MOCK_COMPS` (default: `true`)

Behavior:

- If IDX credentials are configured and the provider returns listings, response source is `idx`.
- If IDX is not configured or unavailable, sample comps are returned when `ENABLE_MOCK_COMPS=true`.
