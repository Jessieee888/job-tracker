"use client";

import { useState } from "react";

type Status = "Applied" | "Interview" | "Offer" | "Rejected";

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
} & Scoring;

type Category = "Prioritize" | "Still apply" | "Only if you're free" | "Unscored";
type Filter = "All" | Category;

const categories: Category[] = [
  "Prioritize",
  "Still apply",
  "Only if you're free",
  "Unscored",
];

const tabs: Filter[] = ["All", ...categories];

const PRIORITIZE_MIN = 75;
const STILL_APPLY_MIN = 50;

function getCategory(app: Application): Category {
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
    status: "Applied",
    date: "2026-11-20",
    description: "Contoh job description. Looking for a data intern with Python and SQL skills.",
    matchScore: 85,
    matchDetails: "Strong match: Python, SQL, and data analysis all appear in your resume.",
  },
  {
    id: 2,
    company: "Startup Keren",
    role: "Junior Developer",
    status: "Interview",
    date: "2026-11-15",
    description: "Contoh job description. Build web features using React and Node.js.",
    matchScore: 60,
    matchDetails: "Partial match: web skills are relevant, but React is missing from your resume.",
  },
  {
    id: 3,
    company: "Big Tech",
    role: "Mobile Engineer",
    status: "Applied",
    date: "2026-11-01",
    description: "Contoh job description. Build native iOS apps with Swift.",
    matchScore: 30,
    matchDetails: "Weak match: the role needs Swift and iOS experience, which you don't list.",
  },
  {
    id: 4,
    company: "Baru Banget Inc",
    role: "ML Intern",
    status: "Applied",
    date: "2026-11-22",
    description: "Contoh job description. Train and evaluate machine learning models.",
    matchScore: null,
    matchDetails: null,
  },
];

export default function Home() {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [filter, setFilter] = useState<Filter>("All");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");

  function handleAdd(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!company.trim() || !role.trim() || !description.trim()) return;

    const newApp: Application = {
      id: Date.now(),
      company: company.trim(),
      role: role.trim(),
      status: "Applied",
      date: new Date().toISOString().slice(0, 10),
      description: description.trim(),
      matchScore: null,
      matchDetails: null,
    };

    setApplications([newApp, ...applications]);
    setCompany("");
    setRole("");
    setDescription("");
  }
 
  function countFor(tab: Filter) {
    if (tab === "All") return applications.length;
    return applications.filter((app) => getCategory(app) === tab).length;
  }

  const visibleApplications =
    filter === "All"
      ? applications
      : applications.filter((app) => getCategory(app) === filter);

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
            {tab === "All" ? "Show all" : tab} ({countFor(tab)})
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
            <p className="text-sm text-gray-500">{app.status} &bull; {app.date}</p>

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
          </li>
        ))}
      </ul>
    </main>
  );
}