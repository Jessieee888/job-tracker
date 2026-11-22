"use client";

import { useState } from "react";

type Application = {
  id: number;
  company: string;
  role: string;
  status: "Applied" | "Interview" | "Offer" | "Rejected";
  date: string;
  description: string;
};

const initialApplications: Application[] = [
  {
    id: 1,
    company: "Contoh Corp",
    role: "Data Intern",
    status: "Applied",
    date: "2026-11-20",
    description: "Looking for a data intern with Python and SQL skills.",
  },
  {
    id: 2,
    company: "Startup Keren",
    role: "Junior Developer",
    status: "Interview",
    date: "2026-11-15",
    description: "Build web features using React and Node.js.",
  },
  {
    id: 3,
    company: "Big Tech",
    role: "AI Intern",
    status: "Rejected",
    date: "2026-11-01",
    description: "Work on machine learning models with the AI team.",
  },
];

export default function Home() {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
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
    };

    setApplications([newApp, ...applications]);
    setCompany("");
    setRole("");
    setDescription("");
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Job Tracker</h1>

      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-6">
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

      <ul className="space-y-3">
        {applications.map((app) => (
          <li key={app.id} className="border rounded-lg p-4">
            <p className="font-semibold">{app.role} @ {app.company}</p>
            <p className="text-sm text-gray-500">{app.status} &bull; {app.date}</p>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-blue-600">
                Job description
              </summary>
              <p className="mt-2 text-sm whitespace-pre-wrap">{app.description}</p>
            </details>
          </li>
        ))}
      </ul>
    </main>
  );
}