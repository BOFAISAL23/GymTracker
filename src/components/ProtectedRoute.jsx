import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Navigate, useLocation } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { useLanguage } from "../i18n/LanguageContext";
import { Page, PlateMark, C } from "../design/ui";

// skipOnboardingCheck: نستخدمه في صفحة /onboarding نفسها عشان ما ندخل في حلقة
function ProtectedRoute({ children, skipOnboardingCheck = false }) {
  const { pathname } = useLocation();
  const { t } = useLanguage();
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
    <Page>
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-pulse motion-reduce:animate-none">
          <PlateMark size={44} />
        </div>
        <p style={{ color: C.dim }}>{t("common.loading")}</p>
      </div>
    </Page>
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