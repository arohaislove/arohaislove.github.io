/**
 * Service Worker for Second Brain PWA
 * Handles Web Share Target API (POST method) for receiving shared content
 * from other apps (especially Gemini).
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept POST requests to share.html (Web Share Target)
  if (url.pathname === '/second-brain/share.html' && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
    return;
  }
});

async function handleShareTarget(request) {
  const formData = await request.formData();
  const title = formData.get('title') || '';
  const text = formData.get('text') || '';
  const sharedUrl = formData.get('url') || '';

  // Combine shared content
  let content = '';
  if (title) content += title + '\n\n';
  if (text) content += text;
  if (sharedUrl) content += (content ? '\n\n' : '') + sharedUrl;

  // Store in cache for the share page to pick up
  const cache = await caches.open('share-target');
  const shareData = JSON.stringify({
    content: content,
    timestamp: Date.now()
  });

  await cache.put(
    new Request('/second-brain/shared-content'),
    new Response(shareData, { headers: { 'Content-Type': 'application/json' } })
  );

  // Redirect to the share handler page
  return Response.redirect('/second-brain/share.html?received=1', 303);
}
