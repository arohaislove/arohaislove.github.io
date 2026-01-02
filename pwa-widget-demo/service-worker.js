const CACHE_NAME = 'quote-widget-v1';
const urlsToCache = [
  '/pwa-widget-demo/',
  '/pwa-widget-demo/index.html',
  '/pwa-widget-demo/styles.css',
  '/pwa-widget-demo/script.js',
  '/pwa-widget-demo/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Widget periodic sync (for updating widget data)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-quote') {
    event.waitUntil(updateQuoteWidget());
  }
});

async function updateQuoteWidget() {
  // Update widget data
  const quotes = [
    "The only way to do great work is to love what you do.",
    "Innovation distinguishes between a leader and a follower.",
    "Stay hungry, stay foolish.",
    "Your time is limited, don't waste it living someone else's life."
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  // Store the quote for the widget
  const cache = await caches.open(CACHE_NAME);
  const widgetData = new Response(JSON.stringify({ quote: randomQuote }));
  await cache.put('/pwa-widget-demo/widget-data.json', widgetData);
}
