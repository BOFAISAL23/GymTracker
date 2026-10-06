import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { C, Page, TopBar, Panel, Btn, Field, inputClass, inputStyle } from "../design/ui";

function EditProgress() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();

  const [weight, setWeight] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadRecord = async () => {
      try {
        const snap = await getDoc(doc(db, "progress", id));

        if (!snap.exists()) {
          alert(t("progress.notFound"));
          navigate("/dashboard");
          return;
        }

        const data = snap.data();

        // حماية إضافية في الواجهة: السجل لازم يكون للمستخدم الحالي
        if (data.userId !== auth.currentUser?.uid) {
          navigate("/dashboard");
          return;
        }

        setWeight(data.weight);
        setCalories(data.calories);
        setProtein(data.protein);
      } catch (error) {
        console.log(error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadRecord();
  }, [id, navigate]);

  const updateProgress = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateDoc(doc(db, "progress", id), {
        weight: Number(weight),
        calories: Number(calories),
        protein: Number(protein),
      });

      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      alert(t("common.genericError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <TopBar />
        <main className="max-w-3xl mx-auto px-5 py-8">
          <p style={{ color: C.dim }}>{t("common.loading")}</p>
        </main>
      </Page>
    );
  }

  return (
    <Page>
      <TopBar />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <h1 className="text-3xl font-bold">{t("progress.editTitle")}</h1>
        <p className="mt-2 mb-8" style={{ color: C.dim }}>
          {t("progress.editSubtitle")}
        </p>

        <Panel className="p-6 md:p-8">
          <form onSubmit={updateProgress} className="space-y-6">
            <Field label={<><span aria-hidden="true" className="inline-block rounded-full me-2" style={{ width: 10, height: 10, background: C.blue }} />{t("progress.weightKg")}</>}>
              <input
                type="number"
                dir="ltr"
                step="0.1"
                min="0"
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
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                required
                className={`${inputClass} text-start`}
                style={inputStyle}
              />
            </Field>

            <div className="flex flex-wrap gap-3 pt-2">
              <Btn type="submit" disabled={saving}>
                {saving ? t("progress.saving") : t("progress.saveChanges")}
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

export default EditProgress;
