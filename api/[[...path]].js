// Vercel serverless function for Angular SSR
// This handler routes all requests through the Angular SSR server
const serverMainPath = '../dist/oaw/server/server.mjs';

// Import the server module and get the request handler
let reqHandler;
try {
  const serverModule = await import(serverMainPath);
  reqHandler = serverModule.reqHandler;
} catch (error) {
  console.error('Failed to import server module:', error);
  reqHandler = null;
}

export default async function handler(req, res) {
  if (!reqHandler) {
    return res.status(500).json({ error: 'Server not initialized' });
  }
  return reqHandler(req, res);
}
