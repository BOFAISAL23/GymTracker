import { FaGlobe } from "react-icons/fa";
import { useLanguage } from "./LanguageContext";

// زر تبديل اللغة: يوضع داخل الشريط العلوي في كل صفحة
export function LangToggle({ className = "" }) {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      title={lang === "ar" ? "English" : "العربية"}
      className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold opacity-80 hover:opacity-100 ${className}`}
    >
      <FaGlobe />
      {lang === "ar" ? "EN" : "ع"}
    </button>
  );
}

export default LangToggle;
