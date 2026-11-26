import {
  decideJobAction,
  makeContentHash,
  makeFingerprint,
  type ExistingJob,
  type IncomingJob,
} from "@/lib/dedupe";

// Temporary route to check the dedupe rules. It does not touch the database.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not available" }, { status: 404 });
  }

  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const incoming: IncomingJob = {
    company: "Acme Pty Ltd",
    title: "Data Analyst",
    location: "Melbourne, Victoria",
    description: "Analyse data with SQL and Python.",
  };

  // An existing row that matches the incoming job exactly
  const sameJob: ExistingJob = {
    id: 1,
    company: "ACME",
    fingerprint: makeFingerprint("ACME", "Data Analyst", "Melbourne Victoria"),
    contentHash: makeContentHash("Data Analyst", "Analyse data with SQL and Python."),
    notifiedAt: daysAgo(3),
  };

  const scenarios = [
    {
      name: "1. same id, same everything",
      result: decideJobAction(incoming, sameJob, null),
    },
    {
      name: "2. same id, description edited",
      result: decideJobAction(incoming, { ...sameJob, contentHash: "old-hash" }, null),
    },
    {
      name: "3. same id, title changed, same company",
      result: decideJobAction(
        incoming,
        { ...sameJob, fingerprint: "acme|junior data analyst|melbourne victoria" },
        null
      ),
    },
    {
      name: "4. same id, different company (recycled id)",
      result: decideJobAction(
        incoming,
        { ...sameJob, company: "Other Corp", fingerprint: "other|data analyst|melbourne victoria" },
        null
      ),
    },
    {
      name: "5. new id, same fingerprint shown 10 days ago",
      result: decideJobAction(incoming, null, { ...sameJob, notifiedAt: daysAgo(10) }),
    },
    {
      name: "6. new id, same fingerprint shown 120 days ago",
      result: decideJobAction(incoming, null, { ...sameJob, notifiedAt: daysAgo(120) }),
    },
    {
      name: "7. nothing matches",
      result: decideJobAction(incoming, null, null),
    },
  ];

  return Response.json({
    fingerprint: makeFingerprint(incoming.company, incoming.title, incoming.location),
    scenarios,
  });
}