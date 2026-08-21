/* 舒艺欣学习工作台 · Service Worker
 * 作用：首次访问后把站点资源缓存到本地，之后断网/弱网也能打开（PWA 离线）。
 * 更新：修改资源后，把下方 CACHE 版本号 +1（如 v1 -> v2），新版本会自动覆盖旧缓存。
 */
const CACHE = 'syx-pwa-v14';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        // 离线且缓存未命中时，回退到首页（保证 App 壳可用）
        return caches.match('./index.html');
      });
    })
  );
});
