import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { WebSocketProvider } from "./contexts/WebSocketContext";
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
import { MyTickets } from "./pages/MyTickets";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminUserDetail } from "./pages/admin/AdminUserDetail";
import { AdminEvents } from "./pages/admin/AdminEvents";
import { AdminLocations } from "./pages/admin/AdminLocations";
import { AdminFrontpage } from "./pages/admin/AdminFrontpage";
import { CreateEvent } from "./pages/admin/CreateEvent";
import { EditEvent } from "./pages/admin/EditEvent";
import { PublicProfile } from "./pages/PublicProfile";

function App() {
  return (
    <WebSocketProvider>
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
        <Route
          path="/my-tickets"
          element={
            <ProtectedRoute>
              <MyTickets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <PublicProfile />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminUserDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/new"
          element={
            <ProtectedRoute requiredRole="admin">
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/:id/edit"
          element={
            <ProtectedRoute requiredRole="admin">
              <EditEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/locations"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLocations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/frontpage"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminFrontpage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
    </WebSocketProvider>
  );
}

export default App;
