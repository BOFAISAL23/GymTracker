// يجمع نصوص كل الصفحات. كل صفحة لها ملف خاص: { en: {...}, ar: {...} }
import common from "./common";
import landing from "./landing";
import auth from "./auth";
import onboarding from "./onboarding";
import dashboard from "./dashboard";
import workouts from "./workouts";
import progress from "./progress";
import meals from "./meals";
import notfound from "./notfound";
import report from "./report";

const parts = [
  common,
  landing,
  auth,
  onboarding,
  dashboard,
  workouts,
  progress,
  meals,
  notfound,
  report,
];

export const translations = {
  en: Object.assign({}, ...parts.map((p) => p.en)),
  ar: Object.assign({}, ...parts.map((p) => p.ar)),
};
