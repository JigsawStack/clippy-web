"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Row {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive" | "Pending";
  joined: string;
}

const ROWS: Row[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: [
    "Alice Chen", "Bob Smith", "Carol Wu", "David Lee", "Eva Martinez",
    "Frank Johnson", "Grace Kim", "Henry Brown", "Iris Taylor", "Jack Wilson",
    "Karen Davis", "Leo Garcia", "Mia Anderson", "Noah Thomas", "Olivia White",
    "Paul Harris", "Quinn Martin", "Rachel Clark", "Sam Lewis", "Tina Walker",
  ][i],
  email: [
    "alice", "bob", "carol", "david", "eva", "frank", "grace", "henry",
    "iris", "jack", "karen", "leo", "mia", "noah", "olivia", "paul",
    "quinn", "rachel", "sam", "tina",
  ][i] + "@company.com",
  role: ["Admin", "Editor", "Viewer", "Editor", "Admin", "Viewer", "Editor", "Viewer", "Admin", "Editor",
    "Viewer", "Editor", "Admin", "Viewer", "Editor", "Viewer", "Admin", "Editor", "Viewer", "Admin"][i],
  status: (["Active", "Inactive", "Pending", "Active", "Active", "Inactive", "Active", "Pending",
    "Active", "Active", "Inactive", "Active", "Pending", "Active", "Active", "Inactive",
    "Active", "Active", "Pending", "Active"] as Row["status"][])[i],
  joined: `2024-${String(((i % 12) + 1)).padStart(2, "0")}-${String(((i % 28) + 1)).padStart(2, "0")}`,
}));

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-slate-100 text-slate-600",
  Pending: "bg-amber-100 text-amber-700",
};

export default function TablePage() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    return ROWS.filter((r) => {
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, statusFilter]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  };

  const toggleRow = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          &larr; Back to demos
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-900 mb-4">Team Members</h1>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search members"
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64 text-slate-900"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
              >
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
                <option>Pending</option>
              </select>

              {selected.size > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-slate-500">
                    {selected.size} selected
                  </span>
                  <button
                    onClick={() => alert(`Deleting ${selected.size} members`)}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Delete selected
                  </button>
                  <button
                    onClick={() => alert(`Exporting ${selected.size} members`)}
                    className="px-3 py-2 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition font-medium"
                  >
                    Export
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition ${
                      selected.has(row.id) ? "bg-indigo-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        aria-label={`Select ${row.name}`}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {row.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {row.role}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[row.status]}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {row.joined}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-400 text-sm"
                    >
                      No members match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 text-sm text-slate-500">
            Showing {filtered.length} of {ROWS.length} members
          </div>
        </div>
      </div>
    </div>
  );
}
