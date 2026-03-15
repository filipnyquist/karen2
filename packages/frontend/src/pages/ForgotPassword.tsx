import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { eden } from "../eden";
import { Mail, AlertCircle, Check, ArrowLeft } from "lucide-react";

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const err = error as { message?: string; value?: { message?: string } };
    return err.message || err.value?.message || "Request failed";
  }
  return "An error occurred. Please try again.";
}

export function ForgotPassword() {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: apiError } = await eden.auth["forgot-password"].post({
        email,
      });
      if (apiError) {
        setError(getErrorMessage(apiError));
      } else {
        setIsSuccess(true);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h2 className="card-title text-2xl">{t("forgotPassword.success")}</h2>
            <Link to="/login" className="btn btn-primary">
              <ArrowLeft className="w-4 h-4" />
              {t("forgotPassword.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-4">
            <Link to="/login" className="btn btn-ghost btn-circle btn-sm">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h2 className="card-title text-2xl">{t("forgotPassword.title")}</h2>
          </div>
          <p className="text-base-content/70 mb-6">
            {t("forgotPassword.subtitle")}
          </p>

          {error && (
            <div className="alert alert-error mb-4">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("forgotPassword.email")}</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
                <input
                  type="email"
                  placeholder={t("forgotPassword.emailPlaceholder")}
                  className="input input-bordered w-full pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                t("forgotPassword.submit")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
