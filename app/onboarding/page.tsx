"use client";

import Link from "next/link";

export default function OnboardingStart() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-lg w-full p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Acme Platform</h1>
        <p className="text-slate-500 mb-8">
          Let&apos;s get your account set up. This will take about 2 minutes.
          Each step may take a moment to load.
        </p>
        <div className="space-y-3 text-left mb-8">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
            Create your profile
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
            Choose your plan
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">3</span>
            Configure notifications
          </div>
        </div>
        <Link
          href="/onboarding/step-1"
          className="inline-block w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          Get Started
        </Link>
        <p className="mt-4 text-xs text-slate-400">
          Try asking Clippy: &quot;Help me complete the onboarding&quot;
        </p>
      </div>
    </div>
  );
}
