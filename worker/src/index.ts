import buildings from '../../content/buildings.json';
import people from '../../content/people.json';
import quizzes from '../../content/quizzes.json';

const CONTENT_TYPE = 'application/json; charset=utf-8';
const ALLOWED_METHODS = 'GET, HEAD';

const BODIES: Readonly<Record<string, string>> = {
  '/buildings.json': JSON.stringify(buildings),
  '/people.json': JSON.stringify(people),
  '/quizzes.json': JSON.stringify(quizzes),
};

async function etagFor(body: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `"${hex}"`;
}

const ETAGS: Readonly<Record<string, string>> = Object.fromEntries(
  await Promise.all(
    Object.entries(BODIES).map(async ([path, body]) => [path, await etagFor(body)] as const),
  ),
);

function jsonHeaders(env: Env, path: string): Headers {
  const headers = new Headers();
  headers.set('Content-Type', CONTENT_TYPE);
  headers.set('Cache-Control', env.CACHE_CONTROL);
  headers.set('ETag', ETAGS[path] ?? '');
  return headers;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const method = request.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: ALLOWED_METHODS },
      });
    }

    const path = new URL(request.url).pathname;
    const body = BODIES[path];
    if (body == null) {
      return new Response('Not Found', { status: 404 });
    }

    const headers = jsonHeaders(env, path);
    if (method === 'HEAD') {
      headers.set('Content-Length', String(new TextEncoder().encode(body).byteLength));
      return new Response(null, { status: 200, headers });
    }
    return new Response(body, { status: 200, headers });
  },
};
