# Treasure Hunt Backend

Node.js + Express + MongoDB + Socket.io backend for a treasure hunt web app:
auth, admin dashboard APIs, live team location, clue delivery, and photo
verification via a Python ML microservice.

## Quick start

```bash
npm install
cp .env.example .env    # then edit values, especially MONGO_URI and JWT_SECRET
npm run dev              # nodemon, auto-restarts on changes
```

Make sure MongoDB is running locally (or point MONGO_URI at Atlas).

Seed an admin account + sample clues:
```bash
node seed.js
```

## Testing without the real ML model yet

A mock ML service is included so you can build/test the whole flow today:
```bash
cd mock-ml-service
pip install flask
python app.py     # runs on http://localhost:8000
```
Set `ML_SERVICE_URL=http://localhost:8000/predict` in `.env`. It returns
random labels/confidences — good enough to test the wiring end-to-end.

## Contract for your ML teammate

Give your ML teammate this exact spec so their service plugs straight in,
no changes needed on the Node side:

- **Endpoint:** `POST /predict`
- **Request:** `multipart/form-data` with one field named `image` (the photo file)
- **Response:** `application/json`
  ```json
  { "label": "clock_tower", "confidence": 0.93 }
  ```
- `label` must match the `targetLabel` string you set on each Clue document
  (see `/api/admin/clues`), e.g. `"clock_tower"`, `"fountain"`.
- `confidence` is a float 0–1. Each clue has its own `confidenceThreshold`
  (default 0.75) — a submission only counts as correct if `label` matches
  AND `confidence >= threshold`.

Whatever framework they use (Flask/FastAPI), as long as they match this
request/response shape, `utils/mlClient.js` will work unmodified.

## API overview

### Auth
- `POST /api/auth/register` `{ name, email, password, teamName? }`
- `POST /api/auth/login` `{ email, password }`
- `GET /api/auth/me` (auth required)

### Clues (player-facing)
- `GET /api/clues/current` — the clue the player's team is currently on
- `POST /api/clues/submit-photo` — multipart field `photo`; runs ML check,
  advances team on success, emits `team:progress` over socket

### Teams
- `POST /api/teams/location` `{ lat, lng }` — REST fallback for GPS ping
- `GET /api/teams/leaderboard`
- `GET /api/teams/:id`

### Admin (all require `role: admin`)
- `GET/POST /api/admin/clues`, `PUT/DELETE /api/admin/clues/:id`
- `GET /api/admin/teams`, `POST /api/admin/teams/:id/reset`
- `GET /api/admin/submissions?teamId=&clueId=` — full audit trail of every
  photo attempt (correct or not) for debugging false negatives from the model

## Real-time events (Socket.io)

Connect with `io(url, { auth: { token: jwtToken } })`.

| Event (client → server) | Payload | Purpose |
|---|---|---|
| `join:admin` | — | Admin dashboard joins room to receive all broadcasts |
| `join:team` | `teamId` | Player client joins its team's room |
| `location:update` | `{ teamId, lat, lng }` | Live GPS ping while hunt is active |

| Event (server → client) | Payload | Who receives it |
|---|---|---|
| `team:location` | `{ teamId, lat, lng, updatedAt }` | admin room |
| `team:progress` | `{ teamId, teamName, score, currentClueIndex, status }` | broadcast to all |

## Data model summary

- **User**: player or admin, optionally linked to a Team
- **Team**: members, currentClueIndex (position in hunt), score, live location, status
- **Clue**: ordered sequence, riddle text, targetLabel + confidenceThreshold for ML matching
- **Submission**: audit log of every photo attempt with the raw ML response — keep this even
  for wrong guesses, it's invaluable for debugging model accuracy issues before Friday

## Things you still need to decide/do

1. Wire in the real ML service URL once your teammate's model is containerized/running.
2. Decide photo storage: currently local disk (`/uploads`) — fine for a hackathon demo,
   but switch to S3/Cloudinary if deploying somewhere with ephemeral filesystem (e.g. Heroku, Render free tier wipe uploads on restart).
3. Lock down CORS origin in `server.js` (currently `*`) once you know your frontend's deployed URL.
4. Add rate limiting on `/submit-photo` if you're worried about spam/abuse during the live event.
