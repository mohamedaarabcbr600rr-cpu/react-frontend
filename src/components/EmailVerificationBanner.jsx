import { useState } from "react";
import axios from "../axios";

const EmailVerificationBanner = ({ user, onRefreshUser }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!user || user.email_verified_at) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await axios.post('/api/email/verification-notification');
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      console.error("Erreur envoi email:", err);
    } finally {
      setSending(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      const res = await axios.get('/api/profile');
      onRefreshUser(res.data);
    } catch (err) {
      console.error("Erreur vérification:", err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{
      background: "#fff8e1",
      borderBottom: "1px solid #ffe082",
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      flexWrap: "wrap",
      fontSize: "14px",
      color: "#7a5c00"
    }}>
      <span>⚠️ Merci de vérifier ton adresse email pour débloquer toutes les fonctionnalités.</span>
      <button
        onClick={handleResend}
        disabled={sending}
        style={{
          background: "#0a66c2", color: "white", border: "none",
          padding: "6px 14px", borderRadius: "16px", fontSize: "13px",
          cursor: "pointer", fontWeight: 600
        }}
      >
        {sending ? "Envoi..." : sent ? "Email renvoyé ✓" : "Renvoyer l'email"}
      </button>
      <button
        onClick={handleCheck}
        disabled={checking}
        style={{
          background: "transparent", color: "#0a66c2", border: "1px solid #0a66c2",
          padding: "6px 14px", borderRadius: "16px", fontSize: "13px",
          cursor: "pointer", fontWeight: 600
        }}
      >
        {checking ? "Vérification..." : "J'ai vérifié, actualiser"}
      </button>
    </div>
  );
};

export default EmailVerificationBanner;