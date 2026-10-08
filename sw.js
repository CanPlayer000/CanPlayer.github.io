// sw.js
const CACHE_VERSION = 'v1.0.1'; // ★ 每次更新网页后，修改这个版本号
const CACHE_NAME = `maze-game-${CACHE_VERSION}`;

// 需要缓存的资源列表（全部用相对路径）
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// 安装时缓存资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.warn('缓存失败:', err))
  );
  self.skipWaiting(); // 强制新 SW 立即激活
});

// 激活时清理旧版本缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;

        // 缓存没命中，走网络，同时把成功的响应加入缓存
        return fetch(event.request).then(networkRes => {
          // 只缓存同源的成功响应
          if (!networkRes || networkRes.status !== 200 || networkRes.type !== 'basic') {
            return networkRes;
          }
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resClone);
          });
          return networkRes;
        });
      })
      .catch(() => {
        // 离线兜底（可选）
        // return caches.match('./index.html');
      })
  );
});