import "server-only";
import { supabase } from "@/lib/supabase";
import {
  decideJobAction,
  makeContentHash,
  makeFingerprint,
  type DedupeDecision,
  type ExistingJob,
} from "@/lib/dedupe";

const SOURCE = "adzuna";

export type DiscoveredJob = {
  externalId: string;
  company: string;
  title: string;
  location: string;
  description: string;
  url: string;
};

const LOOKUP_COLUMNS = "id, company, fingerprint, content_hash, notified_at";

type LookupRow = {
  id: number;
  company: string;
  fingerprint: string | null;
  content_hash: string | null;
  notified_at: string | null;
};

function toExistingJob(row: LookupRow): ExistingJob {
  return {
    id: row.id,
    company: row.company,
    fingerprint: row.fingerprint ?? "",
    contentHash: row.content_hash,
    notifiedAt: row.notified_at ? new Date(row.notified_at) : new Date(0),
  };
}

function cleanJob(job: DiscoveredJob): DiscoveredJob {
  return {
    externalId: job.externalId.trim(),
    company: job.company.trim(),
    title: job.title.trim(),
    location: job.location.trim(),
    description: job.description.trim(),
    url: job.url.trim(),
  };
}

function findProblem(job: DiscoveredJob): string | null {
  if (!job.externalId) return "missing id";
  if (!job.company) return "missing company";
  if (!job.title) return "missing title";
  if (!job.description) return "missing description";
  if (!/^https?:\/\//i.test(job.url)) return "link must start with http:// or https://";
  return null;
}

async function findByExternalId(externalId: string): Promise<ExistingJob | null> {
  const { data, error } = await supabase
    .from("applications")
    .select(LOOKUP_COLUMNS)
    .eq("source", SOURCE)
    .eq("external_id", externalId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toExistingJob(data as unknown as LookupRow) : null;
}

async function findByFingerprint(fingerprint: string): Promise<ExistingJob | null> {
  const { data, error } = await supabase
    .from("applications")
    .select(LOOKUP_COLUMNS)
    .eq("fingerprint", fingerprint)
    .order("notified_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toExistingJob(data as unknown as LookupRow) : null;
}

async function insertJob(job: DiscoveredJob, fingerprint: string, contentHash: string) {
  const { error } = await supabase.from("applications").insert({
    company: job.company,
    role: job.title,
    description: job.description,
    url: job.url,
    source: SOURCE,
    external_id: job.externalId,
    fingerprint,
    content_hash: contentHash,
    notified_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

async function updateJob(
  id: number,
  job: DiscoveredJob,
  fingerprint: string,
  contentHash: string
) {
  const { error } = await supabase
    .from("applications")
    .update({
      company: job.company,
      role: job.title,
      description: job.description,
      url: job.url,
      fingerprint,
      content_hash: contentHash,
      match_score: null,
      match_details: null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

async function releaseExternalId(id: number) {
  const { error } = await supabase
    .from("applications")
    .update({ external_id: null })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function processDiscoveredJob(input: DiscoveredJob): Promise<DedupeDecision> {
  const job = cleanJob(input);

  const problem = findProblem(job);
  if (problem) {
    return { action: "skip", reason: `Invalid job data: ${problem}` };
  }

  const fingerprint = makeFingerprint(job.company, job.title, job.location);
  const contentHash = makeContentHash(job.title, job.description);

  const byId = await findByExternalId(job.externalId);
  const byFingerprint = byId ? null : await findByFingerprint(fingerprint);

  const decision = decideJobAction(job, byId, byFingerprint);

  switch (decision.action) {
    case "skip":
      break;
    case "insert":
      await insertJob(job, fingerprint, contentHash);
      break;
    case "update":
      await updateJob(decision.id, job, fingerprint, contentHash);
      break;
    case "replace":
      await releaseExternalId(decision.detachId);
      await insertJob(job, fingerprint, contentHash);
      break;
  }

  return decision;
}