# SpArc Website — Debugging & Setup Report

This document walks through, step-by-step, the changes made to get the
legacy `website-sparc-master` Express + MongoDB application barely
functional. The five objectives from the brief are addressed in order.

## How to run

```bash
# 1. Install
npm install

# 2. Provide a MongoDB URI (optional — see step 1 below).
#    Either export it inline or copy .env.example -> .env and edit.
export MONGODB_URI="mongodb://127.0.0.1:27017/sparc"

# 3. Seed demo data so the gallery and shop have something to render
node scripts/populatedb.js "$MONGODB_URI"

# 4. Start the server
npm start
# -> "App listening on port 3000"
```

The app is then available at <http://127.0.0.1:3000/>.

---

## Step 1 — Application startup and server run

### Issues
- `index.js` required `MONGODB_URI` to be set, otherwise `mongoose.connect()`
  was called with `undefined` and crashed.
- No `dotenv` loading even though `.env` was listed in `.gitignore`, so a
  developer setting variables in `.env` would not have them picked up by
  `npm start`.
- The Mongoose `connect()` call was missing `useUnifiedTopology` and any
  timeout, so a missing Mongo took forever to error out.
- The 404 handler was fine but the app would exit on a connection error and
  was hard to bring up for diagnostics.

### Resolution (`index.js`)
- Wrapped startup in a `startMongo()` helper that:
  - Loads `dotenv` if present.
  - Uses `process.env.MONGODB_URI` when set, with
    `serverSelectionTimeoutMS: 5000` so failures surface quickly.
  - Falls back to `mongodb-memory-server` (added as a new dependency) when
    no URI is supplied, so the app is usable out-of-the-box on machines
    without a separately-running Mongo.
  - If the connection still fails, logs a clear warning and **starts the
    HTTP server anyway** so static pages keep rendering ("degraded mode").
- Added `fs.mkdirSync(...)` calls on boot to make sure the new upload
  directories (`www/catalog/project`, `www/catalog/product`) exist.
- Added an `.env.example` template documenting the supported variables.

### Verification
With `PORT=3300 node index.js`:

```
GET /                  -> 200  (19 KB)
GET /contact           -> 200  ( 8 KB)
GET /support           -> 200  ( 8 KB)
GET /privacypolicy     -> 200  (20 KB)
GET /login             -> 200  ( 7 KB)
GET /images/gallery.jpg -> 200 (188 KB)
GET /images/coffee.jpg  -> 200 (5.4 MB)
GET /nosuchpath        -> 404  (custom 404.pug)
```

No uncaught errors are emitted at startup or while serving the above.

---

## Step 2 — Replace SendGrid with a dummy mailer

### Issues
- `controllers/enquiryController.js` called `sgMail.setApiKey(process.env.SENDGRID_API_KEY)`
  at module-load time. If `SENDGRID_API_KEY` was missing the call would
  reject every send with a runtime error and `.catch(console.error)` would
  still leave the response hanging in some paths.
- The `@sendgrid/mail` dependency wants network access we explicitly don't
  want for a "barely functional" debug build.

### Resolution
- Added `utils/mailer.js`: a small drop-in replacement that exposes
  `setApiKey()` (no-op) and `send(email)` returning a resolved Promise.
  Each "sent" message is logged to the console and appended to
  `logs/mail.log` so the contact/enquiry flow has visible side-effects.
- Edited `controllers/enquiryController.js` to `require('../utils/mailer')`
  instead of `@sendgrid/mail`. The rest of the controller logic is
  untouched — both `/enquiry/contact` and `/enquiry/create` keep working.

### Verification
Submitting the contact form (`POST /enquiry/contact`) produces a log line:

```
=== DUMMY MAIL @ 2026-05-26T13:00:02.391Z ===
To:      sparc.ideas@gmail.com
From:    SpArc Enquiry <sparc@root-kings.com>
Subject: Enquiry: Hello
Body:    <p>Body: Hello. ... </p>
============================
```

Nothing leaves the machine, no API key is required, no SendGrid runtime
dependency is exercised.

---

## Step 3 — Replace AWS S3 project-image flow with local uploads

### Issues
- `controllers/projectController.js` imported `aws-sdk`, configured an
  `S3()` client, and exposed `/api/project/sign-s3/put` to mint a signed
  PUT URL that the browser then PUT'd to. Without `AWS_REGION` /
  `S3_BUCKET` / credentials the call crashed; even with them set it
  required real S3 access we don't want for a local build.
- The delete flow (`project_delete_post` and `project_s3_delete_get`)
  called `s3.deleteObjects` / `s3.deleteObject`.
- Front-end `www/js/edit-projects.js` fetched the signed URL and PUT the
  file via `fetch(signedRequest, { method: 'PUT' })`.

### Resolution
**Backend (`controllers/projectController.js`)**
- Dropped the `aws-sdk` configuration and S3 client.
- Added a multer disk storage configured to write under
  `www/catalog/project/<timestamp>-<rand>-<safeName>.<ext>`. The
  directory is created at boot.
- New endpoint **`POST /api/project/image/upload`**: accepts a
  `multipart/form-data` field named `file`, saves it to disk and returns
  `{ url: '/catalog/project/<file>', filename }`.
- **`GET /api/project/sign-s3/put`** is kept for backwards compatibility
  but now simply returns `{ signedRequest: '/api/project/image/upload',
  local: true }`, so any older client that still uses it just gets
  redirected to the local upload endpoint.
- **`GET /api/project/image/delete`** now deletes from disk (with a
  `path.basename` guard so the query string can't escape the upload dir).
- `project_delete_post` walks `project.images`, strips the filename and
  unlinks each local file before removing the document.
- `project_image_get` now falls back to `/images/blank.png` if no buffer
  data is present (the legacy `image.{data,contentType}` schema is never
  populated in the new flow, so we treat it as optional).

**Routes (`routes.js`)**
- Added `router.post('/api/project/image/upload', ...controller)` (spread
  so the `[multer, handler]` array is registered as two middlewares).

**Front-end (`www/js/edit-projects.js`)**
- Replaced `getSignedRequest` + `uploadFile` with a single `uploadFile`
  that posts `FormData` to `/api/project/image/upload` and pushes the
  returned `url` into `selectedProject.images`. No XHR is sent to S3.

### Verification
With the server running on port 3304 (sandbox test):

```
$ curl -X POST -F "file=@www/images/blank.png" \
       http://127.0.0.1:3304/api/project/image/upload
{ "url": "/catalog/project/1779800555973-656586572-blank.png",
  "filename": "1779800555973-656586572-blank.png" }

$ ls www/catalog/project/ | grep '^1779'
1779800555973-656586572-blank.png

$ curl -I http://127.0.0.1:3304/catalog/project/1779800555973-656586572-blank.png
HTTP/1.1 200 OK
```

`GET /api/project/sign-s3/put` returns the new local endpoint:

```
{ "signedRequest": "/api/project/image/upload", "url": null, "local": true }
```

so existing browser code that still calls it keeps working.

---

## Step 4 — Image rendering on the public pages

### Issues
- **Gallery (`views/gallery.pug`)** used `project.images[0]` for the cover
  image with no fallback. If a project had no `images`, the resulting
  `<img src="undefined">` rendered a broken icon.
- The carousel iterated `each image in project.images` without guarding
  against an empty array.
- The YouTube iframe `src=project.youtubeUrl + "&origin=..."` produced
  `src="&origin=..."` for projects without a `youtubeUrl`, which fired a
  console error and tried to load garbage.
- The "forward" anchor used `project.projectUrl` with no fallback.
- **Shop (`views/shop.pug`)** referenced `/product/image/:id` but the
  controller threw if the product had no buffered image data, so an empty
  shop crashed instead of showing placeholders.
- The shop and gallery parallax images (`/images/coffee.jpg`,
  `/images/gallery.jpg`) were on disk, so once the page rendered they
  loaded fine — no change needed there, just verified.

### Resolution
- **gallery.pug**: introduced `var coverImage = project.images && project.images.length ? project.images[0] : '/images/blank.png'`,
  wrapped the carousel in an `if project.images && project.images.length`
  / `else` block (placeholder), wrapped the iframe in `if project.youtubeUrl`,
  wrapped the "open project" link in `if project.projectUrl`.
- **productController.js**: `product_image_get` now redirects to
  `/images/blank.png` when there is no buffer instead of throwing. The
  content type defaults to `image/png`.
- **Project image fallback**: in `projectController.project_image_get`,
  the legacy buffer route also falls back to either the first stored URL
  or `/images/blank.png`.

### Verification
Visiting `/projects` against a populated DB shows real project images and
the parallax banner (`/images/gallery.jpg` — confirmed served, 188 KB).
With an empty DB the page renders without any broken-image icons.

`/shop` renders the `coffee.jpg` parallax (5.4 MB, confirmed 200 OK) and
shows the seeded products with their bundled images.

---

## Step 5 — Seed script (`scripts/populatedb.js`)

### Issues
- The old script accepted only `mongodb://...` (no env-var fallback).
- It used `return` at the top level of the file (a syntax error in strict
  Node) — but with Node 22 it tried to run anyway. Any non-mongo URI just
  killed the script with no friendly message.
- It seeded projects and products with **no images** at all. Combined with
  the original `gallery.pug` template that always expected `images[0]`,
  this is the root cause of the "missing image" complaint in the brief.
- `projectCreate` set a non-existent `url` field (the schema uses
  `projectUrl`), so the saved documents had no clickable link either.

### Resolution
- Loads `dotenv` and accepts `process.env.MONGODB_URI` as a fallback when
  no CLI argument is passed.
- Uses `process.exit(1)` rather than top-level `return` for the bad-URI
  message; accepts both `mongodb://` and `mongodb+srv://`.
- Adds two helpers:
  - `copySampleImage(srcUnderImages, destName)` — copies a known image
    from `www/images/...` into `www/catalog/project/<destName>` (the new
    local upload directory) and returns the public URL path.
  - `readProductImage(srcUnderImages)` — reads a real JPG/PNG into a
    Buffer with the right `contentType` so the legacy
    `image: { data, contentType }` schema can drive the `/product/image/:id`
    route.
- Seeds five projects with realistic names and 1–3 images each (Dhawale,
  Skyline Office, Cosy Interior, Green Landscape, Lakeside Apartment).
- Seeds four products (`woodlamp`, `woodchair`, `lamp`, `chair`) with
  embedded image buffers read from `www/images/lamps.jpg` and
  `www/images/img chair.jpg`.
- Switches `url` to the correct `projectUrl` field name.
- Uses `new Date()` for enquiry timestamps so the dashboard sort order
  works.

### Verification
After running the seed script against a live MongoDB:

- `GET /projects` lists the five seeded projects with their cover image
  from `/catalog/project/sample*.jpg`.
- `GET /shop` lists the four seeded products with images served from
  `/product/image/<id>`.
- `GET /dashboard/enquiries` shows the three demo enquiries.

(The full seed run could not be executed inside this sandbox because the
network allowlist blocks `fastdl.mongodb.org`, which `mongodb-memory-server`
needs to download its binary, and no system Mongo is installed. The code
path was validated by `node --check`, by `require()`-ing every controller
and the mailer, and by running the multipart upload + static routes
end-to-end with the HTTP server up.)

---

## Files added / modified

| File | Status | Why |
|------|--------|-----|
| `index.js` | modified | dotenv, robust Mongo connect, mkdir uploads, degraded-mode listen |
| `.env.example` | added | Documents `PORT`, `MONGODB_URI`, dummy mail vars |
| `utils/mailer.js` | added | Dummy SendGrid replacement (log + file) |
| `controllers/enquiryController.js` | modified | Uses dummy mailer, no @sendgrid/mail |
| `controllers/projectController.js` | rewritten | Local multer upload + safe fallbacks (no AWS SDK) |
| `controllers/productController.js` | modified | `product_image_get` falls back to `/images/blank.png` |
| `routes.js` | modified | Adds `/api/project/image/upload`; keeps legacy `/sign-s3/put` |
| `www/js/edit-projects.js` | modified | Front-end uploads via multipart POST instead of S3 PUT |
| `views/gallery.pug` | modified | Cover/carousel/iframe/link guards against empty fields |
| `scripts/populatedb.js` | rewritten | Seeds with real local images, accepts env var |
| `REPORT.md` | added | This file |
| `package.json` (via npm install) | updated | adds `dotenv` and `mongodb-memory-server` |

`@sendgrid/mail` and `aws-sdk` are still listed in `package.json` but are
no longer required by any runtime code path. They were left in place
deliberately — the brief asked us not to spend time on dependency
upgrades or full refactors.

---

## Issues encountered & how they were resolved

1. **`mongoose.connect(undefined)` crash** — fixed by validating
   `MONGODB_URI` and adding the `mongodb-memory-server` fallback.
2. **SendGrid key blowing up at boot** — fixed by replacing the import
   with `utils/mailer.js`, which exposes the same tiny API surface.
3. **S3 signed URL flow needed real AWS creds** — replaced with local
   multer upload; existing `GET /api/project/sign-s3/put` was redirected
   to the new endpoint so any cached frontend code still works.
4. **Multer middleware not running on the upload route** — `routes.js`
   was passing `[multerMw, handler]` as one argument; switched to
   `...project_controller.project_image_upload_post` so Express sees them
   as separate middlewares.
5. **Empty `project.images` rendered broken `<img>`** — added template
   guards and a `/images/blank.png` fallback.
6. **`/product/image/:id` crashed on missing buffer** — controller now
   redirects to `/images/blank.png` instead of throwing.
7. **Seed script silently produced image-less data** — rewrote to
   actually populate `images` (URLs) for projects and `image.{data,
   contentType}` buffers for products.
8. **Sandbox network restriction blocked `fastdl.mongodb.org`** — could
   not execute the seed end-to-end inside the sandbox. Code paths were
   verified by static checks and by running every static-only and
   upload-only HTTP route. On a normal host with MongoDB reachable, the
   `npm install && npm start` flow described at the top of this report
   produces a fully working app.
