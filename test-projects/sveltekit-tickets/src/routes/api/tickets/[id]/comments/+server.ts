import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface Comment {
  id: number;
  ticketId: number;
  author: string;
  body: string;
  createdAt: string;
}

const comments: Comment[] = [
  {
    id: 1,
    ticketId: 1,
    author: 'Sarah Park',
    body: 'I can reproduce this consistently. After resetting the password via the email link, the login always returns 500. Checked the auth service logs and it seems like the token refresh is failing.',
    createdAt: '2025-01-15T10:05:00Z'
  },
  {
    id: 2,
    ticketId: 1,
    author: 'Mike Chen',
    body: 'Looking into the token validation logic now. The password reset flow generates a new refresh token but the old session token is not being invalidated properly. Working on a fix.',
    createdAt: '2025-01-15T11:30:00Z'
  },
  {
    id: 3,
    ticketId: 2,
    author: 'Jane Doe',
    body: 'Confirmed this is a WebKit rendering issue with the canvas API. The chart library uses a deprecated compositing mode that Safari 17.2 no longer supports. Investigating a workaround.',
    createdAt: '2025-01-15T09:00:00Z'
  },
  {
    id: 4,
    ticketId: 2,
    author: 'Tom Wilson',
    body: 'Our enterprise client Acme Corp is asking for an ETA on this. They have a board meeting next week and need the dashboard charts working. Can we prioritize?',
    createdAt: '2025-01-15T10:45:00Z'
  },
  {
    id: 5,
    ticketId: 3,
    author: 'Alice Rivera',
    body: 'The compliance team flagged this during their monthly audit. They noticed 47 deleted records appearing in the January export. This needs to be fixed before the next export cycle on Feb 1.',
    createdAt: '2025-01-13T14:20:00Z'
  },
  {
    id: 6,
    ticketId: 4,
    author: 'Jane Doe',
    body: 'Mockups for the annual pricing toggle are ready. Using a pill-style toggle that sits above the pricing cards. Annual pricing shows a 20% discount badge. Will share the Figma link in the PR.',
    createdAt: '2025-01-14T16:00:00Z'
  },
  {
    id: 7,
    ticketId: 6,
    author: 'Mike Chen',
    body: 'Proposing we use a sliding window rate limiter instead of token bucket. It provides smoother rate limiting without the burst issue. I have a proof of concept ready for review.',
    createdAt: '2025-01-10T09:30:00Z'
  },
  {
    id: 8,
    ticketId: 6,
    author: 'Security Team',
    body: 'Sliding window sounds good. Make sure we also add rate limiting headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) to all responses so API consumers can track their usage.',
    createdAt: '2025-01-10T11:15:00Z'
  }
];

let nextId = comments.length + 1;

/** Simulated auth check */
function checkAuth(request: Request): boolean {
  return true; // simulated: always authenticated
}

export const GET: RequestHandler = async ({ params, request }) => {
  if (!checkAuth(request)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ticketId = parseInt(params.id, 10);
  const ticketComments = comments.filter(c => c.ticketId === ticketId);
  return json(ticketComments);
};

export const POST: RequestHandler = async ({ params, request }) => {
  if (!checkAuth(request)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ticketId = parseInt(params.id, 10);
  const body = await request.json();

  const newComment: Comment = {
    id: nextId++,
    ticketId,
    author: body.author || 'Anonymous',
    body: body.body || '',
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  return json(newComment, { status: 201 });
};
