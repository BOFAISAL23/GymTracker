import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddProgress from "./pages/AddProgress";
import EditProgress from "./pages/EditProgress";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-progress"
          element={
            <ProtectedRoute>
              <AddProgress />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-progress/:id"
          element={
            <ProtectedRoute>
              <EditProgress />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;