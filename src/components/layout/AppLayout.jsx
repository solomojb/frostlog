import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { IcoZoomIn, IcoZoomOut } from "../ui/Icons";
import { KEYS } from "../../utils/storageKeys";
import storage from "../../utils/storage";

const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
const ZOOM_STEP = 0.1;
const ZOOM_MIN = 1.0;
const ZOOM_MAX = 1.5;

async function applyTauriZoom(factor) {
  if (!isTauri) return;
  const { getCurrentWebview } = await import("@tauri-apps/api/webview");
  await getCurrentWebview().setZoom(factor);
}

function ZoomWidget() {
  const [zoom, setZoom] = useState(() => {
    const stored = storage.getItem(KEYS.appZoom);
    return stored ? parseFloat(stored) : ZOOM_MIN;
  });

  useEffect(() => {
    applyTauriZoom(zoom);
  }, []); // applique le zoom stocké au démarrage

  function handleZoomIn() {
    const next = Math.min(Math.round((zoom + ZOOM_STEP) * 10) / 10, ZOOM_MAX);
    setZoom(next);
    storage.setItem(KEYS.appZoom, String(next));
    applyTauriZoom(next);
  }

  function handleZoomOut() {
    const next = Math.max(Math.round((zoom - ZOOM_STEP) * 10) / 10, ZOOM_MIN);
    setZoom(next);
    storage.setItem(KEYS.appZoom, String(next));
    applyTauriZoom(next);
  }

  if (!isTauri) return null;

  const btn = {
    background: "rgba(4, 10, 20, 0.65)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(168,216,234,0.18)",
    borderRadius: 6,
    color: "var(--c-ice-dim)",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 30, height: 30,
  };

  return (
    <div style={{ position: "fixed", top: 10, right: 12, display: "flex", gap: 4, zIndex: 200 }}>
      {zoom > ZOOM_MIN && (
        <button style={btn} onClick={handleZoomOut} title="Zoom −">
          <IcoZoomOut />
        </button>
      )}
      <button style={btn} onClick={handleZoomIn} title="Zoom +">
        <IcoZoomIn />
      </button>
    </div>
  );
}

function AppLayout() {
  return (
    <div className="h-screen overflow-hidden bg-black/40">
      <ZoomWidget />
      <main className="h-screen overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
