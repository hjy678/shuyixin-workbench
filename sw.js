/* 舒艺欣学习工作台 · Service Worker
 * 作用：首次访问后把站点资源缓存到本地，之后断网/弱网也能打开（PWA 离线）。
 * 更新策略：网络优先（network-first）+ 兜底缓存。每次都去网络问最新版本，
 *          拿到后写入缓存；离线时才用缓存。这样保证用户看到的一直是新版。
 */
const CACHE = 'syx-pwa-v26';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon.svg'
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

  var url = new URL(e.request.url);
  // 仅处理同源请求
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request).then(function (res) {
      // 拿到最新响应，写入缓存覆盖旧版
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      // 离线时回落到缓存
      return caches.match(e.request).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
