# clippy-web

`clippy-web` is a drop-in script for web apps that adds a virtual guide cursor next to the real pointer.

Users hold `Option + X`, ask a question out loud, and the guide:

1. Transcribes speech with Interfaze (`speech_to_text` task mode).
2. Screenshots the page with `html-to-image`.
3. Detects interactive GUI elements and plans tutorial steps.
4. Moves the virtual cursor to click targets.
5. Shows a short explanation bubble beside the cursor for each step.
6. Re-screenshots every few seconds to re-guide or re-plan as the UI changes.

## Tech stack

- Interfaze API (`https://api.interfaze.ai/v1`)
- `html-to-image` for screenshot capture
- TypeScript + Vite library build

## Local setup

```bash
yarn install
yarn build
yarn generate:env
```

Then open `index.html` directly (for example `file:///.../index.html`) to test.
The demo auto-loads `VITE_INTERFAZE_API_KEY` from `.env` via `runtime-env.js`.

## Build

```bash
yarn build
```

Build output:

- `dist/clippy-web.es.js`
- `dist/clippy-web.iife.js`

## Usage (script tag)

```html
<script src="/dist/clippy-web.iife.js"></script>
<script>
  ClippyWeb("YOUR_INTERFAZE_API_KEY", {
    observeIntervalMs: 3500,
    screenshotScale: 0.65
  });
</script>
```

## Usage (Next.js / React style)

```tsx
"use client";
import { useEffect } from "react";

export default function ClippyGuide() {
  useEffect(() => {
    import("clippy-web").then(({ default: ClippyWeb }) => {
      ClippyWeb(process.env.NEXT_PUBLIC_INTERFAZE_KEY ?? "");
    });
  }, []);

  return null;
}
```

## Current behavior

- Hotkey: hold `Option + X` to record; release to transcribe.
- Floating button: click `Start Recording` in the bottom-right; click again to stop.
- Virtual cursor and target highlight are rendered in a fixed overlay.
- Guide advances when the user clicks in the highlighted target area.
- Background observation loop re-runs GUI detection and can re-plan when targets are missing.

## Notes and limitations

- This ships API calls from the browser, so use scoped keys and environment restrictions.
- Accuracy depends on screenshot clarity and UI complexity.
- The planner currently favors concise flows for the visible viewport.

## Environment variable

For local development with Vite, set:

```bash
VITE_INTERFAZE_API_KEY=your_key
```

This project reads it from `.env` when generating `runtime-env.js`.

For direct `file://` testing, run:

```bash
yarn generate:env
```

This generates `runtime-env.js` from `.env`.
