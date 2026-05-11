// Vercel serverless entry point.
// `src/app` exports the Express app; we just hand it to Vercel's @vercel/node
// runtime, which adapts (req, res) signatures to the serverless invocation.
//
// Local dev still uses `src/server.ts` (which calls app.listen) — Vercel never
// runs that file.
import app from "../src/app";

export default app;
