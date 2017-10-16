self.addEventListener('install', e => {
    // e.waitUntil(
    //   caches.open('bicbacboe').then(cache => {
    //     return cache.addAll([
    //       '/',
    //       '/index.html',
    //       '/client.js',
    //       '/utils.js',
    //       '/webgl/fragment.js',
    //       '/webgl/square-vertex.js',
    //       '/logo.PNG',
    //       '/B.png',
    //       '/B-icon.png',
    //       '/favicon.png'
    //     ])
    //     .then(() => self.skipWaiting());
    //   })
    // )
  });
  
  self.addEventListener('activate',  event => {
    // event.waitUntil(self.clients.claim());
  });
  
  self.addEventListener('fetch', event => {
    // event.respondWith(
    //   caches.match(event.request, {ignoreSearch:true}).then(response => {
    //     return response || fetch(event.request);
    //   })
    // );
  });