# ResilCode AI - Final Year Project Technical Blueprint

## Project Overview
ResilCode AI is an automated, AI-powered web security platform engineered for modern full-stack developers and "vibe coders." Aligned with Industry 5.0 principles (Resilience and Human-Centricity), it bridges the gap between enterprise-grade SAST platforms and CLI-only scanners.

## Target Vulnerability Categories
- **Injection (A03/A05:2025)**: SQL injection, dynamic string concatenation in queries, command injection
- **Cryptographic Failures & Hardcoded Secrets (A02/A04:2025)**: Plaintext API keys, hardcoded JWT secrets, unhashed passwords
- **Security Misconfigurations (A05/A02:2025)**: Permissive CORS (origin: '*'), exposed debug flags (debug=True in production), insecure cookie attributes

## Target Languages
- JavaScript/TypeScript: Node.js, Express, Next.js
- Python: Flask, FastAPI, Django

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React, Radix UI
- **Code Editor**: Monaco Editor (@monaco-editor/react)
- **Charts**: Recharts
- **Color Scheme**: Deep Royal Blue (#0F2043), Soft Gray (#F8FAFC), Pure White (#FFFFFF)

### Backend
- **Runtime**: Node.js (v18+), Express.js / Next.js API Routes
- **Database**: PostgreSQL, Drizzle ORM / Prisma
- **Task Queue**: BullMQ, Redis / Inngest
- **Static Analysis**: Semgrep CLI (AST Analysis)

### AI/ML
- **SDK**: Vercel AI SDK (ai package)
- **Model Orchestration**: OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, Google Gemini 1.5 Pro

### Git & Deployment
- **GitHub SDK**: Octokit (GitHub REST SDK)
- **Archive Handling**: adm-zip, unzipper

### Protocols & Auth
- **Auth**: NextAuth.js / Passport.js, SSE (Server-Sent Events), TLS 1.3
- **OAuth**: Dual OAuth (Google & GitHub)

## Screen Architecture (5-Screen Interface)

### Screen 1: Landing Page & Product Showcase
- Header & Navigation with branding
- Hero Section: Automated vulnerability detection + 1-click multi-model remediation
- Feature Grid with 5 key feature cards

### Screen 2: Authentication Modal
- Dual-Auth Selection: "Sign in with Google" vs "Connect with GitHub"
- Session Persistence with encrypted OAuth tokens (AES-256)

### Screen 3: Code Ingestion Workspace
- Dual-Tab Switcher: "Upload Local Project" vs "Import GitHub Repository"
- Drag-and-Drop Zone for .zip files with validation
- GitHub Repository Selector with search and branch selection

### Screen 4: Active Scan Execution & Interactive Diff
- Execution Progress Bar (Ingestion → Semgrep → AI Generation → Consensus)
- Live Terminal Log Feed via SSE
- Interactive Code Diff Editor (Monaco side-by-side)
- Consensus Badge Header
- Action Footer: Download patched .zip or Open GitHub PR

### Screen 5: Security Posture Dashboard
- Code Health Gauge (radial progress)
- Analytics Charts (Recharts): vulnerability distribution
- Scan History Table: filterable list of previous scans

## End-to-End Workflow (5 Steps)

1. **INGESTION LAYER**: User drops .zip archive OR selects GitHub repository
2. **DETERMINISTIC AST SCAN**: Semgrep CLI parses AST for JS/TS and Python
3. **MULTI-MODEL PARALLEL GENERATION**: Vercel AI SDK dispatches to 3 LLMs via Promise.all()
4. **CONSENSUS & TRIAGE LAYER**: 
   - Step A: Re-scan patches with Semgrep AST parser
   - Step B: Evaluator LLM (Judge) scores surviving patches
5. **INTERACTIVE DIFF & DELIVERY**: User reviews diff, chooses download .zip or opens GitHub PR

## Project Milestones (10% Increments)

| Milestone | % Completion | Description |
|-----------|-------------|-------------|
| 1 | 10% | Foundation, Database & Dual-Auth: Next.js App Router, Express server, PostgreSQL, Drizzle ORM, Google/GitHub OAuth |
| 2 | 20% | Local Code Ingestion & In-Memory Extraction: drag-and-drop workspace UI, stream extraction middleware |
| 3 | 30% | GitHub Repository Sync & Async Task Queues: Octokit REST API, BullMQ/Redis worker queues |
| 4 | 40% | Deterministic AST Scanning Engine: Semgrep CLI integration with custom rulesets |
| 5 | 50% | Multi-Model Parallel Generation Engine: AST prompt wrappers, Vercel AI SDK parallel calls |
| 6 | 60% | Consensus Evaluation Layer (LLM-as-a-Judge): automated triage pipeline with Semgrep re-scan |
| 7 | 70% | Real-Time Logs & Code Diff Viewer: SSE log streaming, Monaco diff viewer |
| 8 | 80% | In-Memory Repacking & Local Export: line splicing modules, compressible .zip exports |
| 9 | 90% | Automated GitHub Pull Request Pipeline: Octokit workflows for branching, committing, PR creation |
| 10 | 100% | Posture Dashboard & Final System Polish: Security Posture Dashboard, Deep Royal Blue styling |

## Key Features Summary
- Zero false-positive static analysis (Semgrep AST)
- Multi-model consensus patching (3 LLMs)
- Local .zip privacy (RAM buffer only, no disk writes)
- GitHub PR automation with formatted changelog
- Real-time log streaming via SSE
- Interactive side-by-side code diff visualization
- Code Health Score analytics