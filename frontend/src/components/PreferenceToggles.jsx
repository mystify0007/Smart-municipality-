import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

// The two small controls the user asked for: dark/light theme switch and
// English/Nepali language switch. Designed to sit comfortably in a topbar
// or float in a corner on pages that don't have one (Login/Register).
export default function PreferenceToggles({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleTheme}
        title="Toggle dark / light theme"
        className="w-9 h-9 rounded-lg border border-portal-panel-border bg-portal-panel text-portal-text flex items-center justify-center hover:bg-white/5 transition-colors"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <button
        onClick={toggleLanguage}
        title="Switch language / भाषा परिवर्तन गर्नुहोस्"
        className="h-9 px-3 rounded-lg border border-portal-panel-border bg-portal-panel text-portal-text text-sm font-medium flex items-center justify-center hover:bg-white/5 transition-colors"
      >
        {language === "en" ? "EN" : "ने"}
      </button>
    </div>
  );
}
