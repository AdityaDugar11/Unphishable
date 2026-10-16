import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.ts';
import type { AddressInfo } from 'node:net';
import { request } from 'node:http';
async function running(limit = 30) { const server = createApp({ limit }); await new Promise<void>(r => server.listen(0, '127.0.0.1', r)); return { server, url: `http://127.0.0.1:${(server.address() as AddressInfo).port}` }; }
test('API serves demo, validates payloads, disables unconfigured live, and sets security headers', async () => {
  const { server, url } = await running();
  try {
    assert.deepEqual(await (await fetch(url + '/api/config')).json(), { liveAvailable: false });
    const post = (body: unknown) => fetch(url + '/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const response = await post({ message: 'Hello friend', mode: 'demo' });
    assert.equal(response.status, 200); assert.equal((await response.json()).mode, 'demo');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.ok(response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"));
    for (const message of ['', '   ', 'x'.repeat(10001)]) assert.equal((await post({ message, mode: 'demo' })).status, 400);
    assert.equal((await post({ message: 'hello', mode: 'live' })).status, 503);
    assert.equal((await post({ message: 'x'.repeat(70000), mode: 'demo' })).status, 413);
    assert.equal((await fetch(url + '/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
    assert.equal((await fetch(url + '/api/analyze', { method: 'POST', body: 'hello' })).status, 415);
    assert.equal((await fetch(url + '/.env')).status, 404);
    assert.equal((await fetch(url + '/api/config', { headers: { Origin: 'https://evil.example' } })).status, 403);
    const badHost = await new Promise<number | undefined>((resolve, reject) => { const req = request(url + '/api/config', { headers: { Host: 'evil.example' } }, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject); req.end(); });
    assert.equal(badHost, 403);
  } finally { server.closeAllConnections(); await new Promise<void>(r => server.close(() => r())); }
});
test('local request rate limiter returns retry guidance', async () => {
  const { server, url } = await running(1);
  try {
    const post = () => fetch(url + '/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Hi', mode: 'demo' }) });
    assert.equal((await post()).status, 200);
    const limited = await post(); assert.equal(limited.status, 429); assert.ok(limited.headers.get('retry-after'));
  } finally { server.closeAllConnections(); await new Promise<void>(r => server.close(() => r())); }
});
