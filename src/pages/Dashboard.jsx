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

import {
  FaWeight,
  FaBullseye,
  FaChartLine,
  FaHeartbeat,
} from "react-icons/fa";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [progressData, setProgressData] = useState([]);

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

  const bmiColor =
    Number(bmi) === 0
      ? "text-gray-400"
      : bmi < 18.5
      ? "text-blue-400"
      : bmi < 25
      ? "text-green-400"
      : bmi < 30
      ? "text-yellow-400"
      : "text-red-400";

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
    labels: progressData.map((_, index) => `Entry ${index + 1}`),

    datasets: [
      {
        label: "Weight Progress",
        data: progressData.map((item) => Number(item.weight)),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderWidth: 3,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "top",
      },
    },

    scales: {
      y: {
        ticks: {
          color: "white",
        },
        grid: {
          color: "#334155",
        },
      },

      x: {
        ticks: {
          color: "white",
        },
        grid: {
          color: "#334155",
        },
      },
    },
  };

  const cardClass =
    "bg-slate-800 rounded-2xl p-6 shadow-lg hover:scale-105 transition duration-300";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white p-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-2xl p-6 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-extrabold">Gym Tracker</h1>

          <p className="text-gray-400 mt-2">
            Welcome back, {userData?.name} 👋
          </p>
        </div>

        <div className="flex gap-3">
          <Link to="/add-progress">
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl">
              Add Progress
            </button>
          </Link>

          <button
            onClick={logoutUser}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl"
          >
            Logout
          </button>
        </div>
      </div>

      {userData && (
        <>
          {/* Profile */}
          <div className="bg-slate-800 rounded-2xl p-6 mb-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-5">Profile</h2>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-slate-700 p-4 rounded-xl">
                <p className="text-gray-400">Name</p>
                <p className="font-semibold">{userData.name}</p>
              </div>

              <div className="bg-slate-700 p-4 rounded-xl">
                <p className="text-gray-400">Age</p>
                <p className="font-semibold">{userData.age}</p>
              </div>

              <div className="bg-slate-700 p-4 rounded-xl">
                <p className="text-gray-400">Email</p>
                <p className="font-semibold">{userData.email}</p>
              </div>

              <div className="bg-slate-700 p-4 rounded-xl">
                <p className="text-gray-400">Goal</p>
                <p className="font-semibold">{userData.goal}</p>
              </div>
            </div>
          </div>

          <hr className="border-slate-700 mb-6" />

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <div className={cardClass}>
              <div className="flex items-center gap-2 text-gray-400">
                <FaWeight />
                <h3 className="text-sm">Starting Weight</h3>
              </div>
              <p className="text-3xl font-bold mt-2">{startingWeight} KG</p>
            </div>

            <div className={cardClass}>
              <div className="flex items-center gap-2 text-gray-400">
                <FaChartLine />
                <h3 className="text-sm">Current Weight</h3>
              </div>
              <p className="text-3xl font-bold mt-2">{currentWeight} KG</p>
            </div>

            <div className={cardClass}>
              <div className="flex items-center gap-2 text-gray-400">
                <FaHeartbeat />
                <h3 className="text-sm">BMI</h3>
              </div>
              <p className="text-3xl font-bold mt-2">{bmi}</p>
            </div>

            <div className={cardClass}>
              <h3 className="text-gray-400 text-sm">Status</h3>
              <p className={`text-3xl font-bold mt-2 ${bmiColor}`}>
                {bmiStatus}
              </p>
            </div>

            <div className={cardClass}>
              <h3 className="text-gray-400 text-sm">Remaining</h3>
              <p className="text-3xl font-bold mt-2">{remainingWeight} KG</p>
            </div>

            <div className={cardClass}>
              <h3 className="text-gray-400 text-sm">Weight Lost</h3>
              <p className="text-3xl font-bold mt-2">{weightLost} KG</p>
            </div>

            <div className={cardClass}>
              <div className="flex items-center gap-2 text-gray-400">
                <FaBullseye />
                <h3 className="text-sm">Goal Progress</h3>
              </div>

              <p className="text-3xl font-bold mt-2">{goalProgress}%</p>

              <div className="w-full bg-slate-700 rounded-full h-3 mt-4">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressBarWidth}%` }}
                ></div>
              </div>
            </div>
          </div>

          <hr className="border-slate-700 mb-6" />

          {/* Chart */}
          {progressData.length > 0 && (
            <>
              <h2 className="text-2xl font-bold mb-4">Weight Chart</h2>

              <div className="bg-slate-800 rounded-2xl p-6 shadow-lg max-w-4xl mx-auto mb-6 h-[350px]">
                <Line data={chartData} options={chartOptions} />
              </div>

              <hr className="border-slate-700 mb-6" />
            </>
          )}

          {/* History */}
          <h2 className="text-2xl font-bold mb-4">Progress History</h2>

          {progressData.length === 0 ? (
            <p>No progress yet</p>
          ) : (
            <div className="bg-slate-800 rounded-2xl p-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-3">Weight</th>
                    <th className="text-left p-3">Calories</th>
                    <th className="text-left p-3">Protein</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {progressData
                    .slice()
                    .reverse()
                    .map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-700"
                      >
                        <td className="p-3">{item.weight}</td>
                        <td className="p-3">{item.calories}</td>
                        <td className="p-3">{item.protein}</td>
                        <td className="p-3">
                          {new Date(item.date).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => deleteProgress(item.id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;