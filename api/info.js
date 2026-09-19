// Info endpoint: checks a URL quickly (HEAD-style) and reports size/type/name,
// plus whether the origin supports Range requests (needed for parallel download).
export default async function handler(req) {
  const url = new URL(req.url);
  const target = url.searchParams.get('url');

  const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  if (!target) return new Response(JSON.stringify({ error: 'missing url param' }), { status: 400, headers: h });
  if (!/^https?:\/\//i.test(target)) return new Response(JSON.stringify({ error: 'invalid protocol' }), { status: 400, headers: h });

  try {
    const upstream = await fetch(target, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Range': 'bytes=0-0',
      },
      redirect: 'follow',
    });

    const headers = new Headers(upstream.headers);
    const supportsRange = upstream.status === 206;

    let size = parseInt(headers.get('Content-Length') || '0', 10);
    const cr = headers.get('Content-Range');
    if (cr) { const m = cr.match(/\/(\d+)/); if (m) size = parseInt(m[1], 10); }

    const cd = headers.get('Content-Disposition') || '';
    const name = (cd.match(/filename="?([^"]+)"?/) || [])[1] || target.split('/').pop().split('?')[0] || 'download';

    // drain the tiny probe body
    upstream.body && upstream.body.cancel();

    return new Response(JSON.stringify({
      ok: true,
      name,
      type: (headers.get('Content-Type') || 'application/octet-stream').split(';')[0],
      size,
      supportsRange,
    }), { status: 200, headers: h });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'fetch failed: ' + e.message }), { status: 502, headers: h });
  }
}

export const config = { runtime: 'edge' };
