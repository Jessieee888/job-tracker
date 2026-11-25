import "server-only";
import { supabase } from "@/lib/supabase";
import type { Application, Status } from "@/lib/types";

const COLUMNS =
  "id, company, role, status, date_added, description, url, match_score, match_details";

type ApplicationRow = {
  id: number;
  company: string;
  role: string;
  status: Status;
  date_added: string;
  description: string;
  url: string;
  match_score: number | null;
  match_details: string | null;
};

function toApplication(row: ApplicationRow): Application {
  const base = {
    id: row.id,
    company: row.company,
    role: row.role,
    status: row.status,
    date: row.date_added,
    description: row.description,
    url: row.url,
  };

  if (row.match_score !== null && row.match_details !== null) {
    return { ...base, matchScore: row.match_score, matchDetails: row.match_details };
  }
  return { ...base, matchScore: null, matchDetails: null };
}

export type NewApplicationInput = {
  company: string;
  role: string;
  description: string;
  url: string;
};

export function parseNewApplication(
  body: unknown
): { value: NewApplicationInput } | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body" };
  }

  const b = body as Record<string, unknown>;
  const company = typeof b.company === "string" ? b.company.trim() : "";
  const role = typeof b.role === "string" ? b.role.trim() : "";
  const description = typeof b.description === "string" ? b.description.trim() : "";
  const url = typeof b.url === "string" ? b.url.trim() : "";

  if (!company || !role || !description || !url) {
    return { error: "Company, role, job description, and link are required" };
  }
  if (!/^https?:\/\//i.test(url)) {
    return { error: "Link must start with http:// or https://" };
  }

  return { value: { company, role, description, url } };
}

export async function listApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select(COLUMNS)
    .order("date_added", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ApplicationRow[]).map(toApplication);
}

export async function createApplication(input: NewApplicationInput): Promise<Application> {
  const { data, error } = await supabase
    .from("applications")
    .insert(input)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return toApplication(data as unknown as ApplicationRow);
}

export async function updateApplicationStatus(
  id: number,
  status: Status
): Promise<Application | null> {
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toApplication(data as unknown as ApplicationRow) : null;
}

export async function saveMatchResult(
  id: number,
  matchScore: number,
  matchDetails: string
): Promise<Application | null> {
  const { data, error } = await supabase
    .from("applications")
    .update({ match_score: matchScore, match_details: matchDetails })
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toApplication(data as unknown as ApplicationRow) : null;
}

export async function deleteApplication(id: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data !== null;
}