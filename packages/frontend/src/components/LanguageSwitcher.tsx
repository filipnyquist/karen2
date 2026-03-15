import { useTranslation } from "react-i18next";
import { useLanguage } from "../contexts/LanguageContext";
import { Globe } from "lucide-react";

const languages = [
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export function LanguageSwitcher() {
  const { t } = useTranslation("common");
  const { language, setLanguage } = useLanguage();

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-sm gap-2"
        aria-label={t("language.select")}
      >
        <Globe className="w-4 h-4" />
        <span>{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.label}</span>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu menu-sm bg-base-100 rounded-box z-[1] mt-3 w-40 p-2 shadow"
      >
        {languages.map((lang) => (
          <li key={lang.code}>
            <button
              onClick={() => setLanguage(lang.code as "sv" | "en")}
              className={language === lang.code ? "active" : ""}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
