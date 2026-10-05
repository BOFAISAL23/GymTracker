import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate, Link } from "react-router-dom";
import { FaDumbbell, FaEnvelope, FaLock } from "react-icons/fa";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const loginUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      alert(error.code);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <FaDumbbell className="text-3xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold">Gym Tracker</h1>
          <p className="text-gray-400 mt-2">
            Sign in to continue your journey
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={loginUser}
          className="bg-slate-800 rounded-2xl p-8 shadow-lg"
        >
          <h2 className="text-2xl font-bold mb-6">Login</h2>

          <label className="block text-gray-400 text-sm mb-2">Email</label>
          <div className="flex items-center gap-3 bg-slate-700 rounded-xl px-4 py-3 mb-5 focus-within:ring-2 focus-within:ring-blue-500">
            <FaEnvelope className="text-gray-400" />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-transparent outline-none w-full placeholder-gray-500"
            />
          </div>

          <label className="block text-gray-400 text-sm mb-2">Password</label>
          <div className="flex items-center gap-3 bg-slate-700 rounded-xl px-4 py-3 mb-6 focus-within:ring-2 focus-within:ring-blue-500">
            <FaLock className="text-gray-400" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-transparent outline-none w-full placeholder-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed py-3 rounded-xl font-semibold transition duration-300"
          >
            {loading ? "Signing in..." : "Login"}
          </button>

          <p className="text-center text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;