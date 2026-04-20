import { useEffect, useState } from "react";
import { useT } from "../../context/LanguageContext";

const isTauri = () => Boolean(window.__TAURI_INTERNALS__);

function UpdateChecker() {
  const t = useT();
  const [update, setUpdate] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isTauri()) return;
    const timer = setTimeout(async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const result = await check();
        if (result?.available) setUpdate(result);
      } catch {
        // silently ignore — pas de réseau ou endpoint absent
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!update || dismissed) return null;

  async function handleInstall() {
    setInstalling(true);
    setError(null);
    let downloaded = 0;
    let total = 0;
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          if (total > 0) setProgress(Math.round((downloaded / total) * 100));
        }
      });
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch {
      setError(t("update_error"));
      setInstalling(false);
      setProgress(null);
    }
  }

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      minWidth: 320,
      maxWidth: 480,
      width: "calc(100vw - 40px)",
    }} className="frost-block p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <p style={{ color: "var(--c-ice-light)", fontFamily: "'Cinzel', serif", fontSize: "0.9rem" }}>
            {t("update_available", { v: update.version })}
          </p>
          {update.body && (
            <p className="text-xs" style={{ color: "var(--c-muted)", whiteSpace: "pre-wrap" }}>{update.body}</p>
          )}
          {installing && progress !== null && (
            <div className="mt-1">
              <div style={{ height: 3, background: "rgba(168,216,234,0.1)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "var(--c-ice-dim)", borderRadius: 2, transition: "width 0.2s ease" }} />
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--c-ice-dim)" }}>{progress}%</p>
            </div>
          )}
          {error && <p className="text-xs" style={{ color: "#e57373" }}>{error}</p>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!installing && (
            <button onClick={() => setDismissed(true)} className="btn-frost btn-cancel" style={{ fontSize: "0.78rem", padding: "4px 10px" }}>
              {t("update_later")}
            </button>
          )}
          <button onClick={handleInstall} disabled={installing} className="btn-frost btn-primary" style={{ fontSize: "0.78rem", padding: "4px 10px" }}>
            {installing ? (progress !== null ? `${progress}%` : t("update_installing")) : t("update_install")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdateChecker;
