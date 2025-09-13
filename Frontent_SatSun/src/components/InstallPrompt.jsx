import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  return (
    <div className="toast toast-end z-30">
      <div className="alert alert-info">
        <div>
          <h3 className="font-bold">Install SatSun</h3>
          <div className="text-xs">Add the app to your home screen</div>
        </div>
        <div className="ml-2 flex gap-2">
          <button
            className="btn btn-sm"
            onClick={async () => {
              if (!deferredPrompt) return;
              deferredPrompt.prompt();
              const { outcome } = await deferredPrompt.userChoice;
              if (outcome) setShow(false);
              setDeferredPrompt(null);
            }}
          >
            Install
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setShow(false)}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
