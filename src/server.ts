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

  // API endpoint for home-content proxy (bypasses CORS)
  if (pathname === '/api/home-content') {
    const token = getAuthToken(request);
    const auth = token ? verifyToken(token) : { valid: false };

    // Handle PUT request (update content - admin only)
    if (request.method === 'PUT') {
      if (!auth.valid) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      try {
        const body = await request.json();

        // Try Netlify Blobs first (works in production) - optional, requires @netlify/blobs package
        const blobsStore = await getBlobsStore();
        if (blobsStore) {
          try {
            await blobsStore.set('home-content.json', JSON.stringify(body, null, 2));
            console.log('[home-content] Successfully saved to Netlify Blobs');
            return Response.json({ success: true, message: 'Content updated successfully' }, {
              headers: {
                'Content-Type': 'application/json'
              }
            });
          } catch (blobError: any) {
            console.error('[home-content] Error saving to Blobs, falling back to file system:', blobError);
            // Fall through to file system attempt
          }
        }

        // Fallback to file system (works in local development)
        const dataDir = join(process.cwd(), '.netlify', 'data');
        const localPath = join(dataDir, 'home-content.json');

        try {
          // Ensure .netlify/data directory exists
          if (!existsSync(dataDir)) {
            try {
              mkdirSync(dataDir, { recursive: true });
              console.log('[home-content] Created .netlify/data directory:', dataDir);
            } catch (mkdirError: any) {
              // If we can't create directory (read-only filesystem), log and continue
              if (mkdirError.name === 'NotCapable' || mkdirError.code === 'EACCES' || mkdirError.code === 'EROFS') {
                console.warn('[home-content] Cannot create .netlify/data directory (read-only filesystem):', mkdirError.message);
                // If Blobs also failed, return error
                if (!blobsStore) {
                  return Response.json({
                    success: false,
                    message: 'Cannot write to filesystem (read-only) and Blobs not available'
                  }, { status: 500 });
                }
              } else {
                throw mkdirError;
              }
            }
          }

          // Write updated content
          writeFileSync(localPath, JSON.stringify(body, null, 2), 'utf8');
          console.log('[home-content] Successfully saved to file system:', localPath);

          return Response.json({ success: true, message: 'Content updated successfully' }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
        } catch (writeError: any) {
          console.error('[home-content] PUT Error writing file:', {
            error: writeError,
            name: writeError?.name,
            message: writeError?.message,
            code: writeError?.code,
            stack: writeError?.stack
          });

          // If we can't write (read-only filesystem in production)
          if (writeError.name === 'NotCapable' || writeError.code === 'EACCES' || writeError.code === 'EROFS') {
            // If Blobs is available but failed, that's a real error
            if (blobsStore) {
              return Response.json({
                success: false,
                message: 'Failed to save content (both Blobs and filesystem failed)'
              }, { status: 500 });
            }
            // Otherwise, filesystem is read-only but that's expected in production
            return Response.json({
              success: false,
              message: 'Cannot write to filesystem (read-only). Netlify Blobs is required for production.'
            }, { status: 500 });
          }
          throw writeError;
        }
      } catch (error: any) {
        console.error('[home-content] PUT Error updating home-content.json:', {
          error: error,
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
          code: error?.code
        });
        return Response.json({
          error: 'Failed to update content',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Handle GET request
    // Try Netlify Blobs first, then file system, then external
    console.log('[home-content] GET request - auth.valid:', auth.valid);

    // Try Netlify Blobs first (works in production) - optional, requires @netlify/blobs package
    const blobsStore = await getBlobsStore();
    if (blobsStore) {
      try {
        const blobData = await blobsStore.get('home-content.json', { type: 'text' });
        if (blobData) {
          const data = typeof blobData === 'string' ? JSON.parse(blobData) : JSON.parse(new TextDecoder().decode(blobData as ArrayBuffer));
          console.log('[home-content] Successfully read from Netlify Blobs');
          return Response.json(data, {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': auth.valid ? 'no-cache' : 'public, max-age=3600, stale-while-revalidate=86400'
            }
          });
        } else {
          console.log('[home-content] No data in Blobs, trying file system');
        }
      } catch (blobError: any) {
        console.warn('[home-content] Error reading from Blobs, falling back to file system:', blobError);
      }
    }

    // Fallback to file system (works in local development)
    const dataPath = join(process.cwd(), '.netlify', 'data', 'home-content.json');
    const publicPath = join(process.cwd(), 'public', 'home-content.json');

    // Try .netlify/data first, then public folder
    let localPath = dataPath;
    if (!existsSync(localPath)) {
      localPath = publicPath;
    }
    console.log('[home-content] Trying file system, localPath:', localPath);

    // Try to read local file
    if (existsSync(localPath)) {
      console.log('[home-content] Local file exists, attempting to read');
      try {
        const data = JSON.parse(readFileSync(localPath, 'utf8'));
        console.log('[home-content] Successfully read local file');
        return Response.json(data, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': auth.valid ? 'no-cache' : 'public, max-age=3600, stale-while-revalidate=86400'
          }
        });
      } catch (readError: any) {
        console.error('[home-content] Error reading local file:', {
          error: readError,
          message: readError?.message,
          name: readError?.name,
          stack: readError?.stack
        });
        console.warn('[home-content] Could not read local file, falling back to external');
      }
    } else {
      console.log('[home-content] Local file does not exist, will try external');
    }

    // Fallback to external URL if local file doesn't exist or can't be read
    const externalUrl = 'https://oakwoodsys.com/wp-content/uploads/2025/12/home-content.json';
    console.log('[home-content] Attempting to fetch from external URL:', externalUrl);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('[home-content] Fetch timeout after 5 seconds, aborting');
        controller.abort();
      }, 5000); // 5 second timeout

      const response = await fetch(externalUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      console.log('[home-content] External fetch response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('[home-content] External fetch failed with status:', response.status, response.statusText);
        // If external fetch fails, try to return local file as last resort
        if (existsSync(localPath)) {
          console.log('[home-content] Attempting to use local file as fallback after external failure');
          try {
            const data = JSON.parse(readFileSync(localPath, 'utf8'));
            console.warn('[home-content] Successfully using local file as fallback');
            return Response.json(data, {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': auth.valid ? 'no-cache' : 'public, max-age=3600, stale-while-revalidate=86400'
              }
            });
          } catch (readError: any) {
            console.error('[home-content] Failed to read local file as fallback:', {
              error: readError,
              message: readError?.message,
              name: readError?.name
            });
            // If we can't read local either, throw the original error
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      const data = await response.json();
      console.log('[home-content] Successfully fetched and parsed external content');
      return Response.json(data, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': auth.valid ? 'no-cache' : 'public, max-age=3600, stale-while-revalidate=86400'
        }
      });
    } catch (error: any) {
      console.error('[home-content] Error in fetch attempt:', {
        error: error,
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause
      });

      // Last resort: try to return local file if it exists
      if (existsSync(localPath)) {
        console.log('[home-content] Attempting to use local file as last resort');
        try {
          const data = JSON.parse(readFileSync(localPath, 'utf8'));
          console.warn('[home-content] Successfully using local file as last resort after fetch error');
          return Response.json(data, {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': auth.valid ? 'no-cache' : 'public, max-age=3600, stale-while-revalidate=86400'
            }
          });
        } catch (readError: any) {
          // If we can't read local either, return error
          console.error('[home-content] CRITICAL: Both external and local failed:', {
            fetchError: {
              name: error?.name,
              message: error?.message,
              stack: error?.stack
            },
            readError: {
              name: readError?.name,
              message: readError?.message,
              stack: readError?.stack
            }
          });
          return Response.json({
            error: 'Failed to fetch content',
            message: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      // No local file and external failed
      console.error('[home-content] CRITICAL: No local file available and external fetch failed:', {
        error: error,
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });

      if (error.name === 'AbortError') {
        console.error('[home-content] Request timeout error');
        return Response.json({
          error: 'Request timeout',
          message: 'External content fetch took too long'
        }, { status: 504 });
      }
      return Response.json({
        error: 'Failed to fetch content',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }

  const result = await angularAppEngine.handle(request, context)
  return result || new Response('Not found', { status: 404 })
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler)
