# SpinCheck

AI-powered political bias detector for news articles. Available as a Chrome extension and web app.

## Structure

```
spincheck/
├── web/        # Next.js web app (paste & analyze)
└── extension/  # Chrome extension (analyze pages you're reading)
```

## Web App Setup

```bash
cd web
cp .env.example .env.local
# Add your Anthropic API key to .env.local
npm install
npm run dev
# → http://localhost:3000
```

## Chrome Extension Setup

1. In `extension/config.js`, set `API_URL` to your deployed web app URL  
   (or use `http://localhost:3000/api/analyze` for local development)
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `extension/` folder

## Deployment

Deploy the `web/` folder to Vercel:

```bash
cd web
npx vercel
```

After deploying, update `API_URL` in `extension/config.js` to your production URL.

## Bias Scale

| Score | Meaning |
|-------|---------|
| 0 | No bias — factual, balanced reporting |
| 1L / 1R | Slightly biased left / right |
| 2L / 2R | Moderately biased |
| 3L / 3R | Strongly biased |

Analysis considers: editorial vs. factual tone, balance of perspectives, use of conjecture, language framing, and source selection.
