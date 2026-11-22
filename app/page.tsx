"use client";

import { useState } from "react";

type Application = {
  id: number;
  company: string;
  role: string;
  status: "Applied" | "Interview" | "Offer" | "Rejected";
  date: string;
};

const initialApplications: Application[] = [
  { id: 1, company: "Contoh Corp", role: "Data Intern", status: "Applied", date: "2026-11-20" },
  { id: 2, company: "Startup Keren", role: "Junior Developer", status: "Interview", date: "2026-11-15" },
  { id: 3, company: "Big Tech", role: "AI Intern", status: "Rejected", date: "2026-11-01" },
];

export default function Home() {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  function handleAdd(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!company || !role) return;

    const newApp: Application = {
      id: Date.now(),
      company,
      role,
      status: "Applied",
      date: new Date().toISOString().slice(0, 10),
    };

    setApplications([newApp, ...applications]);
    setCompany("");
    setRole("");
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Job Tracker</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
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
          </li>
        ))}
      </ul>
    </main>
  );
}