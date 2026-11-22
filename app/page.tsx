const applications = [
  { id: 1, company: "Corp Name", role: "Data Intern", status: "Applied", date: "2026-11-20" },
  { id: 2, company: "Cool Startup", role: "Junior Developer", status: "Interview", date: "2026-11-15" },
  { id: 3, company: "Big Tech", role: "AI Intern", status: "Rejected", date: "2026-11-01" },
];

export default function Home() {
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Job Tracker</h1>
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