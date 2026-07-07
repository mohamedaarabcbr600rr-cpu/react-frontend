import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post("/api/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
      <h2 style={{ marginBottom: "8px" }}>Mot de passe oublié</h2>

      {sent ? (
        <div>
          <p style={{ color: "#2e7d32", marginTop: "16px" }}>
            ✅ Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.
          </p>
          <Link to="/" style={{ color: "#0a66c2", fontSize: "14px" }}>Retour à l'accueil</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
            Entre ton adresse email, on t'enverra un lien pour réinitialiser ton mot de passe.
          </p>
          <input
            type="email"
            placeholder="Ton adresse email"
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
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;