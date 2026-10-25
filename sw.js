/* Laporan Lawatan Tapak — service worker
 * Naikkan VERSION setiap kali index.html dikemas kini supaya telefon ambil versi baharu. */
const VERSION = 'llt-v1.1.1';
const SHELL = ['./', './index.html', './manifest.json', './icon.svg'];
const CDN = ['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL).then(() => c.addAll(CDN).catch(() => {}))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // API (POST) tidak disentuh
  const url = new URL(req.url);
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;

  // Halaman: rangkaian dahulu (dapat versi terkini), cache bila tiada talian
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }

  // Fon, jsPDF, ikon: cache dahulu, kemas kini di belakang
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
