import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Navigate, useLocation } from "react-router-dom";
import { auth, db } from "../services/firebase";

// skipOnboardingCheck: نستخدمه في صفحة /onboarding نفسها عشان ما ندخل في حلقة
function ProtectedRoute({ children, skipOnboardingCheck = false }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // نتيجة الفحص نخزنها مع المفتاح (المستخدم + المسار)،
  // عشان ما نستخدم نتيجة قديمة من صفحة ثانية (هذا كان سبب الرجوع للاستبيان)
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Firebase يحتاج لحظة عند فتح/تحديث الصفحة ليعرف إذا المستخدم مسجل
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const key = user ? `${user.uid}:${pathname}` : "";

  useEffect(() => {
    if (!user || skipOnboardingCheck) return;

    let cancelled = false;

    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (!cancelled) {
          setResult({
            key,
            onboarded: snap.exists() && snap.data().onboardingDone === true,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        // إذا فشلت القراءة لا نمنع المستخدم من الدخول
        if (!cancelled) setResult({ key, onboarded: true });
      });

    return () => {
      cancelled = true;
    };
  }, [user, key, skipOnboardingCheck]);

  const loadingScreen = (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white flex items-center justify-center">
      <p className="text-gray-400 text-lg">Loading...</p>
    </div>
  );

  if (authLoading) return loadingScreen;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (skipOnboardingCheck) return children;

  // ما انتهى الفحص لهذا المسار بعد
  if (!result || result.key !== key) return loadingScreen;

  if (!result.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export default ProtectedRoute;