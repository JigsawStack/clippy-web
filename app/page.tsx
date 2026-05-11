import Link from "next/link";

const DEMOS = [
  {
    href: "/auth",
    title: "Authentication",
    desc: "Sign-in form with email, password, social login, and forgot-password flow.",
    tag: "Click flow",
  },
  {
    href: "/table",
    title: "Data Table",
    desc: "20-row table with select-all, row checkboxes, bulk actions, search, and status filters.",
    tag: "Select & filter",
  },
  {
    href: "/dashboard",
    title: "Dashboard",
    desc: "Tabs, nested settings sub-tabs, modal confirmation, and multi-step navigation.",
    tag: "Multi-step",
  },
  {
    href: "/checkout",
    title: "Checkout",
    desc: "3-section form (shipping, payment, review) with type actions and form progression.",
    tag: "Type & navigate",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex flex-col">
      <header className="text-center py-16 px-4">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Clippy Web
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          A floating AI mouse that guides users through your web app.
          Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-sm font-mono">X</kbd> to
          type a question, or hold it to speak.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Clippy is active on every page
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pb-16">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Demo Pages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMOS.map((demo) => (
            <Link
              key={demo.href}
              href={demo.href}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                  {demo.title}
                </h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {demo.tag}
                </span>
              </div>
              <p className="text-sm text-slate-500">{demo.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">How it works</h2>
          <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
            <li>Press <strong>X</strong> to type a question, or hold <strong>X</strong> to speak one.</li>
            <li>Clippy takes a screenshot and analyzes the page with <a href="https://interfaze.ai" className="text-indigo-600 hover:underline" target="_blank" rel="noopener">interfaze.ai</a>.</li>
            <li>A step-by-step plan appears &mdash; the floating mouse guides you to each button or input.</li>
            <li>Click near the target to advance. Clippy re-aligns if you drift away.</li>
            <li>Press or hold <strong>X</strong> again anytime to ask a new question (interrupts the current guide).</li>
          </ol>
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-slate-400">
        clippy-web &middot; Powered by interfaze.ai
      </footer>
    </div>
  );
}
