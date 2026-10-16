import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import configHandler from '../api/config.ts';
import analyzeHandler from '../api/analyze.ts';
import { createRequestHandler } from '../server/app.ts';
import { AppError } from '../server/provider.ts';
import { baseline } from '../server/rules.ts';
import { responseSchema } from '../shared/schema.ts';

type Handler = (req: IncomingMessage & { body?: unknown }, res: ServerResponse) => Promise<void>;
async function fixture(handler?: Handler, helpers = true) {
  const server = createServer(async (req, res) => {
    if (helpers && req.method === 'POST') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const text = Buffer.concat(chunks).toString();
      // Model Vercel's consumed stream + lazy body getter, including malformed JSON.
      Object.defineProperty(req, 'body', { get: () => JSON.parse(text) });
    }
    await (handler ?? (req.url?.startsWith('/api/config') ? configHandler : analyzeHandler))(req, res);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  return {
    async call(path: string, body?: string, headers: Record<string, string> = {}) {
      return new Promise<{ status: number; body: Record<string, unknown>; type: string | undefined }>((resolve, reject) => {
        const req = request({ hostname: '127.0.0.1', port: (server.address() as AddressInfo).port, path, method: body === undefined ? 'GET' : 'POST', headers: { Host: 'unphishable.vercel.app', ...(body !== undefined ? { 'Content-Type': 'application/json', Origin: 'https://unphishable.vercel.app' } : {}), ...headers } }, res => {
          let data = ''; res.setEncoding('utf8'); res.on('data', chunk => { data += chunk; });
          res.on('end', () => { try { resolve({ status: res.statusCode!, body: JSON.parse(data), type: res.headers['content-type'] }); } catch (error) { reject(error); } });
        });
        req.on('error', reject); req.end(body);
      });
    },
    async close() { server.closeAllConnections(); await new Promise<void>(r => server.close(() => r())); },
  };
}
const input = JSON.stringify({ message: 'Send your password immediately.', mode: 'demo' });

test('actual Vercel entry points return JSON config and demo with parsed bodies, without credentials', async () => {
  const previous = { key: process.env.AI_API_KEY, model: process.env.AI_MODEL };
  process.env.AI_API_KEY = ''; process.env.AI_MODEL = '';
  const app = await fixture();
  try {
    const config = await app.call('/api/config');
    assert.equal(config.status, 200); assert.deepEqual(config.body, { liveAvailable: false });
    assert.match(config.type!, /^application\/json/);
    const result = await app.call('/api/analyze', input);
    assert.equal(result.status, 200); assert.equal(responseSchema.parse(result.body).risk, 'High');
    assert.equal(result.body.mode, 'demo');
    assert.equal((await app.call('/api/analyze', JSON.stringify({ message: 'hello', mode: 'live' }))).status, 503);
    assert.equal((await app.call('/api/analyze', '{')).status, 400);
    assert.equal((await app.call('/api/analyze', JSON.stringify({ message: ' ', mode: 'demo' }))).status, 400);
    assert.equal((await app.call('/api/analyze', JSON.stringify({ message: 'a'.repeat(10001), mode: 'demo' }))).status, 400);
    assert.equal((await app.call('/api/analyze', JSON.stringify({ message: 'a'.repeat(70000), mode: 'demo' }))).status, 413);
    assert.equal((await app.call('/api/analyze')).status, 405);
    assert.equal((await app.call('/api/analyze', input, { 'Content-Type': 'text/plain' })).status, 415);
  } finally {
    await app.close();
    if (previous.key === undefined) delete process.env.AI_API_KEY; else process.env.AI_API_KEY = previous.key;
    if (previous.model === undefined) delete process.env.AI_MODEL; else process.env.AI_MODEL = previous.model;
  }
});
test('hosted handler retains raw body support and enforces HTTPS same-origin on production, preview and custom hosts', async () => {
  const app = await fixture(createRequestHandler({ hosted: true }), false);
  try {
    for (const host of ['unphishable.vercel.app', 'unphishable-git-fix-team.vercel.app', 'decoder.example.org']) {
      assert.equal((await app.call('/api/analyze', input, { Host: host, Origin: `https://${host}` })).status, 200);
    }
    for (const headers of [{ Origin: 'https://evil.example' }, { Origin: 'null' }, { Origin: 'http://unphishable.vercel.app' }, { 'Sec-Fetch-Site': 'cross-site' }, { Origin: 'https://evil.example', 'X-Forwarded-Host': 'evil.example' }] as Record<string, string>[]) {
      assert.equal((await app.call('/api/analyze', input, headers)).status, 403);
    }
    assert.equal((await app.call('/api/analyze', '{')).status, 400);
  } finally { await app.close(); }
});
test('hosted live analysis uses the same provider contract and catches provider failures as JSON', async () => {
  let calls = 0;
  const app = await fixture(createRequestHandler({ hosted: true, provider: { async analyze(message) { calls++; if (message === 'timeout') throw new AppError(504, 'Provider timed out.'); return baseline(message); } } }));
  try {
    assert.deepEqual((await app.call('/api/config')).body, { liveAvailable: true });
    const result = await app.call('/api/analyze', JSON.stringify({ message: 'hello', mode: 'live' }));
    assert.equal(result.status, 200); assert.equal(responseSchema.parse(result.body).mode, 'live');
    const failure = await app.call('/api/analyze', JSON.stringify({ message: 'timeout', mode: 'live' }));
    assert.equal(failure.status, 504); assert.equal(failure.body.error, 'Provider timed out.');
    assert.equal(calls, 2);
  } finally { await app.close(); }
});
test('bad AI configuration cannot crash demo or leak a non-JSON cold-start error', async () => {
  const app = await fixture(createRequestHandler({ hosted: true, getProvider() { throw new Error('invalid secret configuration'); } }));
  try {
    assert.equal((await app.call('/api/analyze', input)).status, 200);
    const config = await app.call('/api/config'); assert.equal(config.status, 500);
    assert.equal(config.body.error, 'Analysis could not be completed. Please try again.');
  } finally { await app.close(); }
});
test('hosted per-instance rate limiting still protects analysis', async () => {
  const app = await fixture(createRequestHandler({ hosted: true, limit: 1 }));
  try {
    assert.equal((await app.call('/api/analyze', input)).status, 200);
    assert.equal((await app.call('/api/analyze', input)).status, 429);
  } finally { await app.close(); }
});
