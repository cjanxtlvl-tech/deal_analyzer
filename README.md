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
