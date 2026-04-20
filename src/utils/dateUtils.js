import { useLanguage } from "../context/LanguageContext";

/**
 * Retourne une string ISO-like en heure LOCALE pour les inputs datetime-local.
 * Format : "YYYY-MM-DDTHH:mm" (pas de Z, pas d'offset)
 */
export function localISOString(date = new Date()) {
    const pad = n => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.000`;
}

export function localISOStringToMinute(date = new Date()) {
    return localISOString(date).slice(0, 16);
}

// ── Formatage affichage ────────────────────────────────────────────────────────

/** "12/06/2025" */
export function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** "12/06" (sans année) */
export function formatDateShort(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

/** "14:30" */
export function formatTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** "3h45" ou "25 min" depuis deux ISO strings */
export function formatDuration(startIso, endIso) {
    if (!startIso || !endIso) return "—";
    return formatDurationMs(new Date(endIso) - new Date(startIso));
}

/** "3h45" ou "25 min" depuis une durée en millisecondes */
export function formatDurationMs(ms) {
    if (!ms || ms <= 0) return "—";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m} min`;
}

// ── Hook React — formatage avec la locale de l'app ────────────────────────────

/**
 * Retourne des fonctions de formatage de dates adaptées à la langue active.
 * En EN : utilise navigator.language (locale OS), adapte le format et le fuseau.
 * En FR : utilise "fr-FR".
 */
export function useDateFormatters() {
    const { lang } = useLanguage();
    const locale = lang === "en" ? "en-US" : "fr-FR";
    return {
        formatDate: (iso) => {
            if (!iso) return "—";
            return new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
        },
        formatDateShort: (iso) => {
            if (!iso) return "—";
            return new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
        },
        formatTime: (iso) => {
            if (!iso) return "—";
            return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
        },
        formatDuration,
        formatDurationMs,
    };
}
