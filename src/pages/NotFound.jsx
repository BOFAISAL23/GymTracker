import { Link } from "react-router-dom";
import { FaDumbbell } from "react-icons/fa";

function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-6 shadow-lg">
          <FaDumbbell className="text-3xl" />
        </div>

        <h1 className="text-7xl font-extrabold mb-3">404</h1>
        <h2 className="text-2xl font-bold mb-3">Page not found</h2>

        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or was moved.
        </p>

        <Link to="/">
          <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-semibold transition duration-300">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}

export default NotFound;