import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { friendlyAuthError } from "../services/authErrors";
import { signInWithGoogle } from "../services/googleAuth";
import { useNavigate, Link } from "react-router-dom";
import {
  FaDumbbell,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGoogle,
} from "react-icons/fa";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const navigate = useNavigate();

  const loginUser = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      setError(friendlyAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setError("");
    setInfo("");
    setLoading(true);

    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      setError(friendlyAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    setError("");
    setInfo("");

    if (!email.trim()) {
      setError("Enter your email above, then click Forgot password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      // رسالة عامة عشان ما نكشف هل الإيميل مسجل أو لا
      setInfo(
        "If an account exists for this email, a password reset link has been sent."
      );
    } catch (err) {
      console.log(err);
      setError(friendlyAuthError(err.code));
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

          {error && (
            <div
              role="alert"
              className="bg-red-500/10 border border-red-500 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm"
            >
              {error}
            </div>
          )}

          {info && (
            <div className="bg-green-500/10 border border-green-500 text-green-300 rounded-xl px-4 py-3 mb-5 text-sm">
              {info}
            </div>
          )}

          <label className="block text-gray-400 text-sm mb-2">Email</label>
          <div className="flex items-center gap-3 bg-slate-700 rounded-xl px-4 py-3 mb-5 focus-within:ring-2 focus-within:ring-blue-500">
            <FaEnvelope className="text-gray-400" />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="bg-transparent outline-none w-full placeholder-gray-500"
            />
          </div>

          <label className="block text-gray-400 text-sm mb-2">Password</label>
          <div className="flex items-center gap-3 bg-slate-700 rounded-xl px-4 py-3 mb-2 focus-within:ring-2 focus-within:ring-blue-500">
            <FaLock className="text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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

          <div className="text-right mb-6">
            <button
              type="button"
              onClick={forgotPassword}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed py-3 rounded-xl font-semibold transition duration-300"
          >
            {loading ? "Signing in..." : "Login"}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-600" />
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-slate-600" />
          </div>

          <button
            type="button"
            onClick={googleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed py-3 rounded-xl font-semibold transition duration-300"
          >
            <FaGoogle />
            Continue with Google
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