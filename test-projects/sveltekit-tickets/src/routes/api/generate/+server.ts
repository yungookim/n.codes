import type { RequestHandler } from './$types';
import realBackend from '../../../../../shared/real-backend.mjs';

const projectRoot = process.cwd();

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const result = await realBackend.runNodeHandlerForProject(
    projectRoot,
    realBackend.handlers.handleGenerate,
    { body }
  );

  return new Response(result.body, {
    status: result.status,
    headers: result.headers,
  });
};
