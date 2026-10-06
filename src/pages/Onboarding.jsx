import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { ACTIVITY_LEVELS, GOALS, calculatePlan } from "../services/nutrition";
import { useLanguage } from "../i18n/LanguageContext";
import { FaMars, FaVenus, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import {
  C,
  Page,
  SimpleTopBar,
  Btn,
  Panel,
  Plate,
  Field,
  Notice,
  inputClass,
  inputStyle,
} from "../design/ui";

const TOTAL_STEPS = 5;

const SEGMENT_COLORS = [C.red, C.blue, C.yellow, C.green, C.chalk];

const GOAL_TEXT_EN = {
  cut: "Lose weight",
  bulk: "Build muscle",
  maintain: "Maintain weight",
};

function Onboarding() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t, dir } = useLanguage();
  const BackIcon = dir === "rtl" ? FaArrowRight : FaArrowLeft;
  const NextIcon = dir === "rtl" ? FaArrowLeft : FaArrowRight;

  const [step, setStep] = useState(0);
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [activity, setActivity] = useState("");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // تعبئة مسبقة من بياناتك المحفوظة (مهم عند تعديل الخطة)
  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.age) setAge(String(d.age));
          if (d.height) setHeight(String(d.height));
          if (d.goalWeight) setGoalWeight(String(d.goalWeight));
          if (d.sex) setSex(d.sex);
          if (d.activity) setActivity(d.activity);
          if (d.goalType) setGoal(d.goalType);
        }

        // آخر وزن مسجل
        const res = await getDocs(
          query(collection(db, "progress"), where("userId", "==", user.uid))
        );
        const entries = res.docs.map((x) => x.data());
        if (entries.length > 0) {
          entries.sort((a, b) => new Date(b.date) - new Date(a.date));
          setWeight(String(entries[0].weight));
        }
      } catch (e) {
        console.log(e);
      }
    }

    load();
  }, [user]);

  const validate = () => {
    if (step === 0) {
      if (!sex) return t("onboarding.err.sex");
      if (Number(age) < 14 || Number(age) > 90) return t("onboarding.err.age");
    }
    if (step === 1) {
      if (Number(height) < 120 || Number(height) > 230) return t("onboarding.err.height");
      if (Number(weight) < 30 || Number(weight) > 300) return t("onboarding.err.weight");
      if (Number(goalWeight) < 30 || Number(goalWeight) > 300) return t("onboarding.err.goalWeight");
    }
    if (step === 2 && !activity) return t("onboarding.err.activity");
    if (step === 3 && !goal) return t("onboarding.err.goal");
    return "";
  };

  const next = () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const back = () => {
    setError("");
    setStep(step - 1);
  };

  const plan =
    step === 4
      ? calculatePlan({
          sex,
          age: Number(age),
          height: Number(height),
          weight: Number(weight),
          activity,
          goal,
        })
      : null;

  const finish = async () => {
    setSaving(true);
    setError("");

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          sex,
          age: Number(age),
          height: Number(height),
          goalWeight: Number(goalWeight),
          goal: GOAL_TEXT_EN[goal],
          goalType: goal,
          activity,
          calorieTarget: plan.calories,
          proteinTarget: plan.protein,
          carbsTarget: plan.carbs,
          fatTarget: plan.fat,
          onboardingDone: true,
        },
        { merge: true }
      );

      // نضيف سجل وزن جديد إذا ما عنده سجلات، أو إذا غيّر وزنه عن آخر سجل
      const existing = await getDocs(
        query(collection(db, "progress"), where("userId", "==", user.uid))
      );

      const entries = existing.docs.map((x) => x.data());
      entries.sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastWeight = entries.length > 0 ? Number(entries[0].weight) : null;

      if (lastWeight === null || lastWeight !== Number(weight)) {
        await addDoc(collection(db, "progress"), {
          userId: user.uid,
          weight: Number(weight),
          calories: 0,
          protein: 0,
          date: new Date().toISOString(),
        });
      }

      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      setError(t("onboarding.saveError"));
      setSaving(false);
    }
  };

  const optionStyle = (selected) => ({
    border: `2px solid ${selected ? C.chalk : C.line}`,
    background: selected ? "rgba(237,234,227,.08)" : "transparent",
    color: C.chalk,
    outlineColor: C.chalk,
  });
  const optionBase =
    "w-full text-start rounded px-4 py-3 min-h-[44px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const titleClass = "text-2xl md:text-3xl font-bold mb-6";

  const renderOptions = (items, current, setter, prefix) => (
    <div className="flex flex-col gap-3">
      {items.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={current === o.id}
          onClick={() => setter(o.id)}
          className={optionBase}
          style={optionStyle(current === o.id)}
        >
          <span className="block font-bold">
            {o.emoji} {t(`onboarding.${prefix}.${o.id}.label`)}
          </span>
          <span className="block text-sm mt-1" style={{ color: C.dim }}>
            {t(`onboarding.${prefix}.${o.id}.desc`)}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <Page>
      <SimpleTopBar />
      <main className="max-w-xl mx-auto px-5 pb-16">
        <div className="mt-4 mb-8">
          <p className="text-sm mb-3" style={{ color: C.dim }}>
            {t("onboarding.step", { current: step + 1, total: TOTAL_STEPS })}
          </p>
          <div className="flex gap-2">
            {SEGMENT_COLORS.map((color, i) => (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{ height: 6, background: i <= step ? color : C.line }}
              />
            ))}
          </div>
        </div>

        {error && <Notice tone="error" className="mb-6">{error}</Notice>}

        {/* Step 1: sex + age */}
        {step === 0 && (
          <div>
            <h1 className={titleClass}>{t("onboarding.about")}</h1>

            <p className="text-sm mb-2" style={{ color: C.dim }}>{t("onboarding.sex")}</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                ["male", FaMars],
                ["female", FaVenus],
              ].map(([id, Icon]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={sex === id}
                  onClick={() => setSex(id)}
                  className={`${optionBase} flex flex-col items-center gap-2 py-5`}
                  style={optionStyle(sex === id)}
                >
                  <Icon className="text-2xl" aria-hidden="true" />
                  <span className="font-semibold">{t(`onboarding.${id}`)}</span>
                </button>
              ))}
            </div>

            <Field label={t("onboarding.age")}>
              <input
                type="number"
                dir="ltr"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={`${inputClass} text-start`}
                style={inputStyle}
              />
            </Field>
          </div>
        )}

        {/* Step 2: body */}
        {step === 1 && (
          <div>
            <h1 className={titleClass}>{t("onboarding.body")}</h1>
            <div className="flex flex-col gap-5">
              <Field label={t("onboarding.height")}>
                <input
                  type="number"
                  dir="ltr"
                  placeholder="175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className={`${inputClass} text-start`}
                  style={inputStyle}
                />
              </Field>
              <Field label={t("onboarding.weight")}>
                <input
                  type="number"
                  dir="ltr"
                  step="0.1"
                  placeholder="85"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={`${inputClass} text-start`}
                  style={inputStyle}
                />
              </Field>
              <Field label={t("onboarding.goalWeightLabel")}>
                <input
                  type="number"
                  dir="ltr"
                  step="0.1"
                  placeholder="75"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  className={`${inputClass} text-start`}
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Step 3: activity */}
        {step === 2 && (
          <div>
            <h1 className={titleClass}>{t("onboarding.activityTitle")}</h1>
            {renderOptions(ACTIVITY_LEVELS, activity, setActivity, "activity")}
          </div>
        )}

        {/* Step 4: goal */}
        {step === 3 && (
          <div>
            <h1 className={titleClass}>{t("onboarding.goalTitle")}</h1>
            {renderOptions(GOALS, goal, setGoal, "goal")}
          </div>
        )}

        {/* Step 5: result */}
        {step === 4 && plan && (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("onboarding.planTitle")}</h1>
            <p className="mb-8" style={{ color: C.dim }}>{t("onboarding.planIntro")}</p>

            <Panel className="p-6 mb-6">
              <div className="flex flex-wrap items-center justify-center gap-6">
                <Plate
                  color={C.chalk}
                  ink={C.rubber}
                  size={150}
                  value={plan.calories}
                  unit={t("onboarding.kcalPerDay")}
                  label={t("onboarding.calories")}
                />
                <Plate
                  color={C.red}
                  ink="#fff"
                  size={100}
                  value={plan.protein}
                  unit={t("common.g")}
                  label={t("onboarding.protein")}
                />
                <Plate
                  color={C.yellow}
                  ink={C.rubber}
                  size={100}
                  value={plan.carbs}
                  unit={t("common.g")}
                  label={t("onboarding.carbs")}
                />
                <Plate
                  color={C.green}
                  ink="#fff"
                  size={100}
                  value={plan.fat}
                  unit={t("common.g")}
                  label={t("onboarding.fat")}
                />
              </div>
            </Panel>

            <p className="text-xs" style={{ color: C.dim }}>
              {t("onboarding.disclaimer", { tdee: plan.tdee })}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between gap-4 mt-10">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              disabled={saving}
              className="inline-flex items-center gap-2 min-h-[44px] pe-3 rounded hover:opacity-80 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: C.dim, outlineColor: C.chalk }}
            >
              <BackIcon aria-hidden="true" /> {t("common.back")}
            </button>
          ) : (
            <span />
          )}

          {step < TOTAL_STEPS - 1 ? (
            <Btn type="button" onClick={next} className="min-h-[44px]">
              {t("common.next")} <NextIcon aria-hidden="true" />
            </Btn>
          ) : (
            <Btn type="button" onClick={finish} disabled={saving} className="min-h-[44px]">
              {saving ? t("onboarding.saving") : t("onboarding.start")}
            </Btn>
          )}
        </div>
      </main>
    </Page>
  );
}

export default Onboarding;
