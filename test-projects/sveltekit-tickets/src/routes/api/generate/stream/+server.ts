import type { RequestHandler } from './$types';
import realBackend from '../../../../../../shared/real-backend.mjs';

const projectRoot = process.cwd();

export const POST: RequestHandler = async ({ request }) => {
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
};
