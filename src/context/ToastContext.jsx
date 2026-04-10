import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { KEYS } from "../utils/storageKeys";
import storage from "../utils/storage";
import { fr } from "../i18n/fr";
import { en } from "../i18n/en";
const i18n = { fr, en };

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

const TYPE_STYLE = {
  success: {
    background: "rgba(8, 24, 16, 0.94)",
    border: "1px solid rgba(74,160,100,0.5)",
    dot: "#5cb87a",
  },
  warning: {
    background: "rgba(24, 16, 8, 0.94)",
    border: "1px solid rgba(200,130,50,0.5)",
    dot: "#c89640",
  },
};

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: "fixed",
      top: 20,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      pointerEvents: "none",
    }}>
      {toasts.map(t => {
        const s = TYPE_STYLE[t.type] ?? TYPE_STYLE.success;
        return (
          <div key={t.id}
            className="toast-frost"
            onClick={() => onDismiss(t.id)}
            style={{
              pointerEvents: "auto",
              cursor: "pointer",
              background: s.background,
              border: s.border,
              borderRadius: 10,
              padding: "8px 16px 8px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              backdropFilter: "blur(14px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
              maxWidth: 320,
              whiteSpace: "nowrap",
            }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: s.dot, flexShrink: 0,
              boxShadow: `0 0 6px ${s.dot}`,
            }} />
            <span style={{
              color: "var(--c-ice-light)",
              fontFamily: "'Cinzel', serif",
              fontSize: "0.78rem",
              letterSpacing: "0.06em",
            }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const showToast = useCallback((message, type = "success") => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timers.current[id];
    }, 2500);
  }, []);

  useEffect(() => {
    const pending = storage.getItem(KEYS.pendingToast);
    if (pending) {
      storage.removeItem(KEYS.pendingToast);
      try {
        const { key, message, type } = JSON.parse(pending);
        if (key) {
          const lang = storage.getItem(KEYS.appLanguage) ?? "fr";
          const resolved = i18n[lang]?.[key] ?? fr[key] ?? key;
          showToast(resolved, type);
        } else {
          showToast(message, type);
        }
      } catch {}
    }
  }, [showToast]);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
