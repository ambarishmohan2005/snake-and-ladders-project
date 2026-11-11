// ========================================================
// Snake & Ladders - Casual Hobby Game
// Phase 10: Progressive Web App Service Worker (v12)
// 100% Bulletproof Offline Engine, zero dependencies, GitHub Pages compatible
// ========================================================

const CACHE_NAME = 'snakes-and-ladders-v12';

// Core assets to pre-cache on install
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// Fallback emergency offline HTML in case cache was corrupted or cleared
const EMERGENCY_OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Snake & Ladders - Offline</title>
  <style>
    body {
      margin: 0;
      padding: 2rem;
      background: #0f172a;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      text-align: center;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 1rem;
      padding: 2rem;
      max-width: 440px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    h1 { margin-top: 0; font-size: 1.5rem; color: #38bdf8; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
    button {
      margin-top: 1.5rem;
      background: #4f46e5;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      font-size: 1rem;
    }
    button:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎲 Snake & Ladders</h1>
    <p>The game is cached and ready. If you just reloaded or restarted your dev server, click below to load the fresh game.</p>
    <button onclick="window.location.reload()">Reload Game</button>
  </div>
</body>
</html>`;

// Install: Cache all core assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW v12] Pre-caching core assets...');
      for (const asset of CORE_ASSETS) {
        try {
          const response = await fetch(asset, { cache: 'no-cache' });
          if (response && response.ok) {
            await cache.put(asset, response.clone());
            // Also store under absolute URL
            try {
              const absUrl = new URL(asset, self.location.href).href;
              await cache.put(absUrl, response.clone());
            } catch (_) {}
          }
        } catch (err) {
          console.warn('[SW v12] Fetch failed during pre-cache for:', asset, err);
        }
      }
      console.log('[SW v12] Pre-caching complete.');
    })
  );
});

// Activate: Clean up old caches and take immediate control of clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW v12] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      console.log('[SW v12] Claiming clients...');
      return self.clients.claim();
    })
  );
});

// Helper: Find response in any cache or match by filename
async function findInCache(request) {
  // 1. Direct cache match with ignoreSearch
  let matched = await caches.match(request, { ignoreSearch: true });
  if (matched) return matched;

  // 2. Open active cache and inspect keys
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const reqUrl = typeof request === 'string' ? request : request.url;
    const urlObj = new URL(reqUrl, self.location.href);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'index.html';

    // Match by filename suffix or exact pathname
    for (const k of keys) {
      const kUrl = new URL(k.url);
      if (kUrl.pathname === pathname || kUrl.pathname.endsWith('/' + filename)) {
        const res = await cache.match(k);
        if (res) return res;
      }
    }

    // For HTML navigation requests, return any index.html
    if (pathname.endsWith('/') || pathname.endsWith('.html') || pathname === '') {
      for (const k of keys) {
        if (k.url.includes('index.html') || k.url.endsWith('/')) {
          const res = await cache.match(k);
          if (res) return res;
        }
      }
    }
  } catch (err) {
    console.warn('[SW v12] findInCache error:', err);
  }

  return null;
}

// Fetch: Bulletproof Cache-First Strategy with Background Revalidation
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const isNavigation = event.request.mode === 'navigate' ||
                       event.request.destination === 'document' ||
                       (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  event.respondWith(
    (async () => {
      // Step 1: Check cache first
      const cached = await findInCache(event.request);
      if (cached) {
        // In background, revalidate from network if online
        if (navigator.onLine) {
          fetch(event.request)
            .then(async (netRes) => {
              if (netRes && netRes.ok) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, netRes.clone());
              }
            })
            .catch(() => {});
        }
        return cached;
      }

      // Step 2: Not in cache -> fetch from network
      try {
        const netRes = await fetch(event.request);
        if (netRes && netRes.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, netRes.clone()).catch(() => {});
        }
        return netRes;
      } catch (netErr) {
        // Step 3: Network failed (user is offline or server stopped)
        // If navigation, attempt fallback to index.html from cache
        if (isNavigation) {
          const fallbackIndex = await findInCache('./index.html') ||
                                await findInCache('index.html') ||
                                await findInCache('./');
          if (fallbackIndex) return fallbackIndex;

          // Emergency inline HTML response (NEVER let respondWith return undefined / throw ERR_FAILED)
          return new Response(EMERGENCY_OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }

        // For non-navigation asset requests that miss cache, try by filename
        const assetFallback = await findInCache(event.request);
        if (assetFallback) return assetFallback;

        // If all else fails for non-navigation, return a 404 response rather than throwing ERR_FAILED
        return new Response('Asset offline unavailable', {
          status: 404,
          statusText: 'Not Found Offline',
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })()
  );
});
