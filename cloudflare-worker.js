const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxS-M_WE3zkT7gR5kIuyka1DOOpGfgPCJInnpplpsik_RRfBQ6ULUDA9l8xlTVNgU_y/exec';

const ALLOWED_ORIGINS = [
  'https://schoolrecords.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    if (request.method !== 'GET' && request.method !== 'POST') {
      return jsonError('Method not allowed', 405, origin);
    }

    try {
      const targetUrl = APPS_SCRIPT_URL + (url.search || '');

      const init = {
        method: request.method,
        redirect: 'follow',
        headers: {
          'User-Agent': 'CF-Worker-THDienLien/1.0',
        },
      };

      if (request.method === 'POST') {
        init.body = await request.text();
        init.headers['Content-Type'] =
          request.headers.get('Content-Type') || 'application/x-www-form-urlencoded';
      }

      const upstream = await fetch(targetUrl, init);
      const body = await upstream.text();

      const isJsonp = url.searchParams.has('callback');
      const contentType = isJsonp
        ? 'application/javascript; charset=utf-8'
        : 'application/json; charset=utf-8';

      return new Response(body, {
        status: upstream.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
          ...corsHeaders(origin),
        },
      });
    } catch (err) {
      return jsonError('Proxy error: ' + err.message, 502, origin);
    }
  },
};

function corsHeaders(origin) {
  let allowOrigin = '*';
  if (ALLOWED_ORIGINS.length > 0) {
    const matched = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
    allowOrigin = matched ? origin : ALLOWED_ORIGINS[0];
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonError(message, status, origin) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
    },
  });
}
