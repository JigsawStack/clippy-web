# Clippy

AI-powered floating mouse that guides users through your web app. Users press **X** to type a question or hold **X** to speak one — Clippy analyzes the page and walks them through each step with a guided cursor.

Powered by [interfaze.ai](https://interfaze.ai).

## Get Started

### 1. Get an API Key

Sign up at [interfaze.ai](https://interfaze.ai) and grab your API key.

### 2. Add the Script

**Via CDN (recommended):**

```html
<script>
  window.ClippyWeb = { apiKey: "YOUR_INTERFAZE_API_KEY" };
</script>
<script
  defer
  src="https://unpkg.com/clippy-web@latest/dist/clippy.min.js"
></script>
```

Or use jsdelivr:

```html
<script>
  window.ClippyWeb = { apiKey: "YOUR_INTERFAZE_API_KEY" };
</script>
<script
  defer
  src="https://cdn.jsdelivr.net/npm/clippy-web@latest/dist/clippy.min.js"
></script>
```

**Via npm:**

```bash
npm install clippy-web
```

Then include the script in your HTML and set the API key before it loads.

That's it. Clippy is now active on your page.

## How It Works

1. **Press X** to open a text input, or **hold X** to speak a question
2. Clippy analyzes the page with interfaze.ai (using the DOM tree and optionally a screenshot) and builds a step-by-step plan
3. A floating cursor guides the user to each element they need to interact with
4. Click near the highlighted element to advance to the next step
5. Press or hold **X** again anytime to ask a new question (interrupts the current guide)

## Framework Examples

### HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <script>
      window.ClippyWeb = { apiKey: "YOUR_INTERFAZE_API_KEY" };
    </script>
    <script
      defer
      src="https://unpkg.com/clippy-web@latest/dist/clippy.min.js"
    ></script>
  </head>
  <body>
    <!-- your app -->
  </body>
</html>
```

### Next.js (App Router)

```tsx
// app/layout.tsx
import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script id="clippy-init" strategy="beforeInteractive">
          {`window.ClippyWeb = { apiKey: "${process.env.NEXT_PUBLIC_INTERFAZE_API_KEY}" };`}
        </Script>
        <Script
          src="https://unpkg.com/clippy-web@latest/dist/clippy.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

### Next.js (Pages Router)

```tsx
// pages/_app.tsx
import type { AppProps } from "next/app";
import Script from "next/script";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script id="clippy-init" strategy="beforeInteractive">
        {`window.ClippyWeb = { apiKey: "${process.env.NEXT_PUBLIC_INTERFAZE_API_KEY}" };`}
      </Script>
      <Script
        src="https://unpkg.com/clippy-web@latest/dist/clippy.min.js"
        strategy="afterInteractive"
      />
      <Component {...pageProps} />
    </>
  );
}
```

## API

### `ClippyWeb.apiKey`

Set your interfaze.ai API key. Must be set **before** the script loads.

```js
window.ClippyWeb = { apiKey: "your-key" };
```

### `ClippyWeb.screenshots`

Enable or disable sending screenshots to interfaze.ai. When `false`, only the DOM tree is sent, which is faster but may be less accurate. Defaults to `true`.

```js
window.ClippyWeb = { apiKey: "your-key", screenshots: false };
```

### `ClippyWeb.init()`

Manually initialize Clippy. Called automatically on script load — only needed if you want to delay initialization.

```js
window.ClippyWeb = { apiKey: "your-key" };
// later...
ClippyWeb.init();
```

## Running the Demo App

The repo includes a Next.js demo app with several test pages (auth, table, dashboard, checkout).

```bash
git clone https://github.com/JigsawStack/translation-widget.git
cd clippy-web
cp .env.example .env
# Add your NEXT_PUBLIC_INTERFAZE_API_KEY to .env
yarn install
yarn dev
```

Open [https://localhost:3000](https://localhost:3000) and press **X** to try it out.

## License

MIT
