export type Status = "To apply" | "Applied" | "Interview" | "Offer" | "Rejected";

export const statuses: Status[] = ["To apply", "Applied", "Interview", "Offer", "Rejected"];

export type Scoring =
  | { matchScore: null; matchDetails: null }
  | { matchScore: number; matchDetails: string };

export type Application = {
  id: number;
  company: string;
  role: string;
  status: Status;
  date: string;
  description: string;
  url: string;
} & Scoring;

export type Resume = {
  content: string;
  specialRequest: string;
  updatedAt: string;
};