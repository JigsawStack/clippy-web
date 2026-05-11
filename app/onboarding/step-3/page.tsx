"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlowLoader } from "../slow-loader";
import { StepBar } from "../step-bar";

const NOTIFICATIONS = [
  { id: "email-product", label: "Product updates", desc: "New features and improvements" },
  { id: "email-security", label: "Security alerts", desc: "Login attempts and password changes" },
  { id: "email-marketing", label: "Marketing emails", desc: "Tips, offers, and newsletters" },
  { id: "email-weekly", label: "Weekly digest", desc: "Summary of your project activity" },
];

export default function Step3() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    "email-product": true,
    "email-security": true,
    "email-marketing": false,
    "email-weekly": true,
  });

  const toggle = (id: string) => {
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
  };

  return (
    <SlowLoader delay={2000}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-lg w-full p-8">
          <StepBar current={3} />
          <h2 className="text-xl font-bold text-slate-900 mb-1">Configure notifications</h2>
          <p className="text-sm text-slate-500 mb-6">Choose which emails you&apos;d like to receive.</p>

          <div className="space-y-3 mb-6">
            {NOTIFICATIONS.map((n) => (
              <label
                key={n.id}
                htmlFor={n.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                <input
                  id={n.id}
                  type="checkbox"
                  checked={prefs[n.id] ?? false}
                  onChange={() => toggle(n.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-700">{n.label}</div>
                  <div className="text-xs text-slate-400">{n.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/onboarding/step-2")}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => router.push("/onboarding/complete")}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Finish Setup
            </button>
          </div>
        </div>
      </div>
    </SlowLoader>
  );
}
