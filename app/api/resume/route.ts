import { getResume, parseResumeInput, saveResume } from "@/lib/resume";

export async function GET() {
  try {
    const resume = await getResume();
    return Response.json({ resume });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to load resume" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseResumeInput(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const resume = await saveResume(parsed.value);
    return Response.json({ resume });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to save resume" }, { status: 500 });
  }
}