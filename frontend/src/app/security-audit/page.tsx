import type { Metadata } from "next";
import { SecurityAuditScreen } from "@/components/workspace/SecurityAuditScreen";

export const metadata: Metadata = {
  title: "Active Security Audit — ResilCode AI",
  description:
    "Live AST security audit with real-time finding telemetry, holographic scan status, and engine output.",
};

export default function SecurityAuditPage() {
  return <SecurityAuditScreen />;
}
