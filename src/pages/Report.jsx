import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useLanguage } from "../i18n/LanguageContext";
import { auth, db } from "../services/firebase";
import { dayKey } from "../services/nutrition";
import { adaptSuggestion } from "../services/adapt";
import { C, Page, TopBar, Panel, SectionTitle, Plate, LinkBtn, Btn } from "../design/ui";

const DAYS = 7;
const r1 = (n) => Math.round(n * 10) / 10;

function Report() {
  const { t, formatDate } = useLanguage();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [targets, setTargets] = useState(null);
  const [goalType, setGoalType] = useState("maintain");
  const [meals, setMeals] = useState([]);
  const [weights, setWeights] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [planMsg, setPlanMsg] = useState("");
  const [planBusy, setPlanBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [u, m, p] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getDocs(query(collection(db, "meals"), where("userId", "==", user.uid))),
          getDocs(query(collection(db, "progress"), where("userId", "==", user.uid))),
        ]);
        if (u.exists()) {
          const d = u.data();
          setGoalType(d.goalType || "maintain");
          if (d.calorieTarget) {
            setTargets({
              calories: d.calorieTarget,
              protein: d.proteinTarget || 0,
              carbs: d.carbsTarget || 0,
              fat: d.fatTarget || 0,
            });
          }
          const acts = [d.adaptAppliedAt, d.adaptDismissedAt].filter(Boolean).sort();
          setLastAction(acts.length ? acts[acts.length - 1] : null);
        }
        setMeals(m.docs.map((x) => x.data()));
        setWeights(
          p.docs
            .map((x) => x.data())
            .filter((x) => x.weight && x.date)
            .map((x) => ({ w: Number(x.weight), t: new Date(x.date).getTime() }))
            .sort((a, b) => a.t - b.t)
        );
      } catch (e) {
        console.log(e);
        setError(t("report.errLoad"));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = useMemo(() => {
    // آخر 7 أيام (اليوم الأخير = اليوم)
    const days = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ date: d, key: dayKey(d), cal: 0, pro: 0, n: 0 });
    }
    const byKey = Object.fromEntries(days.map((d) => [d.key, d]));
    for (const m of meals) {
      const d = byKey[m.day];
      if (!d) continue;
      d.cal += m.calories || 0;
      d.pro += m.protein || 0;
      d.n += 1;
    }
    const logged = days.filter((d) => d.n > 0);
    const avg = (f) => (logged.length ? logged.reduce((s, d) => s + d[f], 0) / logged.length : 0);

    // الوزن: نقارن آخر قراءة بقراءة من الأسبوع الأخير فقط
    // (نقبل قراءة قبل الأسبوع بشرط ما تكون أقدم من 14 يوم، وإلا نعرض الوزن الحالي بدون فرق)
    let weightDelta = null;
    let lastWeight = null;
    let weightSpanDays = 0;
    if (weights.length) {
      const weekAgo = Date.now() - DAYS * 86400000;
      const twoWeeksAgo = Date.now() - 2 * DAYS * 86400000;
      lastWeight = weights[weights.length - 1];
      const before = [...weights].reverse().find((x) => x.t <= weekAgo && x.t >= twoWeeksAgo);
      const first = before || weights.find((x) => x.t > weekAgo);
      if (first && first.t !== lastWeight.t) {
        weightDelta = r1(lastWeight.w - first.w);
        weightSpanDays = Math.max(1, Math.round((lastWeight.t - first.t) / 86400000));
      }
    }

    const calOk = (d) => targets && d.cal >= targets.calories * 0.9 && d.cal <= targets.calories * 1.1;
    const proOk = (d) => targets && targets.protein && d.pro >= targets.protein * 0.9;

    return {
      days,
      logged,
      avgCal: Math.round(avg("cal")),
      avgPro: Math.round(avg("pro")),
      calOkDays: logged.filter(calOk).length,
      proOkDays: logged.filter(proOk).length,
      calOk,
      weightDelta,
      weightSpanDays,
      lastWeight,
    };
  }, [meals, weights, targets]);

  // اقتراح تعديل الهدف (مبني على الوزن الفعلي)
  const plan = useMemo(() => {
    const cutoff = dayKey(new Date(Date.now() - 13 * 86400000));
    const loggedDays14 = new Set(
      meals.filter((m) => m.day >= cutoff).map((m) => m.day)
    ).size;
    return adaptSuggestion({ goalType, weights, loggedDays14, targets, lastActionAt: lastAction });
  }, [goalType, weights, meals, targets, lastAction]);

  const applyPlan = async () => {
    if (plan.status !== "suggest") return;
    setPlanBusy(true);
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, "users", user.uid), {
        calorieTarget: plan.newCal,
        carbsTarget: plan.newCarbs,
        adaptAppliedAt: now,
      });
      setTargets((p) => ({ ...p, calories: plan.newCal, carbs: plan.newCarbs }));
      setLastAction(now);
      setPlanMsg(t("report.planApplied", { cal: plan.newCal }));
    } catch (e) {
      console.log(e);
      setPlanMsg(t("report.planErr"));
    } finally {
      setPlanBusy(false);
    }
  };

  const dismissPlan = async () => {
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, "users", user.uid), { adaptDismissedAt: now });
      setLastAction(now);
    } catch (e) {
      console.log(e);
    }
  };

  // ملاحظات بسيطة مبنية على أرقامك فقط
  const notes = [];
  if (data.logged.length > 0) {
    if (data.logged.length < 4) notes.push(t("report.noteFewDays", { n: data.logged.length }));
    if (targets) {
      const ratio = data.avgCal / targets.calories;
      if (ratio > 1.1) notes.push(t("report.noteCalHigh", { pct: Math.round((ratio - 1) * 100) }));
      else if (ratio < 0.9) notes.push(t("report.noteCalLow", { pct: Math.round((1 - ratio) * 100) }));
      else notes.push(t("report.noteCalOk"));
      if (targets.protein) {
        notes.push(t("report.noteProtein", { n: data.proOkDays, m: data.logged.length }));
      }
    }
    if (data.weightDelta !== null) {
      const d = data.weightDelta;
      const good =
        goalType === "cut" ? d <= -0.1 : goalType === "bulk" ? d >= 0.1 : Math.abs(d) <= 0.5;
      notes.push(t(good ? "report.noteWeightGood" : "report.noteWeightOff", { d: Math.abs(d) }));
    }
  }

  const maxCal = Math.max(targets?.calories || 0, ...data.days.map((d) => d.cal), 1);

  return (
    <Page>
      <TopBar />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <h1 className="text-3xl font-bold mb-1">{t("report.title")}</h1>
        <p className="mb-8" style={{ color: C.dim }}>
          {t("report.subtitle")}
        </p>

        {loading ? (
          <p style={{ color: C.dim }}>{t("common.loading")}</p>
        ) : error ? (
          <p role="alert" style={{ color: C.redText }}>{error}</p>
        ) : data.logged.length === 0 ? (
          <Panel className="p-6">
            <p className="mb-4">{t("report.empty")}</p>
            <LinkBtn to="/meals">{t("report.goMeals")}</LinkBtn>
          </Panel>
        ) : (
          <>
            <Panel className="p-5 md:p-6 mb-6">
              <SectionTitle>{t("report.averages")}</SectionTitle>
              <p className="text-sm mb-5" style={{ color: C.dim }}>
                {t("report.basedOn", { n: data.logged.length, total: DAYS })}
              </p>
              <div className="flex flex-wrap justify-around gap-6">
                <Plate
                  color={C.chalk}
                  ink={C.rubber}
                  value={data.avgCal}
                  unit={t("common.kcal")}
                  label={t("report.avgCal")}
                  size={140}
                />
                <Plate
                  color={C.red}
                  value={data.avgPro}
                  unit={t("common.g")}
                  label={t("report.avgPro")}
                  size={140}
                />
                {data.lastWeight && (
                  <Plate
                    color={C.blue}
                    value={data.weightDelta === null ? r1(data.lastWeight.w) : `\u200E${data.weightDelta > 0 ? "+" : ""}${data.weightDelta}`}
                    unit={t("common.kg")}
                    label={data.weightDelta === null ? t("report.weightNow") : t("report.weightChangeDays", { n: data.weightSpanDays })}
                    size={140}
                  />
                )}
              </div>
            </Panel>

            <Panel className="p-5 md:p-6 mb-6">
              <SectionTitle>{t("report.planTitle")}</SectionTitle>
              {planMsg ? (
                <p role="status" style={{ color: C.greenText }}>{planMsg}</p>
              ) : plan.status === "suggest" ? (
                <>
                  <p className="mb-2">
                    {t(`report.reason.${plan.reason}`, { rate: Math.abs(plan.rate) })}
                  </p>
                  <p className="mb-5 font-semibold">
                    {t(plan.delta > 0 ? "report.planUp" : "report.planDown", {
                      n: Math.abs(plan.delta),
                      cal: plan.newCal,
                    })}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Btn onClick={applyPlan} disabled={planBusy}>{t("report.planApply")}</Btn>
                    <Btn variant="ghost" onClick={dismissPlan}>{t("report.planLater")}</Btn>
                  </div>
                </>
              ) : (
                <p style={{ color: plan.status === "onTrack" ? C.chalk : C.dim }}>
                  {t(`report.plan.${plan.status}`, { rate: Math.abs(plan.rate ?? 0), n: plan.daysLeft })}
                </p>
              )}
            </Panel>

            <Panel className="p-5 md:p-6 mb-6">
              <SectionTitle>{t("report.daily")}</SectionTitle>
              <div className="space-y-3">
                {data.days.map((d) => {
                  const ok = data.calOk(d);
                  const color = d.n === 0 ? C.line : ok ? C.green : C.yellow;
                  return (
                    <div key={d.key} className="flex items-center gap-3">
                      <span className="w-14 shrink-0 text-sm" style={{ color: C.dim }}>
                        {formatDate(d.date, { weekday: "short" })}
                      </span>
                      <div className="flex-1 h-3 rounded-sm relative" style={{ background: C.rubber }}>
                        <div
                          className="h-3 rounded-sm"
                          style={{ width: `${(d.cal / maxCal) * 100}%`, background: color }}
                        />
                        {targets && (
                          <div
                            aria-hidden="true"
                            className="absolute top-[-3px] bottom-[-3px]"
                            style={{ insetInlineStart: `${(targets.calories / maxCal) * 100}%`, width: 2, background: C.chalk }}
                          />
                        )}
                      </div>
                      <span className="w-24 shrink-0 text-end text-sm tabular-nums">
                        {d.n === 0 ? t("report.notLogged") : `${Math.round(d.cal)} ${t("common.kcal")}`}
                      </span>
                    </div>
                  );
                })}
              </div>
              {targets && (
                <p className="text-xs mt-4" style={{ color: C.dim }}>
                  {t("report.legend", { cal: targets.calories })}
                </p>
              )}
            </Panel>

            <Panel className="p-5 md:p-6 mb-10">
              <SectionTitle>{t("report.notes")}</SectionTitle>
              <ul className="space-y-3">
                {notes.map((n, i) => (
                  <li key={i} className="ps-4" style={{ borderInlineStart: `3px solid ${C.chalk}` }}>
                    {n}
                  </li>
                ))}
              </ul>
              {targets && (
                <p className="text-sm mt-5" style={{ color: C.dim }}>
                  {t("report.onTarget", { n: data.calOkDays, m: data.logged.length })}
                </p>
              )}
            </Panel>
          </>
        )}
      </main>
    </Page>
  );
}

export default Report;
