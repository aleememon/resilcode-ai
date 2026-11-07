"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { uploadProject, type ScanResult } from "@/lib/scans";

const MAX_BYTES = 150 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}

async function validateZip(file: File): Promise<string | null> {
  if (!file.name.toLowerCase().endsWith(".zip"))
    return "Only .zip archives are supported.";
  if (file.size === 0) return "The file is empty.";
  if (file.size > MAX_BYTES) {
    return `This file is ${formatSize(file.size)}. The limit is ${formatSize(MAX_BYTES)}.`;
  }

  // A real zip starts with the bytes "PK\x03\x04".
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isZip =
    head[0] === 0x50 && // P in hexadecimal
    head[1] === 0x4b && // K in hexadecimal
    head[2] === 0x03 &&
    head[3] === 0x04;
  return isZip ? null : "This file is not a valid .zip archive.";
}

export function LocalUploadPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "done">("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chooseFiles = () => {
    if (status === "uploading") return;
    inputRef.current?.click();
  };

  const acceptFile = async (selected: File | undefined) => {
    if (!selected || status === "uploading") return;
    setStatus("idle");
    setResult(null);
    const problem = await validateZip(selected);
    if (problem) {
      setFile(null);
      setError(problem);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError(null);
    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    setStatus("idle");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async () => {
    if (!file || status !== "idle") return;
    setError(null);
    setStatus("uploading");
    try {
      const data = await uploadProject(file);
      setResult(data);
      setStatus("done");
    } catch (uploadError) {
      setStatus("idle");
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed. Please try again.",
      );
    }
  };

  return (
    <section
      aria-labelledby="local-upload-title"
      className="group relative flex flex-col justify-between rounded-xl bg-surface-container/80 p-space-lg shadow-xl backdrop-blur-xl"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-full bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-80 transition-opacity group-hover:opacity-100"
      />

      <div>
        <div className="mb-space-lg flex flex-wrap items-start justify-between gap-space-sm">
          <div className="flex min-w-0 items-center gap-space-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary-container shadow-[0_0_12px_rgba(0,240,255,0.15)]">
              <Icon name="folder_zip" className="text-[22px]" />
            </div>
            <div className="min-w-0">
              <h2
                id="local-upload-title"
                className="font-headline-sm text-headline-sm font-semibold text-on-surface"
              >
                Upload Local Project
              </h2>
              <p className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                A single .zip archive of your project
              </p>
            </div>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(event) => acceptFile(event.target.files?.[0])}
        />

        <div
          onClick={chooseFiles}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            acceptFile(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            "group/drop flex cursor-pointer flex-col items-center justify-center rounded-lg bg-surface-container-lowest/70 p-space-xl text-center transition-all duration-200",
            dragging &&
              "bg-surface-container-lowest ring-1 ring-primary-container/40",
            error && "ring-1 ring-error/60",
          )}
        >
          <div className="mb-space-sm flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low text-primary-container shadow-[0_0_16px_rgba(0,240,255,0.2)] transition-transform group-hover/drop:scale-105">
            <Icon name="cloud_upload" className="text-[28px]" />
          </div>

          <p className="max-w-xs font-body-md text-body-md font-medium text-on-surface">
            Drag and drop your project{" "}
            <span className="font-label-code-sm text-primary">.zip</span>{" "}
            archive here
          </p>

          <div className="mt-space-md">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                chooseFiles();
              }}
              className="flex items-center gap-space-xs rounded bg-surface-container-high px-space-md py-space-xs font-label-code-md text-label-code-md font-medium text-primary shadow-sm transition-all hover:bg-surface-container-highest"
            >
              <Icon name="file_open" className="text-[16px]" />
              <span>Browse Local Files</span>
            </button>
          </div>

          <span className="mt-space-md font-label-code-sm text-label-code-sm text-outline">
            .zip only, up to 150 MB. Files are processed in an isolated
            temporary directory and deleted after the scan.
          </span>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-space-md flex items-center gap-space-xs rounded-lg bg-error-container/20 p-space-sm font-label-code-sm text-label-code-sm text-error"
          >
            <Icon name="error" className="text-[18px]" />
            <span>{error}</span>
          </div>
        ) : null}

        {file ? (
          <div className="mt-space-lg rounded-lg bg-surface-container-lowest/90 p-space-md shadow-sm">
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex min-w-0 items-center gap-space-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-container-high text-tertiary-container">
                  <Icon name="archive" className="text-[18px]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-space-xs">
                    <span className="truncate font-label-code-md text-label-code-md font-semibold text-on-surface">
                      {file.name}
                    </span>
                    <span className="shrink-0 font-label-code-sm text-label-code-sm text-outline">
                      {formatSize(file.size)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-space-3xs font-label-code-sm text-label-code-sm">
                    {status === "done" && result ? (
                      <>
                        <Icon
                          name="check_circle"
                          className="text-[14px] text-tertiary-container"
                        />
                        <span className="text-tertiary-container">
                          {result.fileCount.toLocaleString()}{" "}
                          {result.fileCount === 1 ? "file" : "files"} ingested
                        </span>
                        <span className="text-outline">·</span>
                        <span className="text-outline">
                          {result.skipped.toLocaleString()} skipped
                        </span>
                      </>
                    ) : status === "uploading" ? (
                      <>
                        <Icon
                          name="sync"
                          className="animate-spin text-[14px] text-primary"
                        />
                        <span className="text-primary">
                          Uploading and extracting…
                        </span>
                      </>
                    ) : (
                      <>
                        <Icon
                          name="check_circle"
                          className="text-[14px] text-tertiary-container"
                        />
                        <span className="text-tertiary-container">
                          Valid .zip, ready to upload
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={removeFile}
                disabled={status === "uploading"}
                aria-label="Remove attached file"
                className="p-space-3xs text-outline transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-space-xl">
        <button
          type="button"
          disabled={!file || status !== "idle"}
          aria-busy={status === "uploading"}
          onClick={submit}
          className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-primary-container px-space-lg py-space-sm font-headline-sm text-headline-sm font-bold text-on-primary shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all hover:bg-primary-fixed-dim disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon
            name={
              status === "done"
                ? "check_circle"
                : status === "uploading"
                  ? "sync"
                  : "radar"
            }
            className={cn(
              "text-[20px]",
              status === "uploading" && "animate-spin",
            )}
          />
          <span>
            {status === "uploading"
              ? "Uploading…"
              : status === "done"
                ? "Upload Complete"
                : "Start Security Audit"}
          </span>
        </button>
      </div>
    </section>
  );
}
