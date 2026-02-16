import type { RequestHandler } from './$types';
import realBackend from '../../../../../../shared/real-backend.mjs';

const projectRoot = process.cwd();

export const GET: RequestHandler = async ({ params }) => {
  const jobId = params.jobId;
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'Job id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
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
};
