import type { Metadata } from "next";
import { ScanDashboard } from "@/components/workspace/ScanDashboard";

export const metadata: Metadata = {
  title: "Code Review Dashboard — ResilCode AI",
  description:
    "Review Semgrep findings for your project: severity, category, file, line, CWE, and the vulnerable code excerpt.",
};

export default function ScanPage({ params }: { params: { id: string } }) {
  return <ScanDashboard scanId={params.id} />;
}
