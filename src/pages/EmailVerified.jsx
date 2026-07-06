import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const EmailVerified = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("status");

  useEffect(() => {
    const timer = setTimeout(() => navigate("/"), 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const messages = {
    success: { icon: "✅", title: "Email vérifié !", text: "Ton adresse email a été confirmée avec succès." },
    invalid: { icon: "❌", title: "Lien invalide", text: "Ce lien de vérification n'est pas valide." },
    expired: { icon: "⏰", title: "Lien expiré", text: "Ce lien de vérification a expiré, demande-en un nouveau." },
  };

  const msg = messages[status] || messages.invalid;

  return (
    <div style={{
      textAlign: "center", padding: "80px 20px", maxWidth: "400px", margin: "0 auto"
    }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>{msg.icon}</div>
      <h2 style={{ marginBottom: "8px" }}>{msg.title}</h2>
      <p style={{ color: "#666" }}>{msg.text}</p>
      <p style={{ color: "#999", fontSize: "13px", marginTop: "24px" }}>Redirection automatique...</p>
    </div>
  );
};

export default EmailVerified;