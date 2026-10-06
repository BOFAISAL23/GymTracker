import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { friendlyAuthError } from "../services/authErrors";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { FaDumbbell, FaEye, FaEyeSlash } from "react-icons/fa";

function Register() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState("");
  const [height, setHeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const registerUser = async (e) => {
    e.preventDefault();
    setError("");

    // تحقق بسيط قبل الإرسال
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (Number(age) < 10 || Number(age) > 100) {
      setError("Please enter a valid age.");
      return;
    }
    if (Number(height) < 100 || Number(height) > 250) {
      setError("Height should be between 100 and 250 cm.");
      return;
    }
    if (Number(goalWeight) < 30 || Number(goalWeight) > 300) {
      setError("Goal weight should be between 30 and 300 KG.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        age,
        goal: goal.trim(),
        height: Number(height),
        goalWeight: Number(goalWeight),
        email: email.trim(),
      });

      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      setError(friendlyAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "block text-gray-400 text-sm mb-2";
  const inputClass =
    "w-full bg-slate-700 rounded-xl px-4 py-3 outline-none placeholder-gray-500 focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <FaDumbbell className="text-3xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold">Gym Tracker</h1>
          <p className="text-gray-400 mt-2">
            Create your account and start tracking
          </p>
        </div>

        <form
          onSubmit={registerUser}
          className="bg-slate-800 rounded-2xl p-8 shadow-lg"
        >
          <h2 className="text-2xl font-bold mb-6">Register</h2>

          {error && (
            <div
              role="alert"
              className="bg-red-500/10 border border-red-500 text-red-300 rounded-xl px-4 py-3 mb-6 text-sm"
            >
              {error}
            </div>
          )}

          {/* Personal info */}
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
            Personal Info
          </p>

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Age</label>
              <input
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Height (cm)</label>
              <input
                type="number"
                placeholder="175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Goal Weight (KG)</label>
              <input
                type="number"
                placeholder="75"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Goal</label>
              <input
                type="text"
                placeholder="Lose weight, build muscle..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Account info */}
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
            Account
          </p>

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <div className="md:col-span-2">
              <label className={labelClass}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <div className="flex items-center gap-3 bg-slate-700 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="bg-transparent outline-none w-full placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-gray-400 hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed py-3 rounded-xl font-semibold transition duration-300"
          >
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className="text-center text-gray-400 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;