import { useEffect, useState } from "react";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useLanguage } from "../i18n/LanguageContext";
import { C, Page, TopBar, Panel, SectionTitle, Btn, Field, inputClass, inputStyle } from "../design/ui";

function Workouts() {
  const { t, formatDate } = useLanguage();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const loadWorkouts = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const q = query(
        collection(db, "workouts"),
        where("userId", "==", currentUser.uid)
      );

      const snapshot = await getDocs(q);

      const list = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));

      // الأحدث أولاً
      list.sort((a, b) => new Date(b.date) - new Date(a.date));

      setWorkouts(list);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const resetForm = () => {
    setName("");
    setSets("");
    setReps("");
    setWeight("");
    setEditingId(null);
  };

  const saveWorkout = async (e) => {
    e.preventDefault();

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setSaving(true);

    const data = {
      name: name.trim(),
      sets: Number(sets),
      reps: Number(reps),
      weight: Number(weight),
    };

    try {
      if (editingId) {
        // Update
        await updateDoc(doc(db, "workouts", editingId), data);

        setWorkouts(
          workouts.map((w) =>
            w.id === editingId ? { ...w, ...data } : w
          )
        );
      } else {
        // Create
        const newDoc = {
          ...data,
          userId: currentUser.uid,
          date: new Date().toISOString(),
        };

        const ref = await addDoc(collection(db, "workouts"), newDoc);

        setWorkouts([{ id: ref.id, ...newDoc }, ...workouts]);
      }

      resetForm();
    } catch (error) {
      console.log(error);
      alert(t("common.genericError"));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (w) => {
    setEditingId(w.id);
    setName(w.name);
    setSets(w.sets);
    setReps(w.reps);
    setWeight(w.weight);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "workouts", deleteId));
      setWorkouts(workouts.filter((w) => w.id !== deleteId));

      // إذا كان المحذوف هو اللي نعدله، نفرّغ النموذج
      if (editingId === deleteId) resetForm();
    } catch (error) {
      console.log(error);
      alert(t("workouts.deleteError"));
    } finally {
      setDeleteId(null);
    }
  };

  const ic = `${inputClass} text-start`;
  const th = "text-start py-3 px-3 font-normal text-sm";

  return (
    <Page>
      <TopBar />

      <main className="max-w-4xl mx-auto px-5 py-8">
        <h1 className="text-3xl font-bold">{t("workouts.title")}</h1>
        <p className="mt-2 mb-8" style={{ color: C.dim }}>
          {t("workouts.subtitle")}
        </p>

        {/* Form */}
        <Panel className="p-6 mb-10">
          <form onSubmit={saveWorkout}>
            <h2 className="text-xl md:text-2xl font-bold mb-5">
              {editingId ? t("workouts.editTitle") : t("workouts.addTitle")}
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Field label={t("workouts.exercise")} className="md:col-span-2">
                <input
                  type="text"
                  placeholder={t("workouts.exercisePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={ic}
                  style={inputStyle}
                />
              </Field>

              <Field label={t("workouts.sets")}>
                <input
                  type="number"
                  dir="ltr"
                  min="1"
                  placeholder="4"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  required
                  className={ic}
                  style={inputStyle}
                />
              </Field>

              <Field label={t("workouts.reps")}>
                <input
                  type="number"
                  dir="ltr"
                  min="1"
                  placeholder="10"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  required
                  className={ic}
                  style={inputStyle}
                />
              </Field>

              <Field label={t("workouts.weightKg")} className="md:col-span-2">
                <input
                  type="number"
                  dir="ltr"
                  min="0"
                  step="0.5"
                  placeholder="60"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                  className={ic}
                  style={inputStyle}
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-3">
              <Btn type="submit" disabled={saving}>
                {saving
                  ? t("workouts.saving")
                  : editingId
                  ? t("workouts.saveChanges")
                  : t("workouts.addTitle")}
              </Btn>

              {editingId && (
                <Btn type="button" variant="ghost" onClick={resetForm}>
                  {t("common.cancel")}
                </Btn>
              )}
            </div>
          </form>
        </Panel>

        {/* List */}
        <SectionTitle>{t("workouts.myWorkouts")}</SectionTitle>

        {loading ? (
          <p style={{ color: C.dim }}>{t("common.loading")}</p>
        ) : workouts.length === 0 ? (
          <p style={{ color: C.dim }}>{t("workouts.empty")}</p>
        ) : (
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[640px] whitespace-nowrap tabular-nums">
              <thead>
                <tr style={{ color: C.dim, borderBottom: `1px solid ${C.line}` }}>
                  <th className={th}>{t("workouts.colExercise")}</th>
                  <th className={th}>
                    {t("workouts.colSets")} × {t("workouts.colReps")}
                  </th>
                  <th className={th}>{t("workouts.colWeight")}</th>
                  <th className={th}>{t("workouts.colDate")}</th>
                  <th className={th}>
                    <span className="sr-only">{t("workouts.colAction")}</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {workouts.map((w) => (
                  <tr key={w.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td className="py-3 px-3 font-bold">{w.name}</td>
                    <td className="py-3 px-3">
                      <span dir="ltr" className="inline-block">
                        {w.sets} × {w.reps}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold" style={{ color: C.blueText }}>
                      {w.weight} {t("common.kg")}
                    </td>
                    <td className="py-3 px-3" style={{ color: C.dim }}>
                      {formatDate(w.date, { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-5 justify-end">
                        <button
                          onClick={() => startEdit(w)}
                          className="underline underline-offset-4 min-h-[44px]"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => setDeleteId(w.id)}
                          className="underline underline-offset-4 min-h-[44px]"
                          style={{ color: C.redText }}
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </main>

      {/* Delete confirmation */}
      {deleteId && (
        <div
          className="fixed inset-0 flex items-center justify-center p-6 z-50"
          style={{ background: "rgba(0,0,0,.7)" }}
        >
          <Panel className="p-7 w-full max-w-sm" role="dialog" aria-modal="true">
            <h3 className="text-2xl font-bold mb-2">{t("workouts.deleteTitle")}</h3>
            <p className="mb-6" style={{ color: C.dim }}>
              {t("workouts.deleteWarning")}
            </p>

            <div className="flex gap-3">
              <Btn variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>
                {t("common.cancel")}
              </Btn>
              <Btn variant="danger" className="flex-1" onClick={confirmDelete}>
                {t("common.delete")}
              </Btn>
            </div>
          </Panel>
        </div>
      )}
    </Page>
  );
}

export default Workouts;
