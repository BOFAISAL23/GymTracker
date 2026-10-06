/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { translations } from "./translations";

const STORAGE_KEY = "gt-lang";
const LanguageContext = createContext(null);

function getInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") return saved;
  } catch {
    // التخزين غير متاح (وضع خاص مثلاً)، نكمل بدونه
  }
  const nav = typeof navigator !== "undefined" ? navigator.language : "";
  return nav && nav.toLowerCase().startsWith("ar") ? "ar" : "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.body.style.fontFamily = "'Readex Pro', system-ui, sans-serif";
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang, dir]);

  // t("key") أو t("key", { name: "Ali" }) لاستبدال {name} داخل النص
  const t = useCallback(
    (key, vars) => {
      let text = translations[lang]?.[key] ?? translations.en[key];
      if (text === undefined) {
        console.warn("Missing translation:", key);
        return key;
      }
      if (vars) {
        Object.keys(vars).forEach((k) => {
          text = text.split(`{${k}}`).join(String(vars[k]));
        });
      }
      return text;
    },
    [lang]
  );

  // تاريخ ميلادي بأرقام لاتينية في اللغتين
  const formatDate = useCallback(
    (date, options) =>
      new Date(date).toLocaleDateString(
        lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB",
        options
      ),
    [lang]
  );

  const toggleLang = useCallback(
    () => setLang((l) => (l === "ar" ? "en" : "ar")),
    []
  );

  const value = useMemo(
    () => ({ lang, dir, t, formatDate, setLang, toggleLang }),
    [lang, dir, t, formatDate, toggleLang]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
