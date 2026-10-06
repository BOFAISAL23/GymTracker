import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// تسجيل الدخول بحساب Google.
// إذا كان أول دخول للمستخدم ننشئ له مستند في users، لأن الداشبورد تقرأ منه.
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      name: user.displayName || "",
      email: user.email || "",
      age: "",
      goal: "",
      height: 0,
      goalWeight: 0,
    });
  }

  return user;
}
