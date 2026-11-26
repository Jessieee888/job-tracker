import "server-only";
import { supabase } from "@/lib/supabase";
import type { Resume } from "@/lib/types";

const MAX_RESUME_LENGTH = 50000;
const MAX_REQUEST_LENGTH = 2000;

const COLUMNS = "id, content, special_request, updated_at";

type ResumeRow = {
  id: number;
  content: string;
  special_request: string | null;
  updated_at: string;
};

function toResume(row: ResumeRow): Resume {
  return {
    content: row.content,
    specialRequest: row.special_request ?? "",
    updatedAt: row.updated_at,
  };
}

export type ResumeInput = {
  content: string;
  specialRequest: string;
};

export function parseResumeInput(
  body: unknown
): { value: ResumeInput } | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body" };
  }

  const b = body as Record<string, unknown>;

  if (b.specialRequest !== undefined && typeof b.specialRequest !== "string") {
    return { error: "Special request must be text" };
  }

  const content = typeof b.content === "string" ? b.content.trim() : "";
  const specialRequest = typeof b.specialRequest === "string" ? b.specialRequest.trim() : "";

  if (!content) {
    return { error: "Resume text is required" };
  }
  if (content.length > MAX_RESUME_LENGTH) {
    return { error: `Resume is too long (max ${MAX_RESUME_LENGTH} characters)` };
  }
  if (specialRequest.length > MAX_REQUEST_LENGTH) {
    return { error: `Special request is too long (max ${MAX_REQUEST_LENGTH} characters)` };
  }

  return { value: { content, specialRequest } };
}

async function getLatestRow(): Promise<ResumeRow | null> {
  const { data, error } = await supabase
    .from("resumes")
    .select(COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as unknown as ResumeRow | null;
}

export async function getResume(): Promise<Resume | null> {
  const row = await getLatestRow();
  return row ? toResume(row) : null;
}

export async function saveResume(input: ResumeInput): Promise<Resume> {
  const existing = await getLatestRow();

  const values = {
    content: input.content,
    special_request: input.specialRequest || null,
  };

  if (existing) {
    const { data, error } = await supabase
      .from("resumes")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select(COLUMNS)
      .single();

    if (error) throw new Error(error.message);
    return toResume(data as unknown as ResumeRow);
  }

  const { data, error } = await supabase
    .from("resumes")
    .insert(values)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return toResume(data as unknown as ResumeRow);
}