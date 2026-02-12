/**
 * Proxy GraphQL: /api/graphql → https://oakwoodsys.com/graphql
 * Función Netlify dedicada para evitar 502 con Edge Functions / redirects a URLs externas.
 */
const GRAPHQL_URL = 'https://oakwoodsys.com/graphql';
const TIMEOUT_MS = 26000; // Netlify Functions timeout ~26s

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        {
          error: 'GraphQL request failed',
          message: `HTTP ${response.status}: ${errorText}`,
        },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    return Response.json(data, { headers: corsHeaders });
  } catch (err) {
    if (err?.name === 'AbortError') {
      return Response.json(
        {
          error: 'Request timeout',
          message: 'GraphQL request took too long',
        },
        { status: 504, headers: corsHeaders }
      );
    }
    console.error('[graphql] Proxy error:', err);
    return Response.json(
      {
        error: 'GraphQL proxy error',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
