import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import api from "./lib/api";

export function Root() {
  useEffect(() => {
    // In dev, proactively unregister any SW to avoid cached modules causing duplicate React
    if (import.meta.env.DEV && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations?.()
        .then((regs) => {
          regs?.forEach((r) => r.unregister().catch(() => {}));
        })
        .catch(() => {});
    }
    // Register service worker for PWA (prod only)
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }

    // Performance: preconnect to API origin when cross-origin
    try {
      const base = api?.defaults?.baseURL || "/api";
      const a = document.createElement("a");
      a.href = base;
      const apiOrigin = `${a.protocol}//${a.host}`;
      const sameOrigin = apiOrigin === `${location.protocol}//${location.host}`;
      if (!sameOrigin) {
        const link1 = document.createElement("link");
        link1.rel = "preconnect";
        link1.href = apiOrigin;
        link1.crossOrigin = "anonymous";
        document.head.appendChild(link1);

        const link2 = document.createElement("link");
        link2.rel = "dns-prefetch";
        link2.href = apiOrigin;
        document.head.appendChild(link2);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
