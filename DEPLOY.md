# Deploy Thermo-Logic (Public Website)

This game is static (`index.html`, `app.js`, `styles.css`), so you can host it directly on any static host.

## Option 1: GitHub Pages (configured)

Files already added:
- `.github/workflows/deploy-pages.yml`

Steps:
1. Push this repo to GitHub.
2. Make sure your default branch is `main` (or update the workflow branch).
3. In GitHub repo settings, open **Pages** and set source to **GitHub Actions**.
4. Push to `main`.
5. Your game will publish at `https://<your-user>.github.io/<repo-name>/`.

## Option 2: Netlify (configured)

File already added:
- `netlify.toml`

Steps:
1. Import this repo in Netlify.
2. Build command: leave empty.
3. Publish directory: `.`
4. Deploy.

## Option 3: Vercel (configured)

File already added:
- `vercel.json`

Steps:
1. Import this repo in Vercel.
2. Framework preset: **Other**.
3. Build command: empty.
4. Output directory: empty.
5. Deploy.

## Notes
- No backend is required for the current game.
- If you use a custom domain, map DNS in your hosting provider dashboard.
