import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import {
  C,
  Page,
  TopBar,
  Panel,
  SectionTitle,
  Plate,
  PlateBar,
  LedgerRow,
  Btn,
  LinkBtn,
} from "../design/ui";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

function Dashboard() {
  const { t, formatDate } = useLanguage();
  const [userData, setUserData] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const getData = async () => {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        navigate("/");
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }

        const q = query(
          collection(db, "progress"),
          where("userId", "==", currentUser.uid)
        );

        const querySnapshot = await getDocs(q);

        const progressArray = [];

        querySnapshot.forEach((document) => {
          progressArray.push({
            id: document.id,
            ...document.data(),
          });
        });

        progressArray.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        setProgressData(progressArray);
      } catch (error) {
        console.log(error);
      }
    };

    getData();
  }, [navigate]);

  const logoutUser = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.log(error.message);
    }
  };

  const deleteProgress = async (id) => {
    try {
      await deleteDoc(doc(db, "progress", id));

      setProgressData(
        progressData.filter((item) => item.id !== id)
      );
    } catch (error) {
      console.log(error);
    }
  };

  const confirmDelete = async () => {
    await deleteProgress(deleteId);
    setDeleteId(null);
  };

  const currentWeight =
    progressData.length > 0
      ? Number(progressData[progressData.length - 1].weight)
      : 0;

  const height = userData?.height ? userData.height / 100 : 1.65;

  const bmi =
    currentWeight > 0
      ? (currentWeight / (height * height)).toFixed(1)
      : 0;

  const bmiStatus =
    Number(bmi) === 0
      ? "-"
      : bmi < 18.5
      ? "Underweight"
      : bmi < 25
      ? "Normal"
      : bmi < 30
      ? "Overweight"
      : "Obese";

  const bmiStatusKey = {
    Underweight: "dashboard.bmiUnderweight",
    Normal: "dashboard.bmiNormal",
    Overweight: "dashboard.bmiOverweight",
    Obese: "dashboard.bmiObese",
  }[bmiStatus];

  const bmiTone =
    Number(bmi) === 0
      ? C.dim
      : bmi < 18.5
      ? C.blueText
      : bmi < 25
      ? C.greenText
      : bmi < 30
      ? C.yellowText
      : C.redText;

  const goalWeight = userData?.goalWeight || 75;

  const startingWeight =
    progressData.length > 0 ? Number(progressData[0].weight) : 0;

  const weightLost =
    startingWeight > 0
      ? (startingWeight - currentWeight).toFixed(1)
      : 0;

  const remainingWeight =
    currentWeight > 0
      ? (currentWeight - goalWeight).toFixed(1)
      : 0;

  const totalNeeded = startingWeight - goalWeight;

  const goalProgress =
    totalNeeded > 0
      ? (
          ((startingWeight - currentWeight) / totalNeeded) *
          100
        ).toFixed(0)
      : 0;

  // نسبة آمنة للشريط (بين 0 و 100)
  const progressBarWidth = Math.min(
    Math.max(Number(goalProgress), 0),
    100
  );

  const chartData = {
    labels: progressData.map((item, index) =>
      item.date && !isNaN(new Date(item.date))
        ? formatDate(item.date, { day: "numeric", month: "short" })
        : t("dashboard.entryN", { n: index + 1 })
    ),

    datasets: [
      {
        label: t("dashboard.chartLabel"),
        data: progressData.map((item) => Number(item.weight)),
        borderColor: C.blueText,
        backgroundColor: C.chalk,
        pointBackgroundColor: C.chalk,
        pointBorderColor: C.blueText,
        pointRadius: 4,
        borderWidth: 3,
        tension: 0.25,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { color: C.dim }, grid: { color: C.line } },
      x: { ticks: { color: C.dim }, grid: { color: C.line } },
    },
  };

  const goalText = userData
    ? ["cut", "bulk", "maintain"].includes(userData.goalType)
      ? t(`goal.${userData.goalType}`)
      : userData.goal
    : "";

  const th = "text-start py-3 px-3 font-normal text-sm";

  return (
    <Page>
      <TopBar />

      <main className="max-w-6xl mx-auto px-5 py-8">
        {userData?.isDemo && (
          <Panel
            className="px-5 py-4 mb-8 flex flex-wrap items-center justify-between gap-3"
            style={{ borderInlineStart: `4px solid ${C.yellow}` }}
          >
            <p>{t("dashboard.demoBanner")}</p>
            <Link
              to="/register"
              className="font-semibold underline underline-offset-4"
            >
              {t("dashboard.createAccount")}
            </Link>
          </Panel>
        )}

        {userData && (
          <>
            {/* Hero: who you are + goal bar + current weight plate */}
            <section className="grid md:grid-cols-[1fr_auto] gap-10 items-center mb-12">
              <div>
                <p style={{ color: C.dim }}>{goalText}</p>
                <h1 className="text-3xl md:text-5xl font-bold leading-tight mt-1 mb-8">
                  {t("dashboard.welcome", { name: userData.name || "" })}
                </h1>

                <div className="flex items-baseline justify-between gap-4 mb-3">
                  <span style={{ color: C.dim }}>{t("dashboard.goalProgress")}</span>
                  <span className="text-3xl font-bold tabular-nums">{goalProgress}%</span>
                </div>
                <PlateBar percent={Number(goalProgress)} />
                <p className="text-sm mt-3" style={{ color: C.dim }}>
                  {t("dashboard.goalWeight")}: {goalWeight} {t("common.kg")}
                </p>
              </div>

              <div className="justify-self-center">
                <Plate
                  color={C.blue}
                  ink="#fff"
                  size={190}
                  value={currentWeight}
                  unit={t("common.kg")}
                  label={t("dashboard.currentWeight")}
                />
              </div>
            </section>

            {/* Body ledger + daily target plates */}
            <div className="grid lg:grid-cols-2 gap-6 mb-12">
              <Panel className="p-6">
                <SectionTitle>{t("dashboard.body")}</SectionTitle>
                <LedgerRow label={t("dashboard.startingWeight")} value={`${startingWeight} ${t("common.kg")}`} />
                <LedgerRow label={t("dashboard.weightLost")} value={`${weightLost} ${t("common.kg")}`} />
                <LedgerRow label={t("dashboard.remaining")} value={`${remainingWeight} ${t("common.kg")}`} />
                <LedgerRow label={t("dashboard.bmi")} value={bmi} />
                <LedgerRow
                  label={t("dashboard.status")}
                  value={bmiStatusKey ? t(bmiStatusKey) : bmiStatus}
                  valueColor={bmiTone}
                />
              </Panel>

              <Panel className="p-6">
                <SectionTitle
                  action={
                    <Link
                      to="/onboarding"
                      className="text-sm underline underline-offset-4"
                      style={{ color: C.dim }}
                    >
                      {t("dashboard.editPlan")}
                    </Link>
                  }
                >
                  {t("dashboard.dailyTarget")}
                </SectionTitle>

                {userData.calorieTarget ? (
                  <div className="grid grid-cols-2 gap-y-6 justify-items-center pt-2">
                    <Plate color={C.chalk} ink={C.rubber} size={120} value={userData.calorieTarget} unit={t("common.kcal")} label={t("dashboard.calories")} />
                    <Plate color={C.red} size={120} value={userData.proteinTarget} unit={t("common.g")} label={t("dashboard.protein")} />
                    <Plate color={C.yellow} ink={C.rubber} size={120} value={userData.carbsTarget} unit={t("common.g")} label={t("dashboard.carbs")} />
                    <Plate color={C.green} size={120} value={userData.fatTarget} unit={t("common.g")} label={t("dashboard.fat")} />
                  </div>
                ) : (
                  <div>
                    <p className="mb-5" style={{ color: C.dim }}>
                      {t("dashboard.noPlan")}
                    </p>
                    <LinkBtn to="/onboarding">{t("dashboard.setPlan")}</LinkBtn>
                  </div>
                )}
              </Panel>
            </div>

            {/* Chart */}
            {progressData.length > 0 && (
              <section className="mb-12">
                <SectionTitle>{t("dashboard.weightChart")}</SectionTitle>
                <Panel dir="ltr" className="p-5 h-[320px]">
                  <Line data={chartData} options={chartOptions} />
                </Panel>
              </section>
            )}

            {/* History */}
            <section>
              <SectionTitle>{t("dashboard.history")}</SectionTitle>

              {progressData.length === 0 ? (
                <p style={{ color: C.dim }}>{t("dashboard.noProgress")}</p>
              ) : (
                <Panel className="overflow-x-auto">
                  <table className="w-full min-w-[560px] whitespace-nowrap tabular-nums">
                    <thead>
                      <tr style={{ color: C.dim, borderBottom: `1px solid ${C.line}` }}>
                        <th className={th}>{t("dashboard.date")}</th>
                        <th className={th}>{t("dashboard.weight")}</th>
                        <th className={th}>{t("dashboard.calories")}</th>
                        <th className={th}>{t("dashboard.protein")}</th>
                        <th className={th}>
                          <span className="sr-only">{t("dashboard.action")}</span>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {progressData
                        .slice()
                        .reverse()
                        .map((item) => (
                          <tr key={item.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                            <td className="py-3 px-3" style={{ color: C.dim }}>
                              {formatDate(item.date, { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                            <td className="py-3 px-3 font-bold" style={{ color: C.blueText }}>{item.weight}</td>
                            <td className="py-3 px-3">{item.calories}</td>
                            <td className="py-3 px-3" style={{ color: C.redText }}>{item.protein}</td>
                            <td className="py-3 px-3">
                              <div className="flex gap-5 justify-end">
                                <Link
                                  to={`/edit-progress/${item.id}`}
                                  className="underline underline-offset-4"
                                >
                                  {t("common.edit")}
                                </Link>
                                <button
                                  onClick={() => setDeleteId(item.id)}
                                  className="underline underline-offset-4"
                                  style={{ color: C.redText }}
                                >
                                  {t("common.delete")}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </Panel>
              )}
            </section>
          </>
        )}
      </main>

      {/* Delete confirmation */}
      {deleteId && (
        <div
          className="fixed inset-0 flex items-center justify-center p-6 z-50"
          style={{ background: "rgba(0,0,0,.7)" }}
        >
          <Panel className="p-7 w-full max-w-sm" role="dialog" aria-modal="true">
            <h3 className="text-2xl font-bold mb-2">{t("dashboard.deleteTitle")}</h3>
            <p className="mb-6" style={{ color: C.dim }}>
              {t("dashboard.deleteWarning")}
            </p>

            <div className="flex gap-3">
              <Btn variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>
                {t("common.cancel")}
              </Btn>
              <Btn variant="danger" className="flex-1" onClick={confirmDelete}>
                {t("common.delete")}
              </Btn>
            </div>
          </Panel>
        </div>
      )}
    </Page>
  );
}

export default Dashboard;
