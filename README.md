# Playlistly

Visual canvas for YouTube playlists — pan, zoom, search, and arrange every video on a grid instead of a flat list.

**Live:** [playlistly.vercel.app](https://playlistly.vercel.app)

## What it does

- Paste a **public playlist URL** and load up to thousands of videos as tiles
- **Pan and zoom** an infinite canvas; drag tiles, snap with Shift, multi-select, copy/paste
- **Save layouts** in the browser (auto-save + manual save) or export/import `.playlistly.json`
- Optional **Google sign-in** to pick from your own YouTube playlists (`youtube.readonly`)
- **Find videos** on the canvas, sort selections by color / artist / date, undo/redo

Layouts stay in **localStorage** on that device unless you export a file. There is no cloud account database.

## Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- React 19, TypeScript, Tailwind CSS 4
- [NextAuth.js](https://next-auth.js.org/) (Google OAuth)
- YouTube Data API v3

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run start   # run production build locally
npm run lint    # ESLint
```

## Environment variables

Create `.env.local` in the project root:

```env
# YouTube Data API — required for loading playlists (anonymous + signed-in)
YOUTUBE_API_KEY=

# NextAuth v4 — Google sign-in + session
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

| Variable | Purpose |
|----------|---------|
| `YOUTUBE_API_KEY` | Fetches playlist items from YouTube |
| `NEXTAUTH_URL` | App URL (production: `https://playlistly.vercel.app`) |
| `NEXTAUTH_SECRET` | Signs session cookies — use `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | OAuth 2.0 Client ID from Google Cloud |
| `AUTH_GOOGLE_SECRET` | OAuth 2.0 Client secret |

### Google Cloud setup (summary)

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **YouTube Data API v3** and create an API key.
3. Create an **OAuth 2.0 Web client**:
   - **Authorized JavaScript origins:** `http://localhost:3000`, `https://playlistly.vercel.app`
   - **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`, `https://playlistly.vercel.app/api/auth/callback/google`
4. Configure the [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) (app name, support email, privacy/terms URLs).
5. For production homepage verification, use **Search Console URL prefix** + HTML file in `public/` (not DNS on `*.vercel.app`).

## Deploy (Vercel)

1. Import the repo and set the same env vars as above (use production `NEXTAUTH_URL`).
2. Redeploy after changing environment variables.
3. Confirm `/privacy` and `/terms` load on your domain.

## Project layout

See [`app/STRUCTURE.md`](app/STRUCTURE.md) for how `components/`, `hooks/`, and `lib/` are organized.

## Legal

- [Privacy policy](https://playlistly.vercel.app/privacy)
- [Terms of service](https://playlistly.vercel.app/terms)

## CI

GitHub Actions runs `npm run lint` and `npm run build` on pushes and pull requests (see `.github/workflows/ci.yml`).
