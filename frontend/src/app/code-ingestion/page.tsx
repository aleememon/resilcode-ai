import type { Metadata } from "next";
import { CodeIngestionWorkspace } from "@/components/workspace/CodeIngestionWorkspace";

export const metadata: Metadata = {
  title: "New Scan — ResilCode AI",
  description:
    "Upload a local project archive or import a GitHub repository to initiate an AST security audit.",
};

export default function CodeIngestionPage() {
  return <CodeIngestionWorkspace />;
}
