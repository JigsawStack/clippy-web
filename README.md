# clippy-web

A floating AI mouse that guides users through any web app. Hold **X** to ask a question by voice, and Clippy moves to each button/input you need to interact with, showing step-by-step instructions.

## How it works

1. User holds X and speaks a question ("How do I delete inactive users?")
2. The widget captures a screenshot + DOM accessibility tree via `html-to-image`
3. One call to [interfaze.ai](https://interfaze.ai) generates a full step-by-step plan
4. Clippy animates to each target element with instruction bubbles
5. After every click/type/scroll, a background re-plan call runs speculatively to stay accurate if the page mutates

## Quick start

```bash
# 1. Install dependencies
yarn

# 2. Set your interfaze.ai API key
cp .env.example .env.local
# Edit .env.local and add your INTERFAZE_API_KEY

# 3. Run the dev server (widget auto-builds via predev)
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo pages.

## Demo pages

| Page | Path | Tests |
|------|------|-------|
| Auth | `/auth` | Click flows, mode switching, social login |
| Table | `/table` | Select-all, row checkboxes, bulk actions, search, filters |
| Dashboard | `/dashboard` | Tabs, sub-tabs, modal confirmation |
| Checkout | `/checkout` | Multi-section form, type actions, step navigation |

## Embedding in your own app

Add a single script tag to any HTML page:

```html
<script src="https://your-host.com/clippy.js" data-clippy-endpoint="https://your-host.com/api/clippy/plan" defer></script>
```

The widget auto-initializes, mounts in a shadow DOM (no CSS conflicts), and listens for X hold-to-talk.

## Architecture

- **`widget/`** — Self-contained TypeScript bundle (esbuild → `public/clippy.js`)
  - `cursor.ts` — Shadow-DOM floating mouse + speech bubble + pulse ring
  - `recorder.ts` — X hold-to-talk via Web Speech API
  - `snapshot.ts` — Viewport screenshot + full-page DOM tree extraction
  - `executor.ts` — Step walker with 3-layer verification pipeline
  - `types.ts` — Shared zod schemas (`PlanSchema`, `StepSchema`)
- **`app/api/clippy/plan/`** — Next.js route that proxies to interfaze.ai via Vercel AI SDK
- **`lib/interfaze.ts`** — OpenAI-compatible provider pointed at interfaze.ai

## Efficiency pipeline

1. **Layer 1:** One blocking `generateObject` call per question (screenshot + DOM → full step plan)
2. **Layer 2:** Post-action local verification via MutationObserver (no API call if DOM is stable)
3. **Layer 3:** Speculative background re-plan on every click/type/scroll (hides 15s latency behind user interaction time)

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `INTERFAZE_API_KEY` | Yes | Your [interfaze.ai](https://interfaze.ai/dashboard) API key |
