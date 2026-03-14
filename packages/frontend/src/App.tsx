import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { VerifyEmail } from "./pages/VerifyEmail";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { Events } from "./pages/Events";
import { EventDetails } from "./pages/EventDetails";
import { GuestList } from "./pages/GuestList";
import { Locations } from "./pages/Locations";
import { LocationDetails } from "./pages/LocationDetails";
import { Scoreboard } from "./pages/Scoreboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route index element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/events/:id/guests" element={
          <ProtectedRoute>
            <GuestList />
          </ProtectedRoute>
        } />
        <Route path="/locations" element={<Locations />} />
        <Route path="/locations/:id" element={<LocationDetails />} />
        <Route path="/scoreboard" element={<Scoreboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p>Admin functionality coming soon...</p>
              </div>
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
