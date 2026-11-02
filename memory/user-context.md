# User Context - Final Year Project

## Student Information
- **Project Type**: Final Year Project (FYP) - University
- **Project Name**: ResilCode AI (AI-powered web security platform)
- **Alignment**: Industry 5.0 principles (Resilience and Human-Centricity)
- **Target Audience**: Full-stack developers and "vibe coders"

## Project Scope
- **Focus Areas**: Web security vulnerability detection and remediation
- **Supported Languages**: JavaScript/TypeScript (Node.js, Express, Next.js) and Python (Flask, FastAPI, Django)
- **Vulnerability Categories**: Injection, Cryptographic Failures, Security Misconfigurations (OWASP A03/A05:2025)
- **Delivery Format**: Web platform with 5-screen interface

## Key Requirements from Blueprint
1. **Code Privacy**: Local .zip processing must happen in RAM only
2. **Multi-model AI**: Parallel calls to 3 different LLMs for patch generation
3. **Consensus Validation**: Generated fixes must be validated via Semgrep re-scan
4. **GitHub Integration**: Automated PR creation with formatted changelog
5. **Real-time Features**: SSE log streaming, interactive code diff
6. **Security Posture**: Code Health Score and analytics dashboard

## Success Criteria
- Functional web application with all 5 screens
- Accurate vulnerability detection (minimal false positives)
- Effective AI-generated patches with high consensus
- User-friendly interface with Deep Royal Blue color theme
- Complete end-to-end workflow from ingestion to remediation
- GitHub PR automation working correctly

## Suggested Project Timeline
Given the 10% milestone structure, a typical 14-week semester would allocate:
- Weeks 1-2: Milestone 1 (Foundation, DB, Auth)
- Weeks 3-4: Milestone 2 (Local Ingestion) + start Milestone 3
- Weeks 5-6: Milestone 3 (GitHub Sync) + start Milestone 4
- Weeks 7-8: Milestone 4 (AST Scanning Engine)
- Weeks 9-10: Milestone 5 (Multi-Model Generation)
- Weeks 11-12: Milestone 6 (Consensus Evaluation) + start Milestone 7
- Weeks 13-14: Milestones 7-10 (Diff Viewer, Repackaging, PR Pipeline, Polish)