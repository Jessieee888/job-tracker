"use client";

import { useEffect, useState } from "react";
import { statuses, type Application, type Status } from "@/lib/types";

type Category =
  | "Prioritize"
  | "Still apply"
  | "Only if you're free"
  | "Unscored"
  | "Applied";
type Filter = "All" | Category;

const categories: Category[] = [
  "Prioritize",
  "Still apply",
  "Only if you're free",
  "Unscored",
  "Applied",
];

const tabs: Filter[] = ["All", ...categories];

const hiddenFromAll: Category[] = ["Applied"];

const PRIORITIZE_MIN = 75;
const STILL_APPLY_MIN = 50;

function getCategory(app: Application): Category {
  if (app.status !== "To apply") return "Applied";
  if (app.matchScore === null) return "Unscored";
  if (app.matchScore >= PRIORITIZE_MIN) return "Prioritize";
  if (app.matchScore >= STILL_APPLY_MIN) return "Still apply";
  return "Only if you're free";
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong";
}

export default function Home() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/applications")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load applications");
        if (!cancelled) setApplications(data.applications);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdd(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!company.trim() || !role.trim() || !description.trim() || !url.trim()) return;
    if (!/^https?:\/\//i.test(url.trim())) return;

    setSaving(true);
    setActionError(null);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          description: description.trim(),
          url: url.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save application");

      setApplications((current) => [data.application, ...current]);
      setCompany("");
      setRole("");
      setDescription("");
      setUrl("");
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: number, status: Status) {
    setActionError(null);

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update status");

      setApplications((current) =>
        current.map((app) => (app.id === id ? data.application : app))
      );
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  function appsFor(tab: Filter) {
    if (tab === "All") {
      return applications.filter((app) => !hiddenFromAll.includes(getCategory(app)));
    }
    return applications.filter((app) => getCategory(app) === tab);
  }

  const visibleApplications = appsFor(filter);

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Job Tracker</h1>

      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-8">
        <div className="flex gap-2">
          <input
            className="border rounded px-3 py-2 flex-1"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
          <input
            className="border rounded px-3 py-2 flex-1"
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          />
          <input
            className="border rounded px-3 py-2"
            type="url"
            placeholder="Apply link (https://...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            pattern="https?://.+"
            title="Link must start with http:// or https://"
            required
          />
        </div>
        <textarea
          className="border rounded px-3 py-2 h-32"
          placeholder="Paste job description here"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="border rounded px-4 py-2 font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add"}
        </button>
      </form>

      {actionError && <p className="text-red-600 mb-4">{actionError}</p>}

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`border rounded-full px-4 py-1 text-sm ${
              filter === tab ? "bg-blue-600 text-white border-blue-600" : ""
            }`}
          >
            {tab === "All" ? "Show all" : tab} ({appsFor(tab).length})
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {loadError && <p className="text-red-600">{loadError}</p>}
      {!loading && !loadError && visibleApplications.length === 0 && (
        <p className="text-gray-500">No applications in this category.</p>
      )}

      <ul className="space-y-3">
        {visibleApplications.map((app) => (
          <li key={app.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{app.role} @ {app.company}</p>
              <span className="text-xs border rounded-full px-2 py-0.5 whitespace-nowrap">
                {getCategory(app)}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <select
                className="border rounded px-2 py-1 text-sm bg-white text-black dark:bg-zinc-800 dark:text-white"
                value={app.status}
                onChange={(e) => updateStatus(app.id, e.target.value as Status)}
              >
                {statuses.map((s) => (
                  <option
                    key={s}
                    value={s}
                    className="bg-white text-black dark:bg-zinc-800 dark:text-white"
                  >
                    {s}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">&bull; {app.date}</span>
            </div>

            {app.matchScore !== null ? (
              <p className="text-sm font-medium mt-1">Match score: {app.matchScore}/100</p>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Not scored yet</p>
            )}

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-blue-600">
                Job description
              </summary>
              <p className="mt-2 text-sm whitespace-pre-wrap">{app.description}</p>
            </details>

            {app.matchScore !== null && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-blue-600">
                  Match details
                </summary>
                <p className="mt-2 text-sm whitespace-pre-wrap">{app.matchDetails}</p>
              </details>
            )}

            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-sm font-medium text-blue-600 underline"
            >
              Visit link
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}