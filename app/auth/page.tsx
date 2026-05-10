"use client";

import { useState } from "react";
import Link from "next/link";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          &larr; Back to demos
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {mode === "signin" && "Welcome back"}
              {mode === "signup" && "Create your account"}
              {mode === "forgot" && "Reset your password"}
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              {mode === "signin" && "Sign in to access your dashboard"}
              {mode === "signup" && "Get started for free today"}
              {mode === "forgot" && "We'll send you a reset link"}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert(`${mode} submitted!`);
            }}
            className="space-y-4"
          >
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-slate-900"
                />
              </div>
            )}

            {mode !== "forgot" ? (
              <>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-slate-900"
                  />
                </div>
              </>
            ) : (
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Email address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-slate-900"
                />
              </div>
            )}

            {mode === "signin" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              {mode === "signin" && "Sign in"}
              {mode === "signup" && "Create account"}
              {mode === "forgot" && "Send reset link"}
            </button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-3 text-slate-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button className="flex items-center justify-center px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm font-medium text-slate-700">
                  Google
                </button>
                <button className="flex items-center justify-center px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm font-medium text-slate-700">
                  GitHub
                </button>
                <button className="flex items-center justify-center px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm font-medium text-slate-700">
                  Twitter
                </button>
              </div>
            </>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            {mode === "signin" && (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Sign up
                </button>
              </>
            )}
            {mode === "signup" && (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Sign in
                </button>
              </>
            )}
            {mode === "forgot" && (
              <>
                Remember your password?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
