import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Navbar } from "./Navbar";

export function Layout() {
  const { t } = useTranslation("common");

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="footer footer-center p-4 bg-base-100 text-base-content">
        <div>
          <p>
            © {new Date().getFullYear()} {t("footer.copyright")}
          </p>
        </div>
      </footer>
    </div>
  );
}
