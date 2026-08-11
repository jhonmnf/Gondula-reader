const CACHE = 'gundula-certa-v8';
const ARQUIVOS = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icone.svg'];
self.addEventListener('install', evento => evento.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ARQUIVOS))));
self.addEventListener('activate', evento => evento.waitUntil(caches.keys().then(chaves => Promise.all(chaves.filter(chave => chave !== CACHE).map(chave => caches.delete(chave)))).then(() => self.clients.claim())));
self.addEventListener('fetch', evento => evento.respondWith(caches.match(evento.request).then(resposta => resposta || fetch(evento.request))));
