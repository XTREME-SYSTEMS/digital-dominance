import { next } from '@vercel/functions';
import { classifyRequestPath, renderNotFoundHtml } from './edge-route-policy.mjs';

export default function middleware(request) {
  const url = new URL(request.url);
  const decision = classifyRequestPath(url.pathname);

  if (decision.action === 'redirect') {
    const location = decision.location + (url.search || '');
    return new Response(null, {
      status: decision.status || 308,
      headers: {
        Location: location,
        'Cache-Control': 'public, max-age=0, s-maxage=300',
        'X-Digital-Dominance-Route': decision.reason,
      },
    });
  }

  if (decision.action === 'not_found') {
    return new Response(renderNotFoundHtml(url.pathname), {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=60',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Digital-Dominance-Route': decision.reason,
      },
    });
  }

  return next({
    headers: {
      'X-Digital-Dominance-Route': decision.reason,
    },
  });
}

export const config = {
  matcher: '/:path*',
};
