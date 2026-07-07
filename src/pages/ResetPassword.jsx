import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "../axios";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError(t("resetPassword.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || t("resetPassword.genericError"));
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div style={{ maxWidth: "400px", margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
        <p style={{ color: "#c62828" }}>{t("resetPassword.invalidLink")}</p>
        <Link to="/" style={{ color: "#0a66c2", fontSize: "14px" }}>{t("resetPassword.backToHome")}</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
      <h2 style={{ marginBottom: "8px" }}>{t("resetPassword.title")}</h2>

      {success ? (
        <p style={{ color: "#2e7d32", marginTop: "16px" }}>
          {t("resetPassword.successMessage")}
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
            {t("resetPassword.chooseNewPassword", { email })}
          </p>
          <input
            type="password"
            placeholder={t("resetPassword.newPasswordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: "100%", padding: "12px", borderRadius: "8px",
              border: "1px solid #ddd", marginBottom: "12px", fontSize: "14px", boxSizing: "border-box"
            }}
          />
          <input
            type="password"
            placeholder={t("resetPassword.confirmPasswordPlaceholder")}
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            minLength={6}
            style={{
              width: "100%", padding: "12px", borderRadius: "8px",
              border: "1px solid #ddd", marginBottom: "16px", fontSize: "14px", boxSizing: "border-box"
            }}
          />
          {error && <p style={{ color: "#c62828", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", background: "#0a66c2", color: "white", border: "none",
              padding: "12px", borderRadius: "24px", fontWeight: 600, cursor: "pointer", fontSize: "14px"
            }}
          >
            {loading ? t("resetPassword.resetting") : t("resetPassword.resetButton")}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;