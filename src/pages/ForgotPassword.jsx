import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "../axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post("/api/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || t("forgotPassword.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
      <h2 style={{ marginBottom: "8px" }}>{t("forgotPassword.title")}</h2>

      {sent ? (
        <div>
          <p style={{ color: "#2e7d32", marginTop: "16px" }}>
            {t("forgotPassword.successMessage")}
          </p>
          <Link to="/" style={{ color: "#0a66c2", fontSize: "14px" }}>{t("forgotPassword.backToHome")}</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
            {t("forgotPassword.instructions")}
          </p>
          <input
            type="email"
            placeholder={t("forgotPassword.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
            {loading ? t("forgotPassword.sending") : t("forgotPassword.sendLink")}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;