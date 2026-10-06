// تحويل أكواد أخطاء Firebase إلى رسائل مفهومة للمستخدم
// إذا رجعت الدالة نص فاضي معناها لا نعرض أي خطأ (مثلاً المستخدم سكّر نافذة Google)
export function friendlyAuthError(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked. Allow popups for this site and try again.";
    case "auth/account-exists-with-different-credential":
      return "This email is already registered with a password. Log in with your email and password.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Google sign-in.";
    default:
      return "Something went wrong. Please try again.";
  }
}