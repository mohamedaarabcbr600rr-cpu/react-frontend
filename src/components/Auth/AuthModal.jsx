import { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "../../axios";
import "./AuthModal.css";
import { Link } from "react-router-dom";
const AuthModal = ({ setUser, closeModal }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  // LOGIN
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // REGISTER
  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const resetForms = () => {
    setLoginEmail("");
    setLoginPassword("");
    setName("");
    setRegisterEmail("");
    setRegisterPassword("");
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
  };

// LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.get("/sanctum/csrf-cookie");

      const res = await axios.post("/api/login", {
        email: loginEmail,
        password: loginPassword,
      });

      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);

      closeModal();
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert(t("auth.errors.loginError"));
    } finally {
      setLoading(false);
    }
  };

const handleGoogleLogin = () => {
  const referralCode = localStorage.getItem('referral_code');
  const url = new URL(`${import.meta.env.VITE_API_URL}/auth/google/redirect`);
  if (referralCode) {
    url.searchParams.set('referral_code', referralCode);
  }
  window.location.href = url.toString();
};

// REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.get("/sanctum/csrf-cookie");

      const referralCode = localStorage.getItem('referral_code');

      await axios.post("/api/register", {
        name,
        email: registerEmail,
        password: registerPassword,
        password_confirmation: registerPassword,
        referral_code: referralCode || undefined,
      });

      localStorage.removeItem('referral_code');

      const res = await axios.post("/api/login", {
        email: registerEmail,
        password: registerPassword,
      });

      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);

      closeModal();
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert(t("auth.errors.registerError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">

      {/* TOGGLE */}
      <div className="switch-container">
        <span className={!isLogin ? "active" : ""}>{t("auth.signUp")}</span>

        <div
          className={`switch-btn ${isLogin ? "register" : "login"}`}
          onClick={() => {
            toggleMode();
            resetForms();
          }}
        >
          <div className="circle">
            <svg viewBox="0 0 24 24" className="arrow">
              <path
                d="M8 5l8 7-8 7"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <span className={isLogin ? "active" : ""}>{t("auth.login")}</span>
      </div>

      {/* CARD */}
      <div className="card-3d-wrap">
        <div className={`card-3d-wrapper ${!isLogin ? "rotate" : ""}`}>

          {/* LOGIN */}
          <div className="card-front">
            <form onSubmit={handleLogin}>
              <h2>{t("auth.welcomeBack")}</h2>

              <input
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                className="auth-input"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder={t("auth.passwordPlaceholder")}
                className="auth-input"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />

             <button className="auth-btn" disabled={loading}>
                {loading ? t("common.loading") : t("auth.loginButton")}
              </button>

              <Link to="/forgot-password" style={{ display: "block", textAlign: "center", marginTop: "12px", fontSize: "13px", color: "#0a66c2" }} onClick={closeModal}>
                Mot de passe oublié ?
              </Link>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "18px 0" }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>ou</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "10px", padding: "12px", borderRadius: "12px",
                  background: "#fff", border: "1px solid rgba(255,255,255,0.15)",
                  color: "#1f2937", fontSize: "14px", fontWeight: 600, cursor: "pointer"
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </form>
          </div>

          {/* REGISTER */}
          <div className="card-back">
            <form onSubmit={handleRegister}>
              <h2>{t("auth.createAccount")}</h2>

              <input
                type="text"
                placeholder={t("auth.fullNamePlaceholder")}
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <input
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                className="auth-input"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder={t("auth.passwordPlaceholder")}
                className="auth-input"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />

              <button className="auth-btn" disabled={loading}>
                {loading ? t("common.loading") : t("auth.registerButton")}
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
};

export default AuthModal;







