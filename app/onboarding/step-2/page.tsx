"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlowLoader } from "../slow-loader";
import { StepBar } from "../step-bar";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    features: ["5 projects", "1 GB storage", "Community support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    features: ["Unlimited projects", "100 GB storage", "Priority support", "API access"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$99",
    period: "/month",
    features: ["Everything in Pro", "SSO & SAML", "Dedicated account manager", "Custom SLA"],
  },
];

export default function Step2() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <SlowLoader delay={3000}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-2xl w-full p-8">
          <StepBar current={2} />
          <h2 className="text-xl font-bold text-slate-900 mb-1">Choose your plan</h2>
          <p className="text-sm text-slate-500 mb-6">You can change this later in settings.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelected(plan.id)}
                className={`relative text-left border-2 rounded-xl p-4 transition ${
                  selected === plan.id
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-3 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Popular
                  </span>
                )}
                <div className="text-lg font-bold text-slate-900">
                  {plan.price}
                  <span className="text-sm font-normal text-slate-500">{plan.period}</span>
                </div>
                <div className="text-sm font-medium text-slate-700 mb-2">{plan.name}</div>
                <ul className="space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="text-indigo-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/onboarding/step-1")}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => router.push("/onboarding/step-3")}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue to Notifications
            </button>
          </div>
        </div>
      </div>
    </SlowLoader>
  );
}
