import { AngularAppEngine, createRequestHandler } from '@angular/ssr'
import { getContext } from '@netlify/angular-runtime/context.mjs'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// Helper function to get Netlify Blobs store (optional, requires @netlify/blobs package)
async function getBlobsStore() {
  try {
    const blobsModule = await import('@netlify/blobs');
    return blobsModule.getStore({ name: 'home-content', consistency: 'strong' });
  } catch (e) {
    // Blobs not available, return null
    return null;
  }
}

const angularAppEngine = new AngularAppEngine()

// Authentication helper functions
// Helper functions for base64 encoding/decoding (compatible with Deno/Edge Functions)
function base64Encode(str: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(unescape(encodeURIComponent(str)));
  }
  // Fallback for Node.js environments
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64');
  }
  // Manual base64 encoding as last resort
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  const input = new TextEncoder().encode(str);
  while (i < input.length) {
    const a = input[i++];
    const b = i < input.length ? input[i++] : 0;
    const c = i < input.length ? input[i++] : 0;
    const bitmap = (a << 16) | (b << 8) | c;
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < input.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < input.length ? chars.charAt(bitmap & 63) : '=';
  }
  return result;
}

function base64Decode(str: string): string {
  if (typeof atob !== 'undefined') {
    return decodeURIComponent(escape(atob(str)));
  }
  // Fallback for Node.js environments
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64').toString();
  }
  // Manual base64 decoding as last resort
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  str = str.replace(/[^A-Za-z0-9\+\/]/g, '');
  while (i < str.length) {
    const encoded1 = chars.indexOf(str.charAt(i++));
    const encoded2 = chars.indexOf(str.charAt(i++));
    const encoded3 = chars.indexOf(str.charAt(i++));
    const encoded4 = chars.indexOf(str.charAt(i++));
    const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
    result += String.fromCharCode((bitmap >> 16) & 255);
    if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
    if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
  }
  return result;
}

function hashPassword(password: string): string {
  return base64Encode(password);
}

function verifyPassword(password: string, hash: string): boolean {
  const hashedInput = hashPassword(password);
  return hashedInput === hash;
}

function generateToken(username: string): string {
  const payload = {
    username,
    timestamp: Date.now()
  };
  return base64Encode(JSON.stringify(payload));
}

function verifyToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = JSON.parse(base64Decode(token));
    const users = initUsers();
    const user = users.find((u: any) => u.username === decoded.username);

    if (user && decoded.username) {
      // Token is valid if it's less than 24 hours old
      const tokenAge = Date.now() - decoded.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (tokenAge < maxAge) {
        return { valid: true, username: decoded.username };
      }
    }
    return { valid: false };
  } catch (error) {
    return { valid: false };
  }
}

function getAuthToken(request: Request): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie (for SSR)
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (cookies['admin_token']) {
      return cookies['admin_token'];
    }
  }

  return null;
}

function initUsers() {
  const dbDir = join(process.cwd(), '.netlify/data');
  const usersPath = join(dbDir, 'users.json');

  // Try to create directory if it doesn't exist, but handle read-only filesystem gracefully
  if (!existsSync(dbDir)) {
    try {
      mkdirSync(dbDir, { recursive: true });
    } catch (error: any) {
      // If we can't create the directory (e.g., read-only filesystem in Netlify),
      // check if the file exists anyway (might be in a different location)
      if (error.name === 'NotCapable' || error.code === 'EACCES' || error.code === 'EROFS') {
        // In read-only environment, try to read from public directory as fallback
        const fallbackPath = join(process.cwd(), 'public', 'users.json');
        if (existsSync(fallbackPath)) {
          return JSON.parse(readFileSync(fallbackPath, 'utf8'));
        }
        // If no file exists, return default users (in-memory only)
        const defaultPassword = 'password123';
        const hashedPassword = hashPassword(defaultPassword);
        return [
          { id: 1, username: 'admin', password: hashedPassword, created_at: new Date().toISOString() },
          { id: 2, username: 'luis', password: hashedPassword, created_at: new Date().toISOString() },
          { id: 3, username: 'jason', password: hashedPassword, created_at: new Date().toISOString() }
        ];
      }
      throw error;
    }
  }

  // If file doesn't exist, try to create it
  if (!existsSync(usersPath)) {
    const defaultPassword = 'password123';
    const hashedPassword = hashPassword(defaultPassword);

    const defaultUsers = [
      { id: 1, username: 'admin', password: hashedPassword, created_at: new Date().toISOString() },
      { id: 2, username: 'luis', password: hashedPassword, created_at: new Date().toISOString() },
      { id: 3, username: 'jason', password: hashedPassword, created_at: new Date().toISOString() }
    ];

    try {
      writeFileSync(usersPath, JSON.stringify(defaultUsers, null, 2));
    } catch (error: any) {
      // If we can't write (read-only filesystem), return in-memory users
      if (error.name === 'NotCapable' || error.code === 'EACCES' || error.code === 'EROFS') {
        return defaultUsers;
      }
      throw error;
    }
  }

  // Read and return users
  try {
    return JSON.parse(readFileSync(usersPath, 'utf8'));
  } catch (error) {
    // If we can't read the file, return default users
    const defaultPassword = 'password123';
    const hashedPassword = hashPassword(defaultPassword);
    return [
      { id: 1, username: 'admin', password: hashedPassword, created_at: new Date().toISOString() },
      { id: 2, username: 'luis', password: hashedPassword, created_at: new Date().toISOString() },
      { id: 3, username: 'jason', password: hashedPassword, created_at: new Date().toISOString() }
    ];
  }
}

async function handleAuth(request: Request): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (request.method === 'OPTIONS') {
    return new Response('', { status: 200, headers });
  }

  if (request.method !== 'POST') {
    return Response.json({ success: false, message: 'Method not allowed' }, { status: 405, headers });
  }

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return Response.json({ success: false, message: 'Username and password are required' }, { status: 400, headers });
    }

    const users = initUsers();
    const user = users.find((u: any) => u.username === username);

    if (!user) {
      return Response.json({ success: false, message: 'Invalid credentials' }, { status: 401, headers });
    }

    if (!verifyPassword(password, user.password)) {
      return Response.json({ success: false, message: 'Invalid credentials' }, { status: 401, headers });
    }

    const token = generateToken(username);

    return Response.json({
      success: true,
      token,
      username: user.username
    }, { headers });
  } catch (error) {
    console.error('Auth error:', error);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500, headers });
  }
}

export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
  const context = getContext()
  const pathname = new URL(request.url).pathname;

  // API endpoint for authentication
  if (pathname === '/.netlify/functions/auth' || pathname === '/api/auth') {
    return handleAuth(request);
  }

  // API endpoint for GraphQL proxy (bypasses CORS)
  if (pathname === '/api/graphql') {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Handle OPTIONS preflight request
    if (request.method === 'OPTIONS') {
      return new Response('', { status: 200, headers: corsHeaders });
    }

    // Handle POST request
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const graphqlUrl = 'https://oakwoodsys.com/graphql';

      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 30000); // 30 second timeout

      const signal =
        typeof AbortSignal !== 'undefined' &&
          typeof AbortSignal.any === 'function' &&
          request.signal
          ? AbortSignal.any([timeoutController.signal, request.signal])
          : timeoutController.signal;

      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return Response.json({
          error: 'GraphQL request failed',
          message: `HTTP ${response.status}: ${errorText}`
        }, { status: response.status, headers: corsHeaders });
      }

      const data = await response.json();
      return Response.json(data, { headers: corsHeaders });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        // Timeout o cancelación del cliente (navegación, SSR); no loguear como error
        return Response.json({
          error: 'Request timeout',
          message: 'GraphQL request took too long or was cancelled'
        }, { status: 504, headers: corsHeaders });
      }
      console.error('[graphql] Proxy error:', error);

      return Response.json({
        error: 'GraphQL proxy error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500, headers: corsHeaders });
    }
  }

  // API endpoint for home-content proxy (bypasses CORS)
  if (pathname === '/api/home-content') {
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Handle OPTIONS preflight request
    if (request.method === 'OPTIONS') {
      return new Response('', { status: 200, headers: corsHeaders });
    }

    const token = getAuthToken(request);
    const auth = token ? verifyToken(token) : { valid: false };

    // Handle PUT request (update content - admin only)
    if (request.method === 'PUT') {
      if (!auth.valid) {
        return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }

      try {
        const body = await request.json();

        // Try Netlify Blobs first (optional, requires @netlify/blobs package)
        const blobsStore = await getBlobsStore();
        if (blobsStore) {
          try {
            await blobsStore.set('home-content.json', JSON.stringify(body, null, 2));
            return Response.json({ success: true, message: 'Content updated successfully' }, {
              headers: corsHeaders
            });
          } catch (blobError: any) {
            console.error('[home-content] Error saving to Blobs, falling back to file system:', blobError);
          }
        }

        // Fallback to file system
        const dataDir = join(process.cwd(), '.netlify', 'data');
        const publicDir = join(process.cwd(), 'public');
        const dataPath = join(dataDir, 'home-content.json');
        const publicPath = join(publicDir, 'home-content.json');

        // Try .netlify/data first, then public folder
        let localPath = dataPath;
        if (!existsSync(dataPath)) {
          localPath = publicPath;
        }

        try {
          // Ensure directory exists if using .netlify/data
          if (localPath === dataPath && !existsSync(dataDir)) {
            mkdirSync(dataDir, { recursive: true });
          }

          writeFileSync(localPath, JSON.stringify(body, null, 2), 'utf8');
          return Response.json({ success: true, message: 'Content updated successfully' }, {
            headers: corsHeaders
          });
        } catch (writeError: any) {
          // If we can't write (read-only filesystem)
          if (writeError.name === 'NotCapable' || writeError.code === 'EACCES' || writeError.code === 'EROFS') {
            if (blobsStore) {
              return Response.json({
                success: false,
                message: 'Failed to save content (both Blobs and filesystem failed)'
              }, { status: 500, headers: corsHeaders });
            }
            return Response.json({
              success: false,
              message: 'Cannot write to filesystem (read-only). Netlify Blobs is required.'
            }, { status: 500, headers: corsHeaders });
          }
          throw writeError;
        }
      } catch (error: any) {
        console.error('[home-content] PUT Error:', error);
        return Response.json({
          error: 'Failed to update content',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500, headers: corsHeaders });
      }
    }

    // Handle GET request
    // Try Netlify Blobs first, then file system, then external URL
    const blobsStore = await getBlobsStore();
    if (blobsStore) {
      try {
        const blobData = await blobsStore.get('home-content.json', { type: 'text' });
        if (blobData) {
          const data = typeof blobData === 'string'
            ? JSON.parse(blobData)
            : JSON.parse(new TextDecoder().decode(blobData as ArrayBuffer));
          return Response.json(data, {
            headers: {
              ...corsHeaders,
              'Cache-Control': auth.valid ? 'no-cache' : 'public, max-age=3600, stale-while-revalidate=86400'
            }
          });
        }
      } catch (blobError: any) {
        console.warn('[home-content] Error reading from Blobs, falling back to file system:', blobError);
      }
    }

    // Try file system: .netlify/data first, then public folder
    const dataPath = join(process.cwd(), '.netlify', 'data', 'home-content.json');
    const publicPath = join(process.cwd(), 'public', 'home-content.json');
    const localPath = existsSync(dataPath) ? dataPath : publicPath;

    if (existsSync(localPath)) {
      try {
        const data = JSON.parse(readFileSync(localPath, 'utf8'));
        return Response.json(data, {
          headers: {
            ...corsHeaders,
            'Cache-Control': auth.valid ? 'no-cache' : 'public, max-age=3600, stale-while-revalidate=86400'
          }
        });
      } catch (readError: any) {
        console.error('[home-content] Error reading local file:', readError);
      }
    }

    // Fallback to external URL
    const externalUrl = 'https://oakwoodsys.com/wp-content/uploads/2025/12/home-content.json';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(externalUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        // If external fails, try local file as last resort
        if (existsSync(localPath)) {
          try {
            const data = JSON.parse(readFileSync(localPath, 'utf8'));
            return Response.json(data, {
              headers: {
                ...corsHeaders,
                'Cache-Control': auth.valid ? 'no-cache' : 'public, max-age=3600, stale-while-revalidate=86400'
              }
            });
          } catch (readError: any) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return Response.json(data, {
        headers: {
          ...corsHeaders,
          'Cache-Control': auth.valid ? 'no-cache' : 'public, max-age=3600, stale-while-revalidate=86400'
        }
      });
    } catch (error: any) {
      // Last resort: try local file if it exists
      if (existsSync(localPath)) {
        try {
          const data = JSON.parse(readFileSync(localPath, 'utf8'));
          return Response.json(data, {
            headers: {
              ...corsHeaders,
              'Cache-Control': auth.valid ? 'no-cache' : 'public, max-age=3600, stale-while-revalidate=86400'
            }
          });
        } catch (readError: any) {
          console.error('[home-content] Failed to read local file:', readError);
        }
      }

      if (error.name === 'AbortError') {
        return Response.json({
          error: 'Request timeout',
          message: 'External content fetch took too long'
        }, { status: 504, headers: corsHeaders });
      }

      return Response.json({
        error: 'Failed to fetch content',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500, headers: corsHeaders });
    }
  }

  const result = await angularAppEngine.handle(request, context)
  return result || new Response('Not found', { status: 404 })
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler)
