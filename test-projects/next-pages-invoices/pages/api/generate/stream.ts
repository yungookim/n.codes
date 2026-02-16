import type { NextApiRequest, NextApiResponse } from "next";

const realBackend = require("../../../../shared/real-backend");
const projectRoot = process.cwd();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  await realBackend.handleStreamGenerateForProject(projectRoot, req, res);
}
