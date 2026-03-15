import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Calendar, MapPin, Trophy, Menu, X, User, LogOut, Ticket } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation("navigation");
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const publicLinks = [
    { to: "/", label: t("links.home"), icon: null },
    { to: "/events", label: t("links.events"), icon: Calendar },
    { to: "/locations", label: t("links.locations"), icon: MapPin },
    { to: "/scoreboard", label: t("links.scoreboard"), icon: Trophy },
  ];

  const authLinks = user
    ? [
        { to: "/dashboard", label: t("links.dashboard"), icon: Calendar },
        { to: "/profile", label: t("links.profile"), icon: User },
      ]
    : [
        { to: "/login", label: t("links.login"), icon: null },
        { to: "/register", label: t("links.register"), icon: null },
      ];

  return (
    <nav className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
      <div className="navbar-start">
        <Link to="/" className="btn btn-ghost text-xl font-bold">
          {t("brand")}
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
        <LanguageSwitcher />
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
                  <Link to="/dashboard">{t("links.dashboard")}</Link>
                </li>
                <li>
                  <Link to="/profile">{t("links.profile")}</Link>
                </li>
                <li>
                  <Link to="/my-tickets">
                    <Ticket className="w-4 h-4" /> {t("links.myTickets")}
                  </Link>
                </li>
                {(user.role === "admin" || user.role === "superadmin") && (
                  <li>
                    <Link to="/admin">{t("links.admin")}</Link>
                  </li>
                )}
                <li>
                  <button onClick={logout} className="text-error">
                    <LogOut className="w-4 h-4" /> {t("links.logout")}
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">
              {t("links.login")}
            </Link>
            <Link to="/register" className="btn btn-primary">
              {t("links.register")}
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="navbar-end lg:hidden gap-2">
        <LanguageSwitcher />
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
                    <Calendar className="w-4 h-4" /> {t("links.dashboard")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    className={isActive("/profile") ? "active" : ""}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" /> {t("links.profile")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/my-tickets"
                    className={isActive("/my-tickets") ? "active" : ""}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Ticket className="w-4 h-4" /> {t("links.myTickets")}
                  </Link>
                </li>
                {(user.role === "admin" || user.role === "superadmin") && (
                  <li>
                    <Link
                      to="/admin"
                      className={isActive("/admin") ? "active" : ""}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t("links.admin")}
                    </Link>
                  </li>
                )}
                <li>
                  <button onClick={logout} className="text-error">
                    <LogOut className="w-4 h-4" /> {t("links.logout")}
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
                    {t("links.login")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="btn btn-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("links.register")}
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
