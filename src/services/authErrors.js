// تحويل أكواد أخطاء Firebase إلى رسائل مفهومة للمستخدم
// إذا رجعت الدالة نص فاضي معناها لا نعرض أي خطأ (مثلاً المستخدم سكّر نافذة Google)
// t: دالة الترجمة من useLanguage()
export function friendlyAuthError(code, t) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return t("authError.invalidCredential");
    case "auth/invalid-email":
      return t("authError.invalidEmail");
    case "auth/email-already-in-use":
      return t("authError.emailInUse");
    case "auth/weak-password":
      return t("authError.weakPassword");
    case "auth/too-many-requests":
      return t("authError.tooManyRequests");
    case "auth/network-request-failed":
      return t("authError.network");
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/popup-blocked":
      return t("authError.popupBlocked");
    case "auth/account-exists-with-different-credential":
      return t("authError.differentCredential");
    case "auth/unauthorized-domain":
      return t("authError.unauthorizedDomain");
    default:
      return t("authError.generic");
  }
}
