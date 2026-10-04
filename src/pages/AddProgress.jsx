import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useNavigate, Link } from "react-router-dom";
import {
  FaWeight,
  FaFire,
  FaDrumstickBite,
  FaArrowLeft,
} from "react-icons/fa";

function AddProgress() {
  const [weight, setWeight] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const saveProgress = async (e) => {
    e.preventDefault();

    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("Please login first");
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
      alert("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "block text-gray-400 text-sm mb-2";
  const boxClass =
    "flex items-center gap-3 bg-slate-700 rounded-xl px-4 py-3 mb-5 focus-within:ring-2 focus-within:ring-blue-500";
  const inputClass =
    "bg-transparent outline-none w-full placeholder-gray-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition duration-300"
        >
          <FaArrowLeft />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-5xl font-extrabold">Add Progress</h1>
          <p className="text-gray-400 mt-2">
            Log today's numbers and keep the streak going
          </p>
        </div>

        <form
          onSubmit={saveProgress}
          className="bg-slate-800 rounded-2xl p-8 shadow-lg"
        >
          <label className={labelClass}>Weight (KG)</label>
          <div className={boxClass}>
            <FaWeight className="text-blue-400" />
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="80.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <label className={labelClass}>Calories (kcal)</label>
          <div className={boxClass}>
            <FaFire className="text-orange-400" />
            <input
              type="number"
              min="0"
              placeholder="2200"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <label className={labelClass}>Protein (g)</label>
          <div className={`${boxClass} mb-8`}>
            <FaDrumstickBite className="text-green-400" />
            <input
              type="number"
              min="0"
              placeholder="150"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed py-3 rounded-xl font-semibold transition duration-300"
          >
            {loading ? "Saving..." : "Save Progress"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddProgress;