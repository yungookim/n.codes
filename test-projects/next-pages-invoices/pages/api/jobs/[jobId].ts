import type { NextApiRequest, NextApiResponse } from "next";

const realBackend = require("../../../../shared/real-backend");
const projectRoot = process.cwd();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawJobId = req.query.jobId;
  const jobId = Array.isArray(rawJobId) ? rawJobId[0] : rawJobId;
  if (!jobId) {
    return res.status(400).json({ error: "Job id is required" });
  }

  const reqWithParams = { params: { jobId } };
  await realBackend.handleGetJobForProject(projectRoot, reqWithParams, res);
}
