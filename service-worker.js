const CACHE = 'gondula-reader-v12';
const ARQUIVOS = [
  './', './index.html', './login.html', './teste-camera.html', './styles.css', './app.js', './login.js', './manifest.webmanifest', './icone.svg',
  './js/api.js', './js/auth.js', './js/camera.js', './js/ui.js', './js/teste-camera.js', './conferencias.html', './js/conferencias.js'
];
self.addEventListener('install', evento => evento.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ARQUIVOS))));
self.addEventListener('activate', evento => evento.waitUntil(caches.keys().then(chaves => Promise.all(chaves.filter(chave => chave !== CACHE).map(chave => caches.delete(chave)))).then(() => self.clients.claim())));
self.addEventListener('fetch', evento => {
  if (evento.request.method !== 'GET') return;
  evento.respondWith(caches.match(evento.request).then(resposta => resposta || fetch(evento.request)));
});
