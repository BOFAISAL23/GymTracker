import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { friendlyAuthError } from "../services/authErrors";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  C,
  Page,
  SimpleTopBar,
  Btn,
  Panel,
  Field,
  Notice,
  inputClass,
  inputStyle,
} from "../design/ui";

function Register() {
  const { t } = useLanguage();
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
      setError(t("register.errPasswordMismatch"));
      return;
    }
    if (Number(age) < 10 || Number(age) > 100) {
      setError(t("register.errAge"));
      return;
    }
    if (Number(height) < 100 || Number(height) > 250) {
      setError(t("register.errHeight", { min: 100, max: 250 }));
      return;
    }
    if (Number(goalWeight) < 30 || Number(goalWeight) > 300) {
      setError(t("register.errGoalWeight", { min: 30, max: 300 }));
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
      setError(friendlyAuthError(err.code, t));
    } finally {
      setLoading(false);
    }
  };

  const numClass = `${inputClass} text-start`;
  const headingClass = "text-lg font-semibold mb-4";

  return (
    <Page>
      <SimpleTopBar />
      <main className="px-5 pb-16">
        <div className="w-full max-w-2xl mx-auto pt-6 md:pt-12">
          <h1 className="text-3xl md:text-4xl font-bold">{t("register.title")}</h1>
          <p className="mt-2 mb-8" style={{ color: C.dim }}>
            {t("register.subtitle")}
          </p>

          <Panel className="p-6 md:p-8">
            <form onSubmit={registerUser}>
              {error && <Notice tone="error" className="mb-6">{error}</Notice>}

              <h2 className={headingClass}>{t("register.personalInfo")}</h2>
              <div className="grid md:grid-cols-2 gap-5 mb-8">
                <Field label={t("register.name")} className="md:col-span-2">
                  <input
                    type="text"
                    placeholder={t("register.namePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>

                <Field label={t("register.age")}>
                  <input
                    type="number"
                    placeholder="25"
                    dir="ltr"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    className={numClass}
                    style={inputStyle}
                  />
                </Field>

                <Field label={t("register.height")}>
                  <input
                    type="number"
                    placeholder="175"
                    dir="ltr"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    required
                    className={numClass}
                    style={inputStyle}
                  />
                </Field>

                <Field label={t("register.goalWeight")}>
                  <input
                    type="number"
                    placeholder="75"
                    dir="ltr"
                    value={goalWeight}
                    onChange={(e) => setGoalWeight(e.target.value)}
                    required
                    className={numClass}
                    style={inputStyle}
                  />
                </Field>

                <Field label={t("register.goal")} className="md:col-span-2">
                  <input
                    type="text"
                    placeholder={t("register.goalPlaceholder")}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    required
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <h2 className={headingClass}>{t("register.account")}</h2>
              <div className="grid md:grid-cols-2 gap-5 mb-8">
                <Field label={t("register.email")} className="md:col-span-2">
                  <input
                    type="email"
                    placeholder={t("register.emailPlaceholder")}
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className={numClass}
                    style={inputStyle}
                  />
                </Field>

                <Field label={t("register.password")}>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("register.passwordPlaceholder")}
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className={`${numClass} pe-12`}
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t("register.hidePassword") : t("register.showPassword")}
                      className="absolute inset-y-0 right-0 w-11 flex items-center justify-center hover:opacity-80 focus-visible:outline focus-visible:outline-2 rounded"
                      style={{ color: C.dim, outlineColor: C.chalk }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </Field>

                <Field label={t("register.confirmPassword")}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("register.confirmPlaceholder")}
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={numClass}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <Btn type="submit" disabled={loading} className="w-full min-h-[44px]">
                {loading ? t("register.submitting") : t("register.submit")}
              </Btn>
            </form>
          </Panel>

          <p className="mt-6" style={{ color: C.dim }}>
            {t("register.haveAccount")}{" "}
            <Link
              to="/login"
              className="underline underline-offset-4 font-semibold"
              style={{ color: C.chalk }}
            >
              {t("register.login")}
            </Link>
          </p>
        </div>
      </main>
    </Page>
  );
}

export default Register;
