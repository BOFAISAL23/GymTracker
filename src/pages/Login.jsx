import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { friendlyAuthError } from "../services/authErrors";
import { signInWithGoogle } from "../services/googleAuth";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
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

function Login() {
  const { t } = useLanguage();
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
      setError(friendlyAuthError(err.code, t));
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
      setError(friendlyAuthError(err.code, t));
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    setError("");
    setInfo("");

    if (!email.trim()) {
      setError(t("login.enterEmailFirst"));
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      // رسالة عامة عشان ما نكشف هل الإيميل مسجل أو لا
      setInfo(t("login.resetSent"));
    } catch (err) {
      console.log(err);
      setError(friendlyAuthError(err.code, t));
    }
  };

  const linkClass = "underline underline-offset-4 font-semibold";

  return (
    <Page>
      <SimpleTopBar />
      <main className="px-5 pb-16">
        <div className="w-full max-w-md mx-auto pt-6 md:pt-12">
          <h1 className="text-3xl md:text-4xl font-bold">{t("login.title")}</h1>
          <p className="mt-2 mb-8" style={{ color: C.dim }}>
            {t("login.subtitle")}
          </p>

          <Panel className="p-6 md:p-8">
            <form onSubmit={loginUser} className="flex flex-col gap-5">
              {error && <Notice tone="error">{error}</Notice>}
              {info && <Notice tone="success">{info}</Notice>}

              <Field label={t("login.email")}>
                <input
                  type="email"
                  placeholder={t("login.emailPlaceholder")}
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={`${inputClass} text-start`}
                  style={inputStyle}
                />
              </Field>

              <div>
                <Field label={t("login.password")}>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className={`${inputClass} text-start pe-12`}
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                      className="absolute inset-y-0 right-0 w-11 flex items-center justify-center hover:opacity-80 focus-visible:outline focus-visible:outline-2 rounded"
                      style={{ color: C.dim, outlineColor: C.chalk }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </Field>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={forgotPassword}
                    className="text-sm underline underline-offset-4 min-h-[44px] -my-2 focus-visible:outline focus-visible:outline-2"
                    style={{ outlineColor: C.chalk }}
                  >
                    {t("login.forgot")}
                  </button>
                </div>
              </div>

              <Btn type="submit" disabled={loading} className="w-full min-h-[44px]">
                {loading ? t("login.submitting") : t("login.submit")}
              </Btn>

              <div className="flex items-center gap-3" aria-hidden="false">
                <div className="flex-1" style={{ height: 1, background: C.line }} />
                <span className="text-sm" style={{ color: C.dim }}>
                  {t("login.or")}
                </span>
                <div className="flex-1" style={{ height: 1, background: C.line }} />
              </div>

              <Btn
                type="button"
                variant="ghost"
                onClick={googleLogin}
                disabled={loading}
                className="w-full min-h-[44px]"
              >
                <FaGoogle />
                {t("login.google")}
              </Btn>
            </form>
          </Panel>

          <p className="mt-6" style={{ color: C.dim }}>
            {t("login.noAccount")}{" "}
            <Link to="/register" className={linkClass} style={{ color: C.chalk }}>
              {t("login.register")}
            </Link>
          </p>
        </div>
      </main>
    </Page>
  );
}

export default Login;
