import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

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
  }, []);

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
