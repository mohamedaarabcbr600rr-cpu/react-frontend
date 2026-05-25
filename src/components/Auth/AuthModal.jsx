import { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "../../axios";
import "./AuthModal.css";

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

  // REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.get("/sanctum/csrf-cookie");

      await axios.post("/api/register", {
        name,
        email: registerEmail,
        password: registerPassword,
        password_confirmation: registerPassword,
      });

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
          className={`switch-btn ${isLogin ? "login" : "register"}`}
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




