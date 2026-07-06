import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const EmailVerified = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const status = searchParams.get("status");

  useEffect(() => {
    const timer = setTimeout(() => navigate("/"), 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const getMessage = (status) => {
    switch (status) {
      case "success":
        return {
          icon: "✅",
          title: t("emailVerified.success.title"),
          text: t("emailVerified.success.text"),
        };
      case "invalid":
        return {
          icon: "❌",
          title: t("emailVerified.invalid.title"),
          text: t("emailVerified.invalid.text"),
        };
      case "expired":
        return {
          icon: "⏰",
          title: t("emailVerified.expired.title"),
          text: t("emailVerified.expired.text"),
        };
      default:
        return {
          icon: "❌",
          title: t("emailVerified.invalid.title"),
          text: t("emailVerified.invalid.text"),
        };
    }
  };

  const msg = getMessage(status);

  return (
    <div
      style={{
        textAlign: "center",
        padding: "80px 20px",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>{msg.icon}</div>
      <h2 style={{ marginBottom: "8px" }}>{msg.title}</h2>
      <p style={{ color: "#666" }}>{msg.text}</p>
      <p style={{ color: "#999", fontSize: "13px", marginTop: "24px" }}>
        {t("emailVerified.redirecting")}
      </p>
    </div>
  );
};

export default EmailVerified;