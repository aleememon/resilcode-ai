"use client";

import { useEffect, useRef, useState } from "react";
import {
  getScan,
  startScan,
  ScanRequestError,
  type ScanDetail,
} from "@/lib/scans";

export type UseScanState = {
  scan: ScanDetail | null;
  error: string | null;
  /** True when the scan does not exist or belongs to another user. */
  notFound: boolean;
};

/** Delay between status checks while a scan is still running. */
export const SCAN_POLL_MS = 2000;

/**
 * Loads a scan and keeps its status fresh by polling `GET /api/scans/:id`
 * every two seconds until it reaches `completed` or `failed`. An `ingested`
 * scan is claimed automatically with `POST /api/scans/:id/start`.
 */
export function useScan(scanId: string | null): UseScanState {
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const startedFor = useRef<string | null>(null);
  const mounted = useRef(true);
  const retryTimer = useRef<number | undefined>(undefined);
  const [startAttempt, setStartAttempt] = useState(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (retryTimer.current) window.clearTimeout(retryTimer.current);
    };
  }, []);

  useEffect(() => {
    setScan(null);
    setError(null);
    setNotFound(false);
    if (!scanId) return;

    let cancelled = false;
    let timer: number | undefined;

    const schedule = () => {
      timer = window.setTimeout(poll, SCAN_POLL_MS);
    };

    const poll = async () => {
      try {
        const data = await getScan(scanId);
        if (cancelled) return;
        setScan(data);
        setError(null);
        setNotFound(false);
        // Keep polling until the backend reports a terminal state.
        if (data.status !== "completed" && data.status !== "failed") schedule();
      } catch (caught) {
        if (cancelled) return;
        if (caught instanceof ScanRequestError && caught.status === 404) {
          setNotFound(true);
          setError(caught.message);
          return;
        }
        setError(
          caught instanceof Error ? caught.message : "Could not load scan.",
        );
        // Transient failure (network, 5xx): try again on the next tick.
        schedule();
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [scanId]);

  // Claim an ingested scan. `startScan` returns the claimed scan immediately
  // (`202`); the poll above keeps running until the background Semgrep job
  // records `completed` or `failed`.
  useEffect(() => {
    if (!scanId || scan?.status !== "ingested") return;
    if (startedFor.current === scanId) return;
    startedFor.current = scanId;

    startScan(scanId)
      .then((data) => {
        if (!mounted.current) return;
        // The poll may already have seen the terminal state; never move
        // backwards from completed/failed to the just-claimed snapshot.
        setScan((current) =>
          current &&
          (current.status === "completed" || current.status === "failed")
            ? current
            : data,
        );
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!mounted.current) return;
        // 409: another tab already claimed it; polling will follow that run.
        if (caught instanceof ScanRequestError && caught.status === 409) return;
        // 404: nothing to retry.
        if (caught instanceof ScanRequestError && caught.status === 404) return;

        setError(
          caught instanceof Error ? caught.message : "Could not start scan.",
        );
        // Transient failure (scanner busy, network): let the effect try again.
        startedFor.current = null;
        retryTimer.current = window.setTimeout(() => {
          if (mounted.current) setStartAttempt((value) => value + 1);
        }, 5000);
      });
  }, [scanId, scan?.status, startAttempt]);

  return { scan, error, notFound };
}
