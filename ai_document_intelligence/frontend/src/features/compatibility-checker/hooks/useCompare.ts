/**
 * Compatibility Checker – compare API and local state
 */

import { useCallback, useState } from "react";
import { getApiBase } from "../../../lib/api";
import type { ComparisonResponse } from "../types";

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Server returned ${response.status}`;
  const text = await response.text();
  if (!text.trim()) return fallback;
  try {
    const err = JSON.parse(text) as { detail?: unknown };
    if (typeof err.detail === "string") return err.detail;
    if (Array.isArray(err.detail)) {
      const parts = err.detail.map((x: unknown) =>
        typeof x === "object" && x && "msg" in x ? String((x as { msg: unknown }).msg) : String(x),
      );
      return parts.join("; ") || fallback;
    }
  } catch {
    /* not JSON */
  }
  return text.trim();
}

export function useCompare() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [result, setResult] = useState<ComparisonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const compare = useCallback(async () => {
    if (!fileA || !fileB) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("pdf_a", fileA);
      formData.append("pdf_b", fileB);

      const response = await fetch(`${getApiBase()}/llm-compare-pdfs`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        setError(await readErrorMessage(response));
        return;
      }

      const data = (await response.json()) as ComparisonResponse;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }, [fileA, fileB]);

  return {
    fileA,
    fileB,
    setFileA,
    setFileB,
    result,
    error,
    isLoading,
    compare,
  };
}
