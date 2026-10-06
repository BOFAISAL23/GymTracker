/* eslint-disable react-refresh/only-export-components */
// نظام التصميم: "أقراص الحديد". ألوان أقراص الأوزان الأولمبية تصير لغة البيانات:
// أحمر = بروتين، أزرق = الوزن، أصفر = كارب، أخضر = دهون، أبيض (طباشير) = سعرات.
import { Link, NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { FaSignOutAlt } from "react-icons/fa";
import { auth } from "../services/firebase";
import { useLanguage } from "../i18n/LanguageContext";
import { LangToggle } from "../i18n/LanguageSwitcher";

export const C = {
  rubber: "#1B1D1C", // أرضية المطاط (الخلفية)
  panel: "#232625", // سطح اللوحات
  line: "#3A3E3C", // خطوط وحدود
  chalk: "#EDEAE3", // النص الأساسي والقرص الأبيض
  dim: "#A5A39B", // نص ثانوي
  red: "#D62F2A", // بروتين
  blue: "#1F5FBF", // الوزن
  yellow: "#F2C230", // كارب
  green: "#178747", // دهون
  // نسخ فاتحة للنص فوق الخلفية الداكنة
  blueText: "#6FA3F0",
  greenText: "#3FBF7A",
  redText: "#F0645E",
  yellowText: "#F2C230",
};

// ---------- الصفحة ----------
export function Page({ children }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: C.rubber, color: C.chalk }}
    >
      {children}
    </div>
  );
}

// ---------- الشعار ----------
export function PlateMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill={C.red} />
      <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="2" />
      <circle cx="20" cy="20" r="5" fill={C.rubber} />
    </svg>
  );
}

// ---------- الأزرار ----------
const btnBase =
  "whitespace-nowrap inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

function variantStyle(variant) {
  if (variant === "ghost")
    return { border: `1px solid ${C.line}`, color: C.chalk, background: "transparent" };
  if (variant === "danger")
    return { background: C.red, color: "#fff" };
  return { background: C.chalk, color: C.rubber };
}

export function Btn({ variant = "primary", className = "", style, ...props }) {
  return (
    <button
      className={`${btnBase} hover:opacity-90 ${className}`}
      style={{ ...variantStyle(variant), outlineColor: C.chalk, ...style }}
      {...props}
    />
  );
}

export function LinkBtn({ variant = "primary", className = "", style, ...props }) {
  return (
    <Link
      className={`${btnBase} hover:opacity-90 ${className}`}
      style={{ ...variantStyle(variant), outlineColor: C.chalk, ...style }}
      {...props}
    />
  );
}

// ---------- الشريط العلوي ----------
export function TopBar() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const links = [
    ["/dashboard", "common.dashboard"],
    ["/meals", "common.meals"],
    ["/workouts", "common.workouts"],
    ["/report", "common.report"],
    ["/onboarding", "common.myPlan"],
  ];

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (e) {
      console.log(e);
    }
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 whitespace-nowrap text-sm md:text-base border-b-2 transition ${
      isActive ? "font-semibold" : "opacity-70 hover:opacity-100"
    }`;
  const linkStyle = ({ isActive }) => ({
    borderColor: isActive ? C.chalk : "transparent",
  });

  return (
    <header style={{ borderBottom: `1px solid ${C.line}` }}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link to="/dashboard" className="flex items-center gap-3 font-bold text-lg">
          <PlateMark />
          <span className="hidden sm:inline whitespace-nowrap">Gym Tracker</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {links.map(([to, key]) => (
            <NavLink key={to} to={to} className={linkClass} style={linkStyle}>
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 md:gap-2">
          <LangToggle />
          <LinkBtn to="/add-progress" className="!py-2 !px-4 text-sm">
            {t("common.addProgress")}
          </LinkBtn>
          <button
            onClick={logout}
            aria-label={t("common.logout")}
            title={t("common.logout")}
            className="p-3 rounded hover:opacity-80"
            style={{ color: C.dim }}
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>

      <nav className="md:hidden flex items-center gap-1 px-3 overflow-x-auto">
        {links.map(([to, key]) => (
          <NavLink key={to} to={to} className={linkClass} style={linkStyle}>
            {t(key)}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

// ---------- اللوحة والعناوين ----------
export function Panel({ className = "", style, children, ...props }) {
  return (
    <section
      className={`rounded-md ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}`, ...style }}
      {...props}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-baseline justify-between gap-4 mb-4">
      <h2 className="text-xl md:text-2xl font-bold">{children}</h2>
      {action}
    </div>
  );
}

// ---------- قرص الحديد ----------
// color: لون القرص، ink: لون الرقم فوقه
export function Plate({ color, ink = "#fff", value, unit, label, size = 130 }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        role="img"
        aria-label={`${label}: ${value} ${unit || ""}`}
        className="grid place-items-center"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          color: ink,
          boxShadow:
            "inset 0 0 0 5px rgba(0,0,0,.16), inset 0 0 0 7px rgba(255,255,255,.16)",
        }}
      >
        <div className="leading-none">
          <span
            className="block font-bold tabular-nums"
            style={{ fontSize: Math.round(size * 0.27) }}
          >
            {value}
          </span>
          {unit && (
            <span
              className="block mt-1 opacity-80"
              style={{ fontSize: Math.max(11, Math.round(size * 0.1)) }}
            >
              {unit}
            </span>
          )}
        </div>
      </div>
      <span className="text-sm" style={{ color: C.dim }}>
        {label}
      </span>
    </div>
  );
}

// ---------- بار الأقراص (تقدم الهدف) ----------
const SLOTS = [
  { c: C.red, h: 72 },
  { c: C.blue, h: 62 },
  { c: C.yellow, h: 52 },
  { c: C.green, h: 42 },
  { c: C.chalk, h: 32 },
];

export function PlateBar({ percent = 0 }) {
  const { dir } = useLanguage();
  const loaded = Math.min(5, Math.ceil(Math.max(0, percent) / 20));

  return (
    <div
      dir="ltr"
      role="img"
      aria-label={`${Math.round(percent)}%`}
      className="flex items-center"
      style={{ flexDirection: dir === "rtl" ? "row-reverse" : "row" }}
    >
      {/* الأقراص: الأكبر قرب البار */}
      <div className="flex items-center gap-1" style={{ flexDirection: dir === "rtl" ? "row-reverse" : "row" }}>
        {[...SLOTS].reverse().map((s, i) => {
          const idx = SLOTS.length - 1 - i;
          const filled = idx < loaded;
          return (
            <div
              key={idx}
              style={{
                width: 14,
                height: s.h,
                borderRadius: 3,
                background: filled ? s.c : "transparent",
                border: filled ? "none" : `1.5px dashed ${C.line}`,
                transition: "background .4s",
              }}
            />
          );
        })}
      </div>
      {/* البار */}
      <div className="flex-1 h-2 rounded-full" style={{ background: C.dim, opacity: 0.55, minWidth: 40 }} />
    </div>
  );
}

// ---------- صف دفتر (اسم ..... قيمة) ----------
export function LedgerRow({ label, value, valueColor }) {
  return (
    <div className="flex items-baseline gap-3 py-3">
      <span style={{ color: C.dim }}>{label}</span>
      <span
        aria-hidden="true"
        className="flex-1"
        style={{ borderBottom: `1px dotted ${C.line}`, transform: "translateY(-4px)" }}
      />
      <span
        className="text-xl font-bold tabular-nums"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

// ---------- شريط بسيط للصفحات بدون تنقل (دخول، تسجيل، استبيان) ----------
export function SimpleTopBar() {
  return (
    <header className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3 font-bold text-lg">
        <PlateMark />
        <span className="whitespace-nowrap">Gym Tracker</span>
      </Link>
      <LangToggle />
    </header>
  );
}

// ---------- نماذج ----------
export const inputClass =
  "w-full rounded px-4 py-3 outline-none placeholder:opacity-50 focus-visible:outline focus-visible:outline-2";

export const inputStyle = {
  background: C.rubber,
  border: `1px solid ${C.line}`,
  color: C.chalk,
  outlineColor: C.chalk,
};

// label فوق الحقل. استخدمه حول input مباشرة.
export function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm mb-2" style={{ color: C.dim }}>
        {label}
      </span>
      {children}
    </label>
  );
}

// رسالة خطأ أو معلومة: خط ملون على جهة البداية
export function Notice({ tone = "error", children, className = "" }) {
  const color = tone === "error" ? C.red : tone === "success" ? C.greenText : C.yellow;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded px-4 py-3 text-sm ${className}`}
      style={{ background: C.panel, borderInlineStart: `3px solid ${color}` }}
    >
      {children}
    </div>
  );
}
