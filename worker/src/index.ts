import "dotenv/config";
import express from "express";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { monthlyReportGenerate } from "./inngest/functions/monthly-report.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "monthly-report-worker" });
});

const serveHost = process.env.INNGEST_SERVE_HOST;
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [monthlyReportGenerate],
    ...(serveHost && { serveHost }),
  })
);

app.listen(port, "0.0.0.0", () => {
  console.log(`Worker listening on http://localhost:${port}`);
  console.log(`Inngest endpoint: http://localhost:${port}/api/inngest`);
});
