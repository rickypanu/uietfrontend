# UIET Attendance

Attendance portal for UIET, Panjab University. Teachers start a session and share an OTP or QR code; students mark attendance from their phone (location + device checked); admins approve registrations and send notices.

```
uiet-attendance/
├── client/   React 19 + Vite + Tailwind CSS 4
└── server/   FastAPI + MongoDB
```

## Run it locally

**Server** (Python 3.10+)
```bash
cd server
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                   # then fill it in
uvicorn app.main:app --reload                          # http://localhost:8000  (docs at /docs)
```
The server refuses to start if `MONGO_URI`, `SECRET_KEY`, `ADMIN_ID`, `ADMIN_PASSWORD` or `ADMIN_EMAIL` is missing. `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` are needed for the admin OTP and approval e-mails (Brevo is called over HTTPS, so it works on Render where SMTP is blocked; the sender address must be verified in your Brevo account).

**Client** (Node 20+)
```bash
cd client
cp .env.example .env            # VITE_API_URL=http://localhost:8000
npm install
npm run dev                     # http://localhost:5173
```
For production, add your client's URL to `CORS_ORIGINS` on the server and set `VITE_API_URL` on the client.

**Tests** (pure-logic unit tests, no database needed): `cd server && python -m unittest tests.test_logic`

## Roles
| Role | Logs in with | Can do |
|---|---|---|
| Student | 6-digit roll no + date of birth | mark attendance, history, analysis + target calculator, notifications, profile |
| Teacher | 6-digit employee ID + date of birth | classes, generate OTP/QR, live attendance, monthly register, notifications |
| Admin | ID + password + e-mailed OTP | approve/reject registrations, bulk import, notifications to all / a class / individuals |

## What changed from the two original repos

### Security
- **Removed the admin-login bypass.** `AdminDashboard` silently stored a fake token in `localStorage` if none existed, so `/admin/dashboard` opened for anyone.
- **Real authentication everywhere.** Previously only the admin had a token (and the server ignored it on most routes). Now students and teachers get a signed JWT at login, and every endpoint checks it: you can only read/modify *your own* data; the admin lists, approvals, bulk import and notifications require an admin token. Removed the unauthenticated `/admin/login` that skipped the OTP.
- Stopped storing the date of birth (the password) in `localStorage`.
- Mongo **regex injection** fixed (user input was placed into `$regex` unescaped) — all lookups use escaped matches.
- Notification uploads: **path traversal** via the client's filename fixed (random names, extension allow-list, 5 MB cap); profile photos are verified by magic bytes and capped.
- Admin OTP now uses `secrets` (not `random`), is stored hashed with an expiry and an attempt limit, and works across multiple workers. Login endpoints are rate-limited.
- Config no longer crashes on a missing env var at import (`int(None)`), and secrets are never defaulted.

### Backend bugs
- **Anyone could mark attendance for any class** — OTPs are now checked against the student's course/branch/semester/section.
- Attendance analysis **crashed (500) for a student with no attendance**, used the wrong program for M.E. students, counted lectures of *other* branches that share a subject name, and **broke on subject names containing `(` `/`** (they were used as raw regex). All fixed.
- Target calculator **divided by zero at 100 %**; now handled, and it also tells you how many classes you can skip.
- **Timezones:** MongoDB returned naive datetimes that were then converted with the server's local zone; notification expiry was compared in the wrong zone (5 h 30 m off). Everything is stored UTC, read tz-aware, and sent to the client as ISO with an explicit `+05:30`.
- Student `SUBJECTS_LOWER` was built from the dict *keys* (`BE`, `ME`), so filtering history by subject always said "Invalid subject".
- Device lock blocked a student's own back-to-back lectures; it now only blocks one device being used for a *different* student.
- Approve/reject deleted by the exact ID but found by a case-insensitive one, which could leave duplicates; an email failure after the move returned a 500. Now moves by `_id`, mail is best-effort in the background.
- Two OTPs could collide (and the register matched attendance by OTP only); codes are unique, secure and avoid look-alike characters (0/O/1/I).
- Class register mixed sections/branches and **overwrote columns when two lectures fell on one day**; each lecture is now its own column, grouped by IST date.
- Bulk import crashed on every row (numpy ints can't be stored), skipped validation, wrote numeric roll numbers, and its errors never reached the user. Rewritten with the same validators as manual registration and a per-row report.
- Phone validator rejected valid numbers starting with `91`. Teacher template used `T001` IDs that could never pass validation. `BE/ECE/Sem 8` contained an empty-string subject.
- Unique indexes added (one roll no / employee ID, one attendance per student per OTP). Duplicate/shadowed routes and dead code removed.

### Frontend bugs
- Route guards read `localStorage` once at start-up; replaced by an auth context + `ProtectedRoute`. A 401 now logs you out cleanly; there is a real 404 page.
- `BioTech` was sent as `BioTech` but the server key is `BIOTECH`, breaking analysis for those students. Subjects now come from the server (`GET /subjects`) – one source of truth instead of two 20 KB copies.
- The QR scanner component was re-created on every render (camera restarts) and could submit many times per scan.
- Admin notifications used a non-existent `userId` for the admin; attachment links pointed at the client host instead of the API; errors in bulk upload were swallowed.
- The unread-notification badge called an endpoint that didn't exist.
- Teacher GPS could wait forever if accuracy never reached 100 m; it now falls back to the best reading.
- OTP error state made the field permanently red; admin login errors were shown in green; the registration form showed the wrong field's error; CSV exports didn't escape commas or formulas.
- Removed `Navbar.jsx` (empty), the mislabeled `Select.jsx`, and unused dependencies.

### New UI
A consistent design system (indigo palette, cards, badges, toasts, confirm dialogs), a responsive app shell with mobile drawer, live "Live now" cards with countdowns and a projector view for teachers, progress bars and a skip/need calculator for students, searchable/paginated admin approvals with stats, in-page bulk import report, and loading/empty/error states throughout.

## Things to know
- **Existing data keeps working** (case-insensitive matching, legacy string expiries, OTPs without a section). Existing users must log in again.
- `BE / ECE / Semester 8` has no subjects defined (the original had a blank placeholder) — add them in `server/app/core/subjects.py`.
- Paste-blocking on the OTP input was removed (it hurt accessibility without stopping anything).
- Uploaded attachments are stored on the server's disk (`server/uploads`); on hosts with ephemeral disks (Render free tier, etc.) use a persistent volume or object storage.
- Login throttling is per-process; with several workers put a shared limiter (e.g. Redis) in front.
- The client could not be built in the environment this was prepared in (no network), so run `npm install && npm run build` once and report anything unexpected.
