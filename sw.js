// Service worker: permite instalar la app y abrirla sin conexión.
// Cambiá el número de versión cada vez que subas archivos nuevos.
const CACHE = 'portal-rrhh-v1';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest',
  'icons/logo.png', 'icons/icon-32.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const own = u.origin === location.origin;
  const lib = u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com' || (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/'));
  if (!own && !lib) return; // datos de Firebase y demás: directo a la red
  // Red primero (para ver siempre la última versión); caché si no hay conexión
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r, {ignoreSearch: own}).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
