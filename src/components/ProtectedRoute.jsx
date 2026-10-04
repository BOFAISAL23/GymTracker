import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Navigate } from "react-router-dom";
import { auth } from "../services/firebase";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white flex items-center justify-center">
        <p className="text-gray-400 text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;