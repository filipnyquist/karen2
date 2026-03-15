import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { eden } from "../eden";
import { Check, X, Loader2 } from "lucide-react";

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const err = error as { message?: string; value?: { message?: string } };
    return err.message || err.value?.message || "Verification failed";
  }
  return "Verification failed";
}

export function VerifyEmail() {
  const { t } = useTranslation("auth");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  async function verifyEmail(token: string) {
    try {
      const { data, error } = await eden.auth["verify-email"].post({ token });
      if (error) {
        setStatus("error");
        setMessage(getErrorMessage(error));
      } else {
        setStatus("success");
        setMessage((data as { message?: string })?.message || "Email verified successfully");
      }
    } catch {
      setStatus("error");
      setMessage("An error occurred during verification");
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <h2 className="text-2xl font-bold">{t("verifyEmail.verifying")}</h2>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold">{t("verifyEmail.success")}</h2>
              <p className="text-base-content/70 mb-4">{message}</p>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/login")}
              >
                {t("verifyEmail.loginButton")}
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-error" />
              </div>
              <h2 className="text-2xl font-bold">{t("verifyEmail.title")}</h2>
              <p className="text-base-content/70 mb-4">{t("verifyEmail.error")}</p>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/login")}
              >
                {t("verifyEmail.loginButton")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
