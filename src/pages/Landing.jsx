import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { startDemo } from "../services/demo";
import {
  FaDumbbell,
  FaChartLine,
  FaHeartbeat,
  FaBullseye,
  FaWeight,
  FaFire,
} from "react-icons/fa";

const features = [
  {
    icon: <FaChartLine />,
    title: "Weight Charts",
    text: "See your progress over time on a clean line chart that updates with every entry.",
  },
  {
    icon: <FaHeartbeat />,
    title: "BMI & Status",
    text: "Your BMI is calculated automatically and color-coded so you know where you stand.",
  },
  {
    icon: <FaBullseye />,
    title: "Goal Tracking",
    text: "Set a goal weight and watch the progress bar fill as you get closer to it.",
  },
  {
    icon: <FaDumbbell />,
    title: "Workout Log",
    text: "Log exercises with sets, reps and weight, then edit or remove them any time.",
  },
];

const steps = [
  { number: "1", title: "Create an account", text: "Tell us your height, age and goal weight." },
  { number: "2", title: "Log your progress", text: "Add your weight, calories and protein." },
  { number: "3", title: "Watch it improve", text: "Track your charts, stats and workouts." },
];

function Landing() {
  const [user, setUser] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await startDemo();
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      alert("Could not start the demo, please try again");
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white">
      {/* Navbar */}
      <nav className="max-w-6xl mx-auto flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600">
            <FaDumbbell />
          </div>
          <span className="text-lg md:text-xl font-bold">Gym Tracker</span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard">
              <button className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl font-semibold transition duration-300">
                Dashboard
              </button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <button className="text-gray-300 hover:text-white px-2 md:px-4 py-2 transition duration-300">
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button className="bg-blue-600 hover:bg-blue-700 px-4 md:px-5 py-2 rounded-xl font-semibold transition duration-300">
                  Get Started
                </button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="inline-block bg-slate-800 text-blue-400 text-sm font-semibold px-4 py-1 rounded-full mb-6">
            Free fitness progress tracker
          </p>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
            Track your body.
            <br />
            <span className="text-blue-500">Reach your goal.</span>
          </h1>

          <p className="text-gray-400 text-lg mt-6 max-w-xl">
            Log your weight, calories, protein and workouts in one place, and
            see your progress on clear charts and stats.
          </p>

          <div className="flex flex-wrap gap-4 mt-10">
            <Link to={user ? "/dashboard" : "/register"}>
              <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-semibold text-lg transition duration-300">
                {user ? "Go to Dashboard" : "Start for free"}
              </button>
            </Link>

            {!user && (
              <button
                onClick={handleDemo}
                disabled={demoLoading}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-semibold text-lg transition duration-300"
              >
                {demoLoading ? "Preparing demo..." : "Try Demo"}
              </button>
            )}
          </div>
        </div>

        {/* Preview card */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm mb-4">Preview</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <FaWeight /> Current Weight
              </div>
              <p className="text-2xl font-bold mt-1">82.4 KG</p>
            </div>

            <div className="bg-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <FaFire /> Calories
              </div>
              <p className="text-2xl font-bold mt-1">2,150</p>
            </div>
          </div>

          <div className="bg-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span className="flex items-center gap-2">
                <FaBullseye /> Goal Progress
              </span>
              <span className="text-white font-semibold">68%</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full"
                style={{ width: "68%" }}
              ></div>
            </div>
          </div>

          <p className="text-gray-500 text-xs mt-4">
            Sample data for illustration.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
          Everything you need
        </h2>
        <p className="text-gray-400 text-center mb-12">
          Simple tools to stay consistent.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-slate-800 rounded-2xl p-6 shadow-lg hover:scale-105 transition duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-700 text-blue-400 flex items-center justify-center text-xl mb-4">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          How it works
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.number} className="text-center">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                {s.number}
              </div>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-gray-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      {!user && (
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-slate-800 rounded-2xl p-10 text-center shadow-lg">
            <h2 className="text-3xl font-bold mb-3">Ready to start?</h2>
            <p className="text-gray-400 mb-8">
              Create your free account in under a minute.
            </p>
            <Link to="/register">
              <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-semibold text-lg transition duration-300">
                Get Started
              </button>
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-8">
        <div className="max-w-6xl mx-auto p-6 text-center text-gray-500 text-sm">
          Built with React, Firebase and Tailwind CSS.
        </div>
      </footer>
    </div>
  );
}

export default Landing;