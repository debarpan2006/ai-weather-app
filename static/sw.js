const CACHE_NAME = 'ai-weather-v2';
const ASSETS = [
  '/',
  '/static/style.css',
  '/static/script.js',
  '/static/manifest.json',
  '/static/app-icon.svg'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(ASSETS))
        .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if(key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
});

self.addEventListener('fetch', event => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;
    
    // Always attempt network first for APIs to ensure live weather
    if(event.request.url.includes('/api/')) {
        event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify({ error: "Offline" }), { headers: {'Content-Type': 'application/json'} })));
        return;
    }

    // Standard cache-first strategy for static assets
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request);
        })
    );
});
