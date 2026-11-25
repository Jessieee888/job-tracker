import {
  createApplication,
  listApplications,
  parseNewApplication,
} from "@/lib/applications";

export async function GET() {
  try {
    const applications = await listApplications();
    return Response.json({ applications });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to load applications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseNewApplication(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const application = await createApplication(parsed.value);
    return Response.json({ application }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to save application" }, { status: 500 });
  }
}