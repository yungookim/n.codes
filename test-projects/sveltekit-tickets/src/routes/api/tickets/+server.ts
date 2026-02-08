import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  reporter: string;
  createdAt: string;
  updatedAt: string;
}

const tickets: Ticket[] = [
  {
    id: 1,
    title: 'Login page returns 500 after password reset',
    description: 'After resetting password using the forgot password flow, attempting to login with the new password returns a 500 Internal Server Error. The error appears in the auth service logs as a token validation failure. This affects all users who have reset their passwords in the last 24 hours.',
    status: 'open',
    priority: 'high',
    assignee: 'Mike Chen',
    reporter: 'Sarah Park',
    createdAt: '2025-01-15T09:23:00Z',
    updatedAt: '2025-01-15T14:10:00Z'
  },
  {
    id: 2,
    title: 'Dashboard charts not rendering on Safari 17',
    description: 'The analytics dashboard charts fail to render on Safari 17.2+. The chart containers appear empty with no console errors. This was reported by multiple enterprise customers using macOS Sonoma. Chrome and Firefox work as expected.',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Jane Doe',
    reporter: 'Tom Wilson',
    createdAt: '2025-01-14T16:45:00Z',
    updatedAt: '2025-01-15T11:30:00Z'
  },
  {
    id: 3,
    title: 'CSV export includes deleted records',
    description: 'When exporting data via the CSV export feature, soft-deleted records are being included in the output. The export query does not filter by the deleted_at column. This affects the monthly reporting workflow for compliance teams.',
    status: 'open',
    priority: 'medium',
    assignee: 'Mike Chen',
    reporter: 'Alice Rivera',
    createdAt: '2025-01-13T11:00:00Z',
    updatedAt: '2025-01-14T08:15:00Z'
  },
  {
    id: 4,
    title: 'Update billing page to show annual pricing',
    description: 'The billing page currently only shows monthly pricing. We need to add a toggle that allows users to switch between monthly and annual pricing views. Annual pricing should show the discounted rate with the monthly equivalent.',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'Jane Doe',
    reporter: 'Product Team',
    createdAt: '2025-01-12T14:30:00Z',
    updatedAt: '2025-01-15T09:00:00Z'
  },
  {
    id: 5,
    title: 'Typo in onboarding email template',
    description: 'The welcome email sent during onboarding has a typo in the second paragraph. "Your account has been setup" should read "Your account has been set up". Low priority but affects brand perception.',
    status: 'resolved',
    priority: 'low',
    assignee: 'Tom Wilson',
    reporter: 'Marketing',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-11T10:20:00Z'
  },
  {
    id: 6,
    title: 'Add rate limiting to public API endpoints',
    description: 'Public API endpoints currently have no rate limiting. We need to implement a token bucket rate limiter at 100 requests per minute per API key. This should return 429 Too Many Requests with a Retry-After header when the limit is exceeded.',
    status: 'open',
    priority: 'high',
    assignee: 'Mike Chen',
    reporter: 'Security Team',
    createdAt: '2025-01-09T13:15:00Z',
    updatedAt: '2025-01-10T16:40:00Z'
  }
];

/** Simulated auth check */
function checkAuth(request: Request): boolean {
  // In a real app, validate session cookie or Authorization header
  // For this demo, all requests are considered authenticated
  const authHeader = request.headers.get('authorization');
  return true; // simulated: always authenticated
}

export const GET: RequestHandler = async ({ request }) => {
  if (!checkAuth(request)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  return json(tickets);
};

export const POST: RequestHandler = async ({ request }) => {
  if (!checkAuth(request)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const newTicket: Ticket = {
    id: tickets.length + 1,
    title: body.title || 'Untitled Ticket',
    description: body.description || '',
    status: 'open',
    priority: body.priority || 'medium',
    assignee: body.assignee || 'Unassigned',
    reporter: body.reporter || 'Jane Doe',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  tickets.push(newTicket);
  return json(newTicket, { status: 201 });
};
