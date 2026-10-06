import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { C, Page, TopBar, Panel, Btn, Field, inputClass, inputStyle } from "../design/ui";

function AddProgress() {
  const { t } = useLanguage();
  const [weight, setWeight] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const saveProgress = async (e) => {
    e.preventDefault();

    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert(t("progress.loginFirst"));
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "progress"), {
        userId: currentUser.uid,
        weight: Number(weight),
        calories: Number(calories),
        protein: Number(protein),
        date: new Date().toISOString(),
      });

      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      alert(t("common.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <TopBar />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <h1 className="text-3xl font-bold">{t("progress.addTitle")}</h1>
        <p className="mt-2 mb-8" style={{ color: C.dim }}>
          {t("progress.addSubtitle")}
        </p>

        <Panel className="p-6 md:p-8">
          <form onSubmit={saveProgress} className="space-y-6">
            <Field label={<><span aria-hidden="true" className="inline-block rounded-full me-2" style={{ width: 10, height: 10, background: C.blue }} />{t("progress.weightKg")}</>}>
              <input
                type="number"
                dir="ltr"
                step="0.1"
                min="0"
                placeholder="80.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                className={`${inputClass} text-start`}
                style={inputStyle}
              />
            </Field>
            <Field label={<><span aria-hidden="true" className="inline-block rounded-full me-2" style={{ width: 10, height: 10, background: C.chalk }} />{t("progress.caloriesKcal")}</>}>
              <input
                type="number"
                dir="ltr"
                min="0"
                placeholder="2200"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
                className={`${inputClass} text-start`}
                style={inputStyle}
              />
            </Field>
            <Field label={<><span aria-hidden="true" className="inline-block rounded-full me-2" style={{ width: 10, height: 10, background: C.red }} />{t("progress.proteinG")}</>}>
              <input
                type="number"
                dir="ltr"
                min="0"
                placeholder="150"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                required
                className={`${inputClass} text-start`}
                style={inputStyle}
              />
            </Field>

            <div className="flex flex-wrap gap-3 pt-2">
              <Btn type="submit" disabled={loading}>
                {loading ? t("progress.saving") : t("progress.saveProgress")}
              </Btn>
              <Btn type="button" variant="ghost" onClick={() => navigate("/dashboard")}>
                {t("common.cancel")}
              </Btn>
            </div>
          </form>
        </Panel>
      </main>
    </Page>
  );
}

export default AddProgress;
