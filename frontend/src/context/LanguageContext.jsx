import { createContext, useContext, useState } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");

  function toggleLanguage() {
    setLanguage((prev) => {
      const next = prev === "en" ? "ne" : "en";
      localStorage.setItem("language", next);
      return next;
    });
  }

  // t("some.key") looks up the current language's string. Falls back to
  // English, then to the raw key itself, so a missing translation never
  // crashes the page — it just shows in English or shows the key.
  function t(key) {
    return translations[language]?.[key] || translations.en[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
