"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const MAX_RESUME_LENGTH = 50000;
const MAX_REQUEST_LENGTH = 2000;

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong";
}

export default function ResumePage() {
  const [content, setContent] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/resume")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load resume");
        if (!cancelled && data.resume) {
          setContent(data.resume.content);
          setSpecialRequest(data.resume.specialRequest);
          setSavedAt(data.resume.updatedAt);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/resume", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, specialRequest }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save resume");

      setSavedAt(data.resume.updatedAt);
      setMessage("Saved");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My resume</h1>
        <Link href="/" className="text-sm font-medium text-blue-600 underline">
          Back to tracker
        </Link>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Paste your resume as plain text. It is used to score how well each job fits you.
        Tip: you can leave out your phone number and home address, the scoring does not need them.
      </p>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="resume" className="text-sm font-medium">
            Resume
          </label>
          <textarea
            id="resume"
            className="border rounded px-3 py-2 h-96"
            placeholder={loading ? "Loading..." : "Paste your resume here"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={MAX_RESUME_LENGTH}
            disabled={loading}
            required
          />
          <span className="text-xs text-gray-500">
            {content.length} / {MAX_RESUME_LENGTH} characters
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="special-request" className="text-sm font-medium">
            Special request (optional)
          </label>
          <textarea
            id="special-request"
            className="border rounded px-3 py-2 h-28"
            placeholder="Example: I'm a software engineer, but I also want to see cybersecurity roles."
            value={specialRequest}
            onChange={(e) => setSpecialRequest(e.target.value)}
            maxLength={MAX_REQUEST_LENGTH}
            disabled={loading}
          />
          <span className="text-xs text-gray-500">
            {specialRequest.length} / {MAX_REQUEST_LENGTH} characters. Use it to broaden the search
            or add roles you are interested in. You can change it every time you save.
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {savedAt && `Last saved ${new Date(savedAt).toLocaleString()}`}
          </span>
          <button
            type="submit"
            disabled={loading || saving}
            className="border rounded px-4 py-2 font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {error && <p className="text-red-600 mt-4">{error}</p>}
      {message && <p className="text-green-600 mt-4">{message}</p>}
    </main>
  );
}