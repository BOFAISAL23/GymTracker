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
import { Link } from "react-router-dom";
import { FaDumbbell, FaArrowLeft } from "react-icons/fa";

function Workouts() {
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
      alert("Something went wrong, please try again");
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
      alert("Could not delete, please try again");
    } finally {
      setDeleteId(null);
    }
  };

  const labelClass = "block text-gray-400 text-sm mb-2";
  const inputClass =
    "w-full bg-slate-700 rounded-xl px-4 py-3 outline-none placeholder-gray-500 focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition duration-300"
        >
          <FaArrowLeft />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg">
            <FaDumbbell className="text-2xl" />
          </div>
          <div>
            <h1 className="text-5xl font-extrabold">Workouts</h1>
            <p className="text-gray-400 mt-1">
              Log and manage your exercises
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={saveWorkout}
          className="bg-slate-800 rounded-2xl p-6 shadow-lg mb-8"
        >
          <h2 className="text-2xl font-bold mb-5">
            {editingId ? "Edit Workout" : "Add Workout"}
          </h2>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Exercise</label>
              <input
                type="text"
                placeholder="Bench Press"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Sets</label>
              <input
                type="number"
                min="1"
                placeholder="4"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Reps</label>
              <input
                type="number"
                min="1"
                placeholder="10"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Weight (KG)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="60"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition duration-300"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Save Changes"
                : "Add Workout"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl transition duration-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* List */}
        <h2 className="text-2xl font-bold mb-4">My Workouts</h2>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : workouts.length === 0 ? (
          <p className="text-gray-400">No workouts yet. Add your first one!</p>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-3">Exercise</th>
                  <th className="text-left p-3">Sets</th>
                  <th className="text-left p-3">Reps</th>
                  <th className="text-left p-3">Weight</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {workouts.map((w) => (
                  <tr key={w.id} className="border-b border-slate-700">
                    <td className="p-3 font-semibold">{w.name}</td>
                    <td className="p-3">{w.sets}</td>
                    <td className="p-3">{w.reps}</td>
                    <td className="p-3">{w.weight} KG</td>
                    <td className="p-3">
                      {new Date(w.date).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(w)}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => setDeleteId(w.id)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-lg">
            <h3 className="text-2xl font-bold mb-2">Delete workout?</h3>
            <p className="text-gray-400 mb-6">
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-xl transition duration-300"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-xl transition duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Workouts;