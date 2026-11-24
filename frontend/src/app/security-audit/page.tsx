import type { Metadata } from "next";
import { Suspense } from "react";
import { SecurityAuditScreen } from "@/components/workspace/SecurityAuditScreen";

export const metadata: Metadata = {
  title: "Active Security Audit — ResilCode AI",
  description:
    "Live Semgrep audit progress, real scan metadata, and finding telemetry for your project.",
};

function AuditFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container-lowest">
      <p className="font-label-code-md text-label-code-md text-on-surface-variant">
        Loading security audit…
      </p>
    </div>
  );
}

export default function SecurityAuditPage() {
  return (
    <Suspense fallback={<AuditFallback />}>
      <SecurityAuditScreen />
    </Suspense>
  );
}
