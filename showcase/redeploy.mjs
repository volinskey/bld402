/**
 * Redeploy all showcase apps via x402-paid deployment API.
 * Usage: node showcase/redeploy.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { toClientEvmSigner } from '@x402/evm';

const __scriptDir = dirname(fileURLToPath(import.meta.url));
const privateKey = readFileSync(join(__scriptDir, '.wallet'), 'utf-8').trim();
const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
const signer = toClientEvmSigner(account, publicClient);
const client = new x402Client();
client.register('eip155:84532', new ExactEvmScheme(signer));
const fetchPaid = wrapFetchWithPayment(fetch, client);

const apps = [
  { name: 'photo-wall', dir: 'showcase/photo-wall' },
  { name: 'ai-sticker-maker', dir: 'showcase/ai-sticker-maker' },
  { name: 'micro-blog', dir: 'showcase/micro-blog' },
  { name: 'memory-match', dir: 'showcase/memory-match' },
];

function loadEnv(dir) {
  const text = readFileSync(dir + '/.env', 'utf8');
  return Object.fromEntries(
    text.split('\n')
      .filter(l => l && !l.startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
  );
}

for (const app of apps) {
  const env = loadEnv(app.dir);
  let html = readFileSync(app.dir + '/index.html', 'utf8');
  html = html.replace(/\{\{API_URL\}\}/g, env.API_URL || '');
  html = html.replace(/\{\{ANON_KEY\}\}/g, env.ANON_KEY || '');

  const res = await fetchPaid(env.API_URL + '/v1/deployments', {
    method: 'POST',
    headers: { apikey: env.SERVICE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: app.name, project: env.PROJECT_ID, files: [{ file: 'index.html', data: html }] }),
  });
  const data = await res.json();
  if (!res.ok) { console.log(app.name + ': FAILED ' + res.status, data); continue; }
  console.log(app.name + ': deployed ' + data.id);

  if (env.SUBDOMAIN) {
    const subRes = await fetch(env.API_URL + '/v1/subdomains', {
      method: 'POST',
      headers: { apikey: env.SERVICE_KEY, Authorization: 'Bearer ' + env.SERVICE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: env.SUBDOMAIN, deployment_id: data.id, project_id: env.PROJECT_ID }),
    });
    console.log('  subdomain: ' + (subRes.ok ? env.SUBDOMAIN + '.run402.com' : 'FAILED'));
  }
}
