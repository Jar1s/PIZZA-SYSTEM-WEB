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

// Seeded catalog for the storefront. A DRINKS product marked as best seller is
// rendered in the "Best Sellers" section and can be added to the cart with a
// single click (no customization modal, unlike PIZZA/STANGLE).
const products = [
  {
    id: 'e2e-drink-1',
    name: 'Testovacia Limonada',
    description: 'Osviezujuca limonada pre e2e testy.',
    priceCents: 990,
    category: 'DRINKS',
    isActive: true,
    isBestSeller: true,
  },
];

// Recorded state so specs can assert what the storefront actually sent.
const state = {
  orders: [], // raw POST /api/:tenant/orders request bodies, oldest first
  ordersByRequestId: new Map(), // clientRequestId -> order response (idempotency)
  orderSeq: 0,
};

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    // The storefront calls the API cross-origin (port 3000 -> 3100) with
    // credentials: 'include', which requires echoing the exact origin.
    res.setHeader('access-control-allow-origin', origin);
    res.setHeader('access-control-allow-credentials', 'true');
    res.setHeader('vary', 'Origin');
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

async function handleRequest(req, res) {
  const url = new URL(req.url || '/', `http://127.0.0.1:${apiPort}`);

  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'access-control-allow-headers':
        req.headers['access-control-request-headers'] || 'content-type, authorization, x-tenant',
      'access-control-max-age': '600',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/api/tenants/pornopizza' || url.pathname === '/api/tenants/resolve')) {
    sendJson(res, 200, tenant);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/pornopizza/products') {
    sendJson(res, 200, products);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/pornopizza/orders') {
    const body = (await readJsonBody(req)) || {};
    const requestId = body.clientRequestId;

    // Idempotent like the real backend: replaying the same clientRequestId
    // returns the already-created order instead of a duplicate.
    if (requestId && state.ordersByRequestId.has(requestId)) {
      sendJson(res, 201, state.ordersByRequestId.get(requestId));
      return;
    }

    const items = Array.isArray(body.items) ? body.items : [];
    const subtotalCents = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product ? product.priceCents : 0) * (item.quantity || 0);
    }, 0);
    const deliveryFeeCents = Number(body.deliveryFeeCents) || 0;

    const order = {
      id: `e2e-order-${++state.orderSeq}`,
      tenantId: tenant.id,
      userId: body.userId || null,
      status: 'PENDING',
      subtotalCents,
      taxCents: 0,
      deliveryFeeCents,
      totalCents: subtotalCents + deliveryFeeCents,
      customer: body.customer || {},
      address: body.address || {},
      items,
      clientRequestId: requestId || null,
      createdAt: new Date().toISOString(),
    };

    state.orders.push({ receivedAt: new Date().toISOString(), orderId: order.id, ...body });
    if (requestId) {
      state.ordersByRequestId.set(requestId, order);
    }

    sendJson(res, 201, order);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/payments/session') {
    const body = (await readJsonBody(req)) || {};
    const orderId = body.orderId || 'unknown';
    sendJson(res, 200, {
      id: `e2e-payment-${orderId}`,
      redirectUrl: `http://127.0.0.1:${apiPort}/mock-gateway?orderId=${encodeURIComponent(orderId)}`,
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/mock-gateway') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(
      [
        '<!doctype html>',
        '<html lang="en">',
        '<head><meta charset="utf-8"><title>Mock Payment Gateway</title></head>',
        '<body>',
        '<h1>Mock Payment Gateway</h1>',
        `<p>Order: ${url.searchParams.get('orderId') || 'unknown'}</p>`,
        '</body>',
        '</html>',
      ].join('\n'),
    );
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/delivery-zones/pornopizza/calculate-fee') {
    await readJsonBody(req);
    sendJson(res, 200, {
      available: true,
      deliveryFeeCents: 0,
      minOrderCents: null,
      zoneName: 'Bratislava Test Zone',
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/delivery-zones/pornopizza/validate-min-order') {
    await readJsonBody(req);
    sendJson(res, 200, { valid: true, minOrderCents: null, zoneName: 'Bratislava Test Zone' });
    return;
  }

  // Test hook: lets specs assert which orders reached the API.
  if (req.method === 'GET' && url.pathname === '/__mock__/orders') {
    sendJson(res, 200, state.orders);
    return;
  }

  sendJson(res, 404, { message: `No Playwright mock for ${req.method} ${url.pathname}` });
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error('[mock-api] handler error:', error);
    if (!res.headersSent) {
      sendJson(res, 500, { message: 'Mock API internal error' });
    } else {
      res.end();
    }
  });
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
