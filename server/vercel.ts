import { createRequestHandler } from './app.ts';
import { createProvider, type Provider } from './provider.ts';

let provider: Provider | undefined;
// Do not import index.ts: Vercel invokes a handler, not a listening local server.
// Initialize AI lazily inside the handler's error boundary so bad AI configuration
// cannot crash a function at import time or prevent credential-free demo analysis.
export default createRequestHandler({
  hosted: true,
  getProvider() {
    const key = process.env.AI_API_KEY?.trim();
    const model = process.env.AI_MODEL?.trim();
    if (!key || !model) return undefined;
    return provider ??= createProvider({ key, model, baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1' });
  },
});
