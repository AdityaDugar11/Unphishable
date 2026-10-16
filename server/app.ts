import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { requestSchema, responseSchema } from '../shared/schema.ts';
import { baseline } from './rules.ts';
import { AppError, type Provider } from './provider.ts';
type Middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
export function createApp({ provider, middleware, limit = 30 }: { provider?: Provider; middleware?: Middleware; limit?: number } = {}) {
  const requests = new Map<string, { count: number; expires: number }>();
  let active = 0;
  const json = (res: ServerResponse, status: number, data: unknown) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self'; style-src 'self'${middleware ? " 'unsafe-inline'" : ''}; img-src 'self' data:; connect-src 'self'${middleware ? ' ws://127.0.0.1:* ws://localhost:*' : ''}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`);
    try {
      // Local-only server: reject DNS rebinding and cross-origin requests.
      if (!/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(req.headers.host || '')) throw new AppError(403, 'This application only accepts local requests.');
      const origin = req.headers.origin;
      if (origin && origin !== `http://${req.headers.host}`) throw new AppError(403, 'Cross-origin requests are not allowed.');
      if (req.headers['sec-fetch-site'] === 'cross-site') throw new AppError(403, 'Cross-site requests are not allowed.');
      const path = new URL(req.url || '/', 'http://localhost').pathname;
      if (path === '/api/config' && req.method === 'GET') return json(res, 200, { liveAvailable: Boolean(provider) });
      if (path === '/api/analyze') {
        if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); throw new AppError(405, 'Use POST for analysis.'); }
        if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw new AppError(415, 'Send a JSON request.');
        const now = Date.now();
        for (const [key, item] of requests) if (item.expires < now) requests.delete(key);
        const ip = req.socket.remoteAddress || 'local';
        const entry = requests.get(ip) || { count: 0, expires: now + 60000 };
        if (++entry.count > limit) { res.setHeader('Retry-After', String(Math.max(1, Math.ceil((entry.expires - now) / 1000)))); throw new AppError(429, 'Too many requests. Please wait a minute.'); }
        requests.set(ip, entry);
        if (active >= 4) throw new AppError(429, 'The analyzer is busy. Please try again shortly.');
        active++;
        try {
          let size = 0; const chunks: Buffer[] = [];
          for await (const chunk of req) { size += chunk.length; if (size > 65536) throw new AppError(413, 'The request is too large. Use at most 10,000 characters.'); chunks.push(Buffer.from(chunk)); }
          let raw: unknown;
          try { raw = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AppError(400, 'The request must contain valid JSON.'); }
          const parsed = requestSchema.safeParse(raw);
          if (!parsed.success) throw new AppError(400, 'Enter a nonempty message of at most 10,000 characters and choose a valid mode.');
          const { message, mode } = parsed.data;
          const checks = baseline(message);
          if (mode === 'live' && !provider) throw new AppError(503, 'Live AI is not configured. Select demo mode, or configure an API key and model on the server.');
          const analysis = mode === 'live' ? await provider!.analyze(message, checks) : checks;
          return json(res, 200, responseSchema.parse({ ...analysis, mode, notice: mode === 'live' ? 'Live AI analysis with tentative rule checks. Evidence quotes were checked against your message. Findings are decision support, not proof of intent.' : 'Demonstration mode · English phrase rules, not live AI. No message was sent to an AI provider.' }));
        } finally { active--; }
      }
      if (path.startsWith('/api/')) throw new AppError(404, 'Endpoint not found.');
      if (middleware) return middleware(req, res, () => json(res, 404, { error: 'Not found.' }));
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new AppError(405, 'Method not allowed.');
      // Serve only public build artifacts; never source, environment, or arbitrary paths.
      if (path !== '/' && !/^\/assets\/[a-zA-Z0-9_.-]+$/.test(path)) throw new AppError(404, 'Not found.');
      const file = resolve('dist', path === '/' ? 'index.html' : path.slice(1));
      let body: Buffer;
      try { body = await readFile(file); } catch { throw new AppError(404, 'Build files not found. Run npm run build first.'); }
      const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
      res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      if (res.headersSent || res.destroyed) return;
      const known = error instanceof AppError;
      json(res, known ? error.status : 500, { error: known ? error.message : 'Analysis could not be completed. Please try again.' });
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  return server;
}
