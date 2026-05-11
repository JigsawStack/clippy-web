"use client";

import { useRouter } from "next/navigation";
import { SlowLoader } from "../slow-loader";
import { StepBar } from "../step-bar";

export default function Step1() {
  const router = useRouter();

  return (
    <SlowLoader delay={2500}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-lg w-full p-8">
          <StepBar current={1} />
          <h2 className="text-xl font-bold text-slate-900 mb-1">Create your profile</h2>
          <p className="text-sm text-slate-500 mb-6">Tell us a bit about yourself.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/onboarding/step-2");
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-slate-700 mb-1">
                Display Name
              </label>
              <input
                id="display-name"
                type="text"
                placeholder="John Doe"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1">
                Company
              </label>
              <input
                id="company"
                type="text"
                placeholder="Acme Inc."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="role-select" className="block text-sm font-medium text-slate-700 mb-1">
                Role
              </label>
              <select
                id="role-select"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue=""
              >
                <option value="" disabled>Select your role…</option>
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="pm">Product Manager</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition mt-2"
            >
              Continue to Plan Selection
            </button>
          </form>
        </div>
      </div>
    </SlowLoader>
  );
}
