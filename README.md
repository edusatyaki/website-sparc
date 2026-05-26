# SpArc Associates — Website

A full-stack portfolio and shop website for **SpArc Associates**, an architecture firm based in Nagpur, India. Built with Express, MongoDB, and Pug templates.

Original repo: <https://github.com/dayshmookh/website-sparc>

---

## Screenshots

### Home
![Home page](docs/screenshots/home.png)

### Projects
![Projects gallery](docs/screenshots/projects.png)

### About the Team
![About page](docs/screenshots/about.png)

### Shop — Room of Art
![Shop page](docs/screenshots/shop.png)

### Contact
![Contact page](docs/screenshots/contact.png)

---

## Quick Start

```bash
npm install
npm start   # http://localhost:3000
```

No MongoDB? No problem — a local fallback starts automatically if `MONGODB_URI` is unset (requires network access to download `mongodb-memory-server`). You can also point the app at any running Mongo instance:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/sparc npm start
```

Optionally seed the database:

```bash
node scripts/populatedb.js mongodb://127.0.0.1:27017/sparc
```

Copy `.env.example` → `.env` to customise port, Mongo URI, and mailer settings.

---

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Templates:** Pug
- **File uploads:** Local filesystem (replaces original AWS S3 flow)
- **Email:** Nodemailer with a local stub (replaces original SendGrid flow)

## Pages

| Route | Description |
|---|---|
| `/` | Hero landing page with project gallery |
| `/projects` | Full project portfolio |
| `/about` | Team profiles |
| `/shop` | Room of Art — architectural prints shop |
| `/contact` | Contact form |

## What Changed vs. Upstream

1. **Startup hardened** — `dotenv` loaded; `mongodb-memory-server` fallback; server boots in degraded mode if Mongo is unreachable.
2. **Email** — SendGrid replaced with a local Nodemailer stub (logs to console, no API key needed).
3. **Image uploads** — AWS S3 replaced with a local filesystem flow; images served from `www/catalog/`.
4. **Graceful degraded mode** — all DB-backed routes render with empty data instead of hanging when MongoDB is unavailable.

## Address

SpArc Associates  
31, Friends Cooperative Housing Society, Layout-2  
Deendayal Nagar, Nagpur, Maharashtra 440022
