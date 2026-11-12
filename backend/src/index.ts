import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { getTrustedOrigins } from "./origins";
import { scansRouter, recoverInterruptedScans } from "./routes/scans";

const app = express();
const trustedOrigins = getTrustedOrigins();

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin/server-to-server requests send no Origin header. Unknown
      // origins get no CORS headers; Better Auth then rejects them with
      // `403 INVALID_CALLBACK_URL` (a clearer error than a CORS 500).
      callback(null, !origin || trustedOrigins.includes(origin));
    },
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/api/scans", scansRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

await recoverInterruptedScans();
app.listen(5000, () => console.log("Backend on http://localhost:5000"));
