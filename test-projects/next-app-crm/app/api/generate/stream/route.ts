const realBackend = require("../../../../../shared/real-backend");
const projectRoot = process.cwd();

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await realBackend.runStreamHandlerForProject(
    projectRoot,
    realBackend.handlers.handleStreamGenerate,
    { body }
  );

  return new Response(result.body, {
    status: result.status,
    headers: result.headers,
  });
}
