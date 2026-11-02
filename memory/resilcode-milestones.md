# ResilCode AI - Project Milestones & Progress Tracking

## 10% Increments Roadmap

| Milestone | Target | Status | Key Deliverables |
|-----------|--------|--------|------------------|
| **10%** | Foundation, Database & Dual-Auth | Not started | Next.js App Router, Express server, PostgreSQL, Drizzle ORM, Google/GitHub OAuth integrations |
| **20%** | Local Code Ingestion & In-Memory Extraction | Not started | Drag-and-drop workspace UI, stream extraction middleware (adm-zip/unzipper) for RAM buffer processing |
| **30%** | GitHub Repository Sync & Async Task Queues | Not started | Octokit REST API, BullMQ/Redis worker queues for offloading repository processing |
| **40%** | Deterministic AST Scanning Engine | Not started | Semgrep CLI integration with custom rulesets targeting Injection, Secrets, Misconfigurations in JS/TS and Python |
| **50%** | Multi-Model Parallel Generation Engine | Not started | AST prompt wrappers, Vercel AI SDK parallel calls across GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro |
| **60%** | Consensus Evaluation Layer (LLM-as-a-Judge) | Not started | Automated triage pipeline: Semgrep re-scan of candidate patches, evaluator LLM scoring |
| **70%** | Real-Time Logs & Code Diff Viewer | Not started | SSE log streaming, side-by-side Monaco diff viewer with consensus verification badges |
| **80%** | In-Memory Repacking & Local Export | Not started | Line splicing modules to swap vulnerable lines with consensus fixes inside RAM buffers, compressible .zip exports |
| **90%** | Automated GitHub Pull Request Pipeline | Not started | Octokit workflows for branching, committing, and opening Pull Requests on remote repositories |
| **100%** | Posture Dashboard & Final System Polish | Not finalized | Security Posture Dashboard with Code Health Scores, global Deep Royal Blue styling |

## Core Features to Implement
1. **Dual-Ingestion System**: Local .zip uploads (RAM-only) + GitHub OAuth repository sync
2. **Semgrep AST Engine**: Custom rulesets for JS/TS and Python vulnerability detection
3. **Multi-Model Patching**: Parallel GPT-4o + Claude 3.5 Sonnet + Gemini 1.5 Pro generation
4. **Consensus Evaluation**: Semgrep re-scan + LLM-as-a-Judge triage
5. **Interactive Diff Viewer**: Side-by-side Monaco diff (red vulnerable / green fix)
6. **Dual-Delivery Remediation**: In-memory .zip repack + GitHub PR automation
7. **Security Posture Analytics**: Code Health Score, vulnerability distributions, scan history

## Technical Constraints & Requirements
- **Code Privacy**: All local .zip processing must happen in RAM buffers, never written to disk
- **Multi-model Orchestration**: Must use Vercel AI SDK with Promise.all() for parallel LLM calls
- **Consensus Validation**: Generated patches must pass Semgrep re-scan before consideration
- **Color Theme**: Deep Royal Blue (#0F2043) primary, Soft Gray (#F8FAFC) secondary, Pure White (#FFFFFF) background
- **5-Screen Architecture**: Landing → Auth → Ingestion → Scan/Diff → Posture Dashboard
- **Target Languages**: JavaScript/TypeScript (Node.js/Express/Next.js) and Python (Flask/FastAPI/Django)