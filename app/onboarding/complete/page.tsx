"use client";

import Link from "next/link";
import { SlowLoader } from "../slow-loader";

export default function Complete() {
  return (
    <SlowLoader delay={2500}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re all set!</h1>
          <p className="text-slate-500 mb-8">
            Your account is configured and ready to go. Welcome aboard.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Quick actions</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard"
                className="block text-sm text-indigo-600 hover:underline"
              >
                → Go to Dashboard
              </Link>
              <Link
                href="/table"
                className="block text-sm text-indigo-600 hover:underline"
              >
                → Browse Data Table
              </Link>
              <Link
                href="/"
                className="block text-sm text-indigo-600 hover:underline"
              >
                → Back to Home
              </Link>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-block w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </SlowLoader>
  );
}
