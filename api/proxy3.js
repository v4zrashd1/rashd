// Fast proxy variant #3: HTTP/2 streaming + cache, used for parallel chunk downloads.
export default async function handler(req) {
  const url = new URL(req.url);
  const target = url.searchParams.get('url');

  if (!target) return new Response(JSON.stringify({ error: 'missing url param' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  if (!/^https?:\/\//i.test(target)) return new Response(JSON.stringify({ error: 'invalid protocol' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  try {
    const range = req.headers.get('range');
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        ...(range ? { 'Range': range } : {}),
      },
      redirect: 'follow',
      cache: 'force-cache',
    });

    const headers = new Headers(upstream.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Disposition');

    const cd = headers.get('Content-Disposition');
    if (!cd || !cd.includes('attachment')) {
      const name = target.split('/').pop().split('?')[0] || 'download';
      headers.set('Content-Disposition', 'attachment; filename="' + name + '"');
    }

    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'fetch failed: ' + e.message }), { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

export const config = { runtime: 'edge' };
