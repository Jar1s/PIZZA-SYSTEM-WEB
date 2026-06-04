const http = require('http');
const { spawn } = require('child_process');

const apiPort = Number(process.env.PLAYWRIGHT_MOCK_API_PORT || 3100);

const tenant = {
  id: 'test-tenant-pornopizza',
  name: 'PornoPizza',
  slug: 'pornopizza',
  domain: 'p0rnopizza.sk',
  subdomain: 'pornopizza',
  description: 'Test tenant for Playwright smoke tests.',
  currency: 'EUR',
  isActive: true,
  paymentProvider: 'gopay',
  theme: {
    primaryColor: '#E91E63',
    secondaryColor: '#0F141A',
    logo: '/logos/pornopizza-pink-gradient.png',
    favicon: '/favicon.ico',
    fontFamily: 'Inter, sans-serif',
  },
  paymentConfig: {},
  deliveryConfig: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${apiPort}`);

  if (req.method === 'GET' && (url.pathname === '/api/tenants/pornopizza' || url.pathname === '/api/tenants/resolve')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(tenant));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/pornopizza/products') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ message: `No Playwright mock for ${req.method} ${url.pathname}` }));
});

server.listen(apiPort, '127.0.0.1', () => {
  const child = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_TENANT_SLUG: 'pornopizza',
      NEXT_PUBLIC_API_URL: `http://127.0.0.1:${apiPort}`,
      NEXT_TELEMETRY_DISABLED: '1',
    },
  });

  const shutdown = () => {
    child.kill('SIGTERM');
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  child.on('exit', (code) => {
    server.close(() => process.exit(code ?? 0));
  });
});
