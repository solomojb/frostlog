import { createContext, useContext, useState } from "react";
import storage from "../utils/storage";
import { KEYS } from "../utils/storageKeys";
import { fr } from "../i18n/fr";
import { en } from "../i18n/en";

const translations = { fr, en };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => storage.getItem(KEYS.appLanguage) ?? "fr");

    function setLanguage(l) {
        storage.setItem(KEYS.appLanguage, l);
        setLang(l);
    }

    // t("key") or t("key", { n: 5, name: "Bob" }) for interpolation
    function t(key, vars) {
        let str = translations[lang]?.[key] ?? translations.fr[key] ?? key;
        if (vars) {
            for (const [k, v] of Object.entries(vars)) {
                str = str.replace(`{${k}}`, v);
            }
        }
        return str;
    }

    return (
        <LanguageContext.Provider value={{ lang, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
export const useT = () => useContext(LanguageContext).t;
