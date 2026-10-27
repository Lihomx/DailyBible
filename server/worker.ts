import type { ExecutionContext } from '@cloudflare/workers-types';
import { app } from './app';
import { Env } from './env';

export default {
  async fetch(
    request: Request,
    env: Env & { ASSETS?: { fetch: typeof fetch } },
    ctx: ExecutionContext
  ) {
    const url = new URL(request.url);

    // Handle /api/* routes via Hono
    if (url.pathname.startsWith('/api/')) {
      return app.fetch(request, env, ctx);
    }

    // Serve static assets from Vite build (dist/) via Cloudflare Workers Static Assets
    if (env.ASSETS) {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status !== 404) {
        return assetRes;
      }
      // SPA fallback to index.html for client-side routes like /bible/gen.1
      return env.ASSETS.fetch(
        new Request(new URL('/index.html', request.url), request)
      );
    }

    return new Response('Not Found', { status: 404 });
  },
};
