import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Calendar, MapPin, Trophy, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const publicLinks = [
    { to: "/", label: "Home", icon: null },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/locations", label: "Locations", icon: MapPin },
    { to: "/scoreboard", label: "Scoreboard", icon: Trophy },
  ];

  const authLinks = user
    ? [
        { to: "/dashboard", label: "Dashboard", icon: Calendar },
        { to: "/profile", label: "Profile", icon: User },
      ]
    : [
        { to: "/login", label: "Login", icon: null },
        { to: "/register", label: "Register", icon: null },
      ];

  return (
    <nav className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
      <div className="navbar-start">
        <Link to="/" className="btn btn-ghost text-xl font-bold">
          Karen2
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2">
          {publicLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={isActive(link.to) ? "active" : ""}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="navbar-end hidden lg:flex gap-2">
        {user ? (
          <>
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
              >
                <li className="menu-title">{user.name}</li>
                <li>
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li>
                  <Link to="/profile">Profile</Link>
                </li>
                {(user.role === "admin" || user.role === "superadmin") && (
                  <li>
                    <Link to="/admin">Admin</Link>
                  </li>
                )}
                <li>
                  <button onClick={logout} className="text-error">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Register
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="navbar-end lg:hidden">
        <button
          className="btn btn-ghost btn-circle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-base-100 shadow-lg lg:hidden">
          <ul className="menu menu-vertical p-4">
            {publicLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={isActive(link.to) ? "active" : ""}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              </li>
            ))}
            <div className="divider"></div>
            {user ? (
              <>
                <li>
                  <Link
                    to="/dashboard"
                    className={isActive("/dashboard") ? "active" : ""}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="w-4 h-4" /> Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    className={isActive("/profile") ? "active" : ""}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>
                </li>
                {(user.role === "admin" || user.role === "superadmin") && (
                  <li>
                    <Link
                      to="/admin"
                      className={isActive("/admin") ? "active" : ""}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  </li>
                )}
                <li>
                  <button onClick={logout} className="text-error">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/login"
                    className={isActive("/login") ? "active" : ""}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="btn btn-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}
