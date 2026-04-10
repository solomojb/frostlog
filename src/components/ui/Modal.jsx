import { useEffect } from "react";

function Modal({ children, onClose, className = "" }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50"
      onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`frost-block p-6 w-full max-w-lg relative ${className}`}>
        <button onClick={onClose} className="btn-ghost-sm absolute top-3 right-3" title="Fermer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
export default Modal;
