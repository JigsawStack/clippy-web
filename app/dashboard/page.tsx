"use client";

import { useState } from "react";
import Link from "next/link";

const TABS = ["Overview", "Settings", "Billing"] as const;
const SETTINGS_TABS = ["General", "Notifications", "Security", "Danger Zone"] as const;

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [settingsTab, setSettingsTab] = useState<(typeof SETTINGS_TABS)[number]>("General");
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
  });
  const [orgName, setOrgName] = useState("Acme Corp");
  const [timezone, setTimezone] = useState("UTC");

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
          >
            &larr; Back to demos
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
          <button className="px-3 py-1.5 text-sm bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 shadow-sm border border-slate-200 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Total Users", value: "12,453", change: "+12%" },
                { label: "Revenue", value: "$48,290", change: "+8%" },
                { label: "Active Projects", value: "23", change: "+3" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                >
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {[
                  "New user signup: alice@company.com",
                  "Project 'Alpha' deployed to production",
                  "Invoice #1042 paid — $2,400",
                  "Security alert resolved",
                  "Team member Bob promoted to Admin",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <p className="text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Settings" && (
          <div className="flex gap-6">
            <div className="w-48 flex-shrink-0">
              <nav className="space-y-1">
                {SETTINGS_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSettingsTab(tab)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                      settingsTab === tab
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {settingsTab === "General" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-900">General Settings</h2>
                  <div>
                    <label htmlFor="org-name" className="block text-sm font-medium text-slate-700 mb-1">
                      Organization name
                    </label>
                    <input
                      id="org-name"
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-slate-700 mb-1">
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                    >
                      <option>UTC</option>
                      <option>US/Pacific</option>
                      <option>US/Eastern</option>
                      <option>Europe/London</option>
                      <option>Asia/Tokyo</option>
                    </select>
                  </div>
                  <button
                    onClick={() => alert("Settings saved!")}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Save changes
                  </button>
                </div>
              )}

              {settingsTab === "Notifications" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>
                  {(
                    [
                      { key: "email" as const, label: "Email notifications", desc: "Receive updates via email" },
                      { key: "push" as const, label: "Push notifications", desc: "Browser push alerts" },
                      { key: "weekly" as const, label: "Weekly digest", desc: "Summary email every Monday" },
                    ] as const
                  ).map(({ key, label, desc }) => (
                    <label key={key} className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications[key]}
                        onChange={() =>
                          setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label={label}
                      />
                    </label>
                  ))}
                  <button
                    onClick={() => alert("Notification preferences saved!")}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Save changes
                  </button>
                </div>
              )}

              {settingsTab === "Security" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-900">Security</h2>
                  <div>
                    <label htmlFor="current-password" className="block text-sm font-medium text-slate-700 mb-1">
                      Current password
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>
                  <button
                    onClick={() => alert("Password updated!")}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Update password
                  </button>
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-slate-500 mb-3">Add an extra layer of security to your account.</p>
                    <button
                      onClick={() => alert("2FA setup started")}
                      className="px-4 py-2 border border-slate-300 text-sm rounded-lg hover:bg-slate-50 transition font-medium text-slate-700"
                    >
                      Enable 2FA
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === "Danger Zone" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
                  <p className="text-sm text-slate-500">
                    These actions are irreversible. Please proceed with caution.
                  </p>
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h3 className="text-sm font-semibold text-red-800">Delete Organization</h3>
                    <p className="text-sm text-red-600 mt-1">
                      This will permanently delete all data, projects, and team members.
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      Delete organization
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Billing" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Billing</h2>
            <div className="bg-indigo-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-indigo-900">Current plan: Pro</p>
              <p className="text-sm text-indigo-700 mt-1">$29/month &middot; Renews Jan 15, 2025</p>
            </div>
            <div className="space-y-3">
              <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition font-medium">
                Upgrade to Enterprise
              </button>
              <button className="block px-4 py-2 border border-slate-300 text-sm rounded-lg hover:bg-slate-50 transition font-medium text-slate-700">
                View invoices
              </button>
              <button className="block text-sm text-red-600 hover:text-red-700 font-medium">
                Cancel subscription
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Confirm Deletion</h2>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete this organization? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-300 text-sm rounded-lg hover:bg-slate-50 transition font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  alert("Organization deleted!");
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition font-medium"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
