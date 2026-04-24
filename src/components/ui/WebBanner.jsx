/**
 * WebBanner.jsx
 * 
 * Display a banner on the web version informing users that data is stored locally
 * in their browser. This component only shows when NOT running in Tauri.
 */

const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;

export default function WebBanner() {
    // Don't show on desktop app
    if (isTauri) return null;

    return (
        <div style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "12px 16px",
            background: "rgba(74, 122, 155, 0.1)",
            borderTop: "1px solid var(--c-ice-dim)",
            fontSize: "0.75rem",
            color: "var(--c-ice)",
            fontFamily: "'Cinzel', serif",
            letterSpacing: "0.05em",
            textAlign: "center",
            zIndex: 999,
            pointerEvents: "none",
        }}>
            💾 Data saved locally to your browser • Back up your campaigns regularly
        </div>
    );
}