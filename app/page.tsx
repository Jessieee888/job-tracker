"use client";

import { useState } from "react";

type Status = "To apply" | "Applied" | "Interview" | "Offer" | "Rejected";

const statuses: Status[] = ["To apply", "Applied", "Interview", "Offer", "Rejected"];

type Scoring =
  | { matchScore: null; matchDetails: null }
  | { matchScore: number; matchDetails: string };

type Application = {
  id: number;
  company: string;
  role: string;
  status: Status;
  date: string;
  description: string;
  url: string;
} & Scoring;

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

// Kategori yang TIDAK ikut muncul di "Show all"
const hiddenFromAll: Category[] = ["Applied"];

// Batas skor (silakan ubah)
const PRIORITIZE_MIN = 75;
const STILL_APPLY_MIN = 50;

function getCategory(app: Application): Category {
  if (app.status !== "To apply") return "Applied";
  if (app.matchScore === null) return "Unscored";
  if (app.matchScore >= PRIORITIZE_MIN) return "Prioritize";
  if (app.matchScore >= STILL_APPLY_MIN) return "Still apply";
  return "Only if you're free";
}

const initialApplications: Application[] = [
  {
    id: 1,
    company: "Contoh Corp",
    role: "Data Intern",
    status: "To apply",
    date: "2026-11-20",
    description: "Contoh job description. Looking for a data intern with Python and SQL skills.",
    matchScore: 85,
    matchDetails: "Strong match: Python, SQL, and data analysis all appear in your resume.",
    url: "https://example.com/job1",
  },
  {
    id: 2,
    company: "Startup Keren",
    role: "Junior Developer",
    status: "To apply",
    date: "2026-11-15",
    description: "Contoh job description. Build web features using React and Node.js.",
    matchScore: 60,
    matchDetails: "Partial match: web skills are relevant, but React is missing from your resume.",
    url: "https://example.com/job2",
  },
  {
    id: 3,
    company: "Big Tech",
    role: "Mobile Engineer",
    status: "To apply",
    date: "2026-11-01",
    description: "Contoh job description. Build native iOS apps with Swift.",
    matchScore: 30,
    matchDetails: "Weak match: the role needs Swift and iOS experience, which you don't list.",
    url: "https://example.com/job3",
  },
  {
    id: 4,
    company: "Baru Banget Inc",
    role: "ML Intern",
    status: "To apply",
    date: "2026-11-22",
    description: "Contoh job description. Train and evaluate machine learning models.",
    matchScore: null,
    matchDetails: null,
    url: "https://example.com/job4",
  },
  {
    id: 5,
    company: "Data Co",
    role: "Data Analyst Intern",
    status: "Applied",
    date: "2026-11-10",
    description: "Contoh job description. Analyse datasets and build dashboards.",
    matchScore: 80,
    matchDetails: "Strong match: your data analysis and Python skills fit this role well.",
    url: "https://example.com/job5",
  },
];

export default function Home() {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [filter, setFilter] = useState<Filter>("All");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");

  function handleAdd(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!company.trim() || !role.trim() || !description.trim() || !url.trim()) return;
    if (!/^https?:\/\//i.test(url.trim())) return; 

    const newApp: Application = {
      id: Date.now(),
      company: company.trim(),
      role: role.trim(),
      status: "To apply",
      date: new Date().toISOString().slice(0, 10),
      description: description.trim(),
      matchScore: null,
      matchDetails: null,
      url: url.trim(),
    };

    setApplications([newApp, ...applications]);
    setCompany("");
    setRole("");
    setDescription("");
    setUrl("");
  }

  function updateStatus(id: number, status: Status) {
    setApplications(
      applications.map((app) => (app.id === id ? { ...app, status } : app))
    );
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
            title="Link harus diawali http:// atau https://"
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
        <button type="submit" className="border rounded px-4 py-2 font-semibold">
          Add
        </button>
      </form>

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

      {visibleApplications.length === 0 && (
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