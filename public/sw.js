/*
 * Sabina service worker: works offline-friendly and shows push notifications.
 * - Pages: network first; if the network fails, the last copy we saw, else the offline page.
 * - Static files (_next/static, icons, fonts): cache first (they're versioned).
 * - Never caches the API, the admin, the classroom or checkout.
 */
const VERSION = "sabina-v2";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const OFFLINE = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll([OFFLINE, "/icons/icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const skip = (url) => url.origin !== self.location.origin || /^\/(api|admin|checkout|lessons|progress)(\/|$)/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Signing out: forget the saved pages, so the next person on this device can't open them.
  if (req.method === "POST" && url.origin === self.location.origin && url.pathname === "/api/auth/logout") {
    event.waitUntil(caches.delete(PAGES).then(() => caches.open(PAGES)).then((c) => c.add(OFFLINE)));
    return;
  }
  if (req.method !== "GET") return;
  if (skip(url)) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || /\.(woff2?|png|svg|ico|webp)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(STATIC).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Keep a copy of portal pages so they open on a bad connection.
          if (res.ok && /^\/(student|tutor)(\/|$)/.test(url.pathname)) {
            const copy = res.clone();
            event.waitUntil(caches.open(PAGES).then((c) => c.put(url.pathname + url.search, copy)));
          }
          return res;
        })
        // Match by address only: page responses carry Vary headers that would otherwise miss.
        .catch(() => caches.open(PAGES).then((c) => c.match(url.pathname + url.search, { ignoreVary: true })).then((hit) => hit || caches.match(OFFLINE, { ignoreVary: true }))),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Sabina", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Sabina";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      data: { href: data.href || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (new URL(w.url).origin === self.location.origin && "focus" in w) {
          w.navigate(href);
          return w.focus();
        }
      }
      return self.clients.openWindow(href);
    }),
  );
});
