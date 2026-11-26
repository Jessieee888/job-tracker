import "server-only";
import { createHash } from "node:crypto";

export const REPOST_AFTER_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Words that do not identify a company ("Acme Pty Ltd" and "Acme" are the same)
const COMPANY_SUFFIXES = new Set([
  "pty", "ltd", "limited", "inc", "llc", "corp", "corporation", "plc", "gmbh",
]);

function baseNormalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCompany(company: string): string {
  return baseNormalize(company)
    .split(" ")
    .filter((word) => !COMPANY_SUFFIXES.has(word))
    .join(" ");
}

export function normalizeTitle(title: string): string {
  return baseNormalize(title);
}

export function normalizeLocation(location: string): string {
  return baseNormalize(location);
}

export function makeFingerprint(company: string, title: string, location: string): string {
  return [normalizeCompany(company), normalizeTitle(title), normalizeLocation(location)].join("|");
}

export function makeContentHash(title: string, description: string): string {
  return createHash("sha256")
    .update(baseNormalize(`${title} ${description}`))
    .digest("hex");
}

export type IncomingJob = {
  company: string;
  title: string;
  location: string;
  description: string;
};

export type ExistingJob = {
  id: number;
  company: string;
  fingerprint: string;
  contentHash: string | null;
  notifiedAt: Date;
};

export type DedupeDecision =
  | { action: "skip"; reason: string }
  | { action: "insert"; reason: string }
  | { action: "update"; id: number; reason: string }
  | { action: "replace"; detachId: number; reason: string };

export function decideJobAction(
  incoming: IncomingJob,
  byId: ExistingJob | null,
  byFingerprint: ExistingJob | null,
  now: Date = new Date()
): DedupeDecision {
  const fingerprint = makeFingerprint(incoming.company, incoming.title, incoming.location);
  const contentHash = makeContentHash(incoming.title, incoming.description);

  // Step 1: we already have a row with this Adzuna id
  if (byId) {
    if (byId.fingerprint === fingerprint) {
      if (byId.contentHash === contentHash) {
        return { action: "skip", reason: "Same id, same fingerprint, same content" };
      }
      return {
        action: "update",
        id: byId.id,
        reason: "Same id and fingerprint, but the content changed (edited ad)",
      };
    }

    if (normalizeCompany(byId.company) === normalizeCompany(incoming.company)) {
      return {
        action: "update",
        id: byId.id,
        reason: "Same id and company, but title or location changed (edited ad)",
      };
    }

    return {
      action: "replace",
      detachId: byId.id,
      reason: "Same id but a different company (the id was recycled)",
    };
  }

  // Step 2: new id, but the same job may have been reposted
  if (byFingerprint) {
    const ageInDays = (now.getTime() - byFingerprint.notifiedAt.getTime()) / MS_PER_DAY;

    if (ageInDays < REPOST_AFTER_DAYS) {
      return {
        action: "skip",
        reason: `Same fingerprint, shown ${Math.floor(ageInDays)} days ago (duplicate)`,
      };
    }
    return {
      action: "insert",
      reason: `Same fingerprint, but shown ${Math.floor(ageInDays)} days ago (treated as new)`,
    };
  }

  // Step 3: nothing matches
  return { action: "insert", reason: "New job" };
}