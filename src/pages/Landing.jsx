import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { startDemo } from "../services/demo";
import { useLanguage } from "../i18n/LanguageContext";
import { C, Page, PlateMark, Plate, PlateBar, Panel, Btn, LinkBtn } from "../design/ui";
import { LangToggle } from "../i18n/LanguageSwitcher";

const featureKeys = ["f1", "f2", "f3", "f4"];

const steps = [
  { key: "s1", color: C.red, ink: "#fff" },
  { key: "s2", color: C.blue, ink: "#fff" },
  { key: "s3", color: C.yellow, ink: C.rubber },
];

function Landing() {
  const [user, setUser] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await startDemo();
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      alert(t("landing.demoError"));
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  const demoButton = (
    <Btn onClick={handleDemo} disabled={demoLoading} className="!px-7 !py-3 text-lg">
      {demoLoading ? t("landing.demoLoading") : t("landing.tryDemo")}
    </Btn>
  );

  return (
    <Page>
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 font-bold text-lg">
          <PlateMark />
          <span className="hidden sm:inline">Gym Tracker</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <LangToggle />
          {user ? (
            <LinkBtn to="/dashboard" className="!py-2 !px-4 text-sm">
              {t("common.dashboard")}
            </LinkBtn>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 text-sm md:text-base hover:opacity-100 opacity-80"
              >
                {t("common.login")}
              </Link>
              <LinkBtn to="/register" className="!py-2 !px-4 text-sm">
                {t("landing.getStarted")}
              </LinkBtn>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-5">
        {/* Hero */}
        <section className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center py-14 md:py-24">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] mb-6">
              {t("landing.heroTitle")}
            </h1>
            <p className="text-lg md:text-xl max-w-xl mb-9" style={{ color: C.dim, lineHeight: 1.7 }}>
              {t("landing.heroText")}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {user ? (
                <LinkBtn to="/dashboard" className="!px-7 !py-3 text-lg">
                  {t("landing.goDashboard")}
                </LinkBtn>
              ) : (
                <>
                  {demoButton}
                  <LinkBtn to="/register" variant="ghost" className="!px-7 !py-3 text-lg">
                    {t("landing.createAccount")}
                  </LinkBtn>
                </>
              )}
            </div>

            {!user && (
              <p className="text-sm mt-4" style={{ color: C.dim }}>
                {t("landing.demoNote")}
              </p>
            )}
          </div>

          {/* Product proof: a sample day */}
          <Panel className="p-6 md:p-8">
            <p className="font-semibold mb-6">{t("landing.sampleTitle")}</p>

            <div className="grid grid-cols-2 gap-y-7 justify-items-center mb-8">
              <Plate color={C.chalk} ink={C.rubber} size={118} value="2,234" unit={t("common.kcal")} label={t("landing.calories")} />
              <Plate color={C.red} size={118} value="176" unit={t("common.g")} label={t("landing.protein")} />
              <Plate color={C.yellow} ink={C.rubber} size={118} value="243" unit={t("common.g")} label={t("landing.carbs")} />
              <Plate color={C.green} size={118} value="62" unit={t("common.g")} label={t("landing.fat")} />
            </div>

            <div className="flex items-baseline justify-between mb-3">
              <span style={{ color: C.dim }}>{t("landing.goalProgress")}</span>
              <span className="text-2xl font-bold tabular-nums">60%</span>
            </div>
            <PlateBar percent={60} />

            <p className="text-xs mt-5" style={{ color: C.dim }}>
              {t("landing.sample")}
            </p>
          </Panel>
        </section>

        {/* Features: ruled list */}
        <section className="py-12" style={{ borderTop: `1px solid ${C.line}` }}>
          <h2 className="text-2xl md:text-3xl font-bold mb-8">{t("landing.featuresTitle")}</h2>

          <div>
            {featureKeys.map((k) => (
              <div
                key={k}
                className="grid md:grid-cols-[1fr_1.4fr] gap-2 md:gap-10 py-6"
                style={{ borderBottom: `1px solid ${C.line}` }}
              >
                <h3 className="text-lg md:text-xl font-semibold">{t(`landing.${k}Title`)}</h3>
                <p style={{ color: C.dim, lineHeight: 1.7 }}>{t(`landing.${k}Text`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps: a real sequence */}
        <section className="py-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-10">{t("landing.howTitle")}</h2>

          <ol className="grid md:grid-cols-3 gap-10">
            {steps.map((s, i) => (
              <li key={s.key} className="flex gap-5 items-start">
                <span
                  aria-hidden="true"
                  className="grid place-items-center shrink-0 font-bold text-xl"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: s.color,
                    color: s.ink,
                    boxShadow: "inset 0 0 0 3px rgba(0,0,0,.16)",
                  }}
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{t(`landing.${s.key}Title`)}</h3>
                  <p style={{ color: C.dim, lineHeight: 1.7 }}>{t(`landing.${s.key}Text`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Final call */}
        {!user && (
          <section
            className="py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{t("landing.ctaTitle")}</h2>
              <p style={{ color: C.dim }}>{t("landing.ctaText")}</p>
            </div>
            {demoButton}
          </section>
        )}
      </main>

      <footer
        className="max-w-6xl mx-auto px-5 py-8 text-sm"
        style={{ color: C.dim, borderTop: `1px solid ${C.line}` }}
      >
        {t("landing.footer")}
      </footer>
    </Page>
  );
}

export default Landing;
