import { deleteApplication, updateApplicationStatus } from "@/lib/applications";
import { statuses, type Status } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = (body as { status?: unknown } | null)?.status;
  if (typeof status !== "string" || !statuses.includes(status as Status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const application = await updateApplicationStatus(id, status as Status);
    if (!application) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }
    return Response.json({ application });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const deleted = await deleteApplication(id);
    if (!deleted) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to delete application" }, { status: 500 });
  }
}