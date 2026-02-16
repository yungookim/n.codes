const realBackend = require("../../../../../shared/real-backend");
const projectRoot = process.cwd();

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> | { jobId: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const jobId = resolvedParams?.jobId;

  if (!jobId) {
    return new Response(JSON.stringify({ error: "Job id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await realBackend.runNodeHandlerForProject(
    projectRoot,
    realBackend.handlers.handleGetJob,
    { params: { jobId } }
  );

  return new Response(result.body, {
    status: result.status,
    headers: result.headers,
  });
}
