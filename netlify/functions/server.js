// Netlify serverless function for Angular SSR
// This uses the @netlify/angular builder approach
const { join } = require('path');
const { createServer } = require('http');
const { parse } = require('url');

const serverMainPath = join(__dirname, '../../dist/oaw/server/server.mjs');

let serverModule;
let reqHandler;

// Initialize the handler
async function initializeHandler() {
  if (!reqHandler) {
    try {
      // Import the server module (ESM)
      serverModule = await import(serverMainPath);
      reqHandler = serverModule.reqHandler;
    } catch (error) {
      console.error('Failed to import server module:', error);
      throw error;
    }
  }
  return reqHandler;
}

exports.handler = async (event, context) => {
  try {
    const handler = await initializeHandler();

    // Create a mock request/response for the handler
    const parsedUrl = parse(event.rawUrl || event.path, true);

    const req = {
      method: event.httpMethod,
      url: parsedUrl.pathname + (parsedUrl.search || ''),
      headers: event.headers,
      connection: {},
      socket: {}
    };

    let statusCode = 200;
    let headers = {};
    let body = '';

    const res = {
      statusCode: 200,
      getHeader: (name) => headers[name.toLowerCase()],
      setHeader: (name, value) => {
        headers[name.toLowerCase()] = value;
      },
      getHeaders: () => headers,
      writeHead: (code, h) => {
        statusCode = code;
        if (h) headers = { ...headers, ...h };
      },
      write: (chunk) => {
        body += chunk;
      },
      end: (chunk) => {
        if (chunk) body += chunk;
      },
      on: () => { },
      once: () => { }
    };

    // Call the handler
    await handler(req, res);

    return {
      statusCode: statusCode || 200,
      headers: {
        'Content-Type': 'text/html',
        ...headers
      },
      body: body
    };
  } catch (error) {
    console.error('Error in server function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
