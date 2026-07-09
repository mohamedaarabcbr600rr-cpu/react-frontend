import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

const AICoach = () => {
  const [coach, setCoach] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adviceHistory, setAdviceHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [adviceType, setAdviceType] = useState("general");
  const { t } = useTranslation();

  // 🔐 Récupérer le token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // 📡 Configuration axios avec token
  const axiosInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
  });

  // Interceptor pour ajouter le token
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  useEffect(() => {
    fetchUserStats();
    loadAdviceHistory();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await axiosInstance.get("/student-dashboard");

      console.log("📊 User stats received:", response.data);

      if (response.data && response.data.profile) {
        setUserStats(response.data.profile);
      } else {
        // Données par défaut si pas de profil
        setUserStats({
          score_moyen: 0,
          total_qcm: 0,
          niveau: "debutant",
          points_faibles: "[]"
        });
      }
    } catch (err) {
      console.error(t('coach.errors.fetchStats'), err);
      // Données par défaut en cas d'erreur
      setUserStats({
        score_moyen: 0,
        total_qcm: 0,
        niveau: "debutant",
        points_faibles: "[]"
      });
    }
  };

  const loadAdviceHistory = () => {
    const savedHistory = localStorage.getItem("adviceHistory");
    if (savedHistory) {
      try {
        setAdviceHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error(t('coach.errors.parseHistory'), e);
        setAdviceHistory([]);
      }
    }
  };

  const saveAdviceToHistory = (adviceText, type) => {
    const newAdvice = {
      id: Date.now(),
      text: adviceText,
      type: type,
      date: new Date(),
      timestamp: new Date().toISOString()
    };
    const updatedHistory = [newAdvice, ...adviceHistory].slice(0, 15);
    setAdviceHistory(updatedHistory);
    localStorage.setItem("adviceHistory", JSON.stringify(updatedHistory));
  };

  const getCoach = async () => {
    setLoading(true);
    setError("");

    try {
      const token = getAuthToken();

      if (!token) {
        setError(t('coach.errors.loginRequired'));
        setLoading(false);
        return;
      }

      // ✅ Appel à l'API ai-coach avec le type en paramètre
      const res = await axiosInstance.get("/ai-coach", {
        params: {
          type: adviceType
        }
      });

      console.log("🤖 AI Coach response:", res.data);

      let adviceText = "";

      // Adapter selon la structure du backend
      if (res.data.coach) {
        adviceText = res.data.coach;
      } else if (res.data.reply) {
        adviceText = res.data.reply;
      } else if (typeof res.data === 'string') {
        adviceText = res.data;
      } else {
        adviceText = t('coach.defaultAdvice');
      }

      setCoach(adviceText);
      saveAdviceToHistory(adviceText, adviceType);

    } catch (err) {
      console.error(t('coach.errors.fetchCoach'), err);

      if (err.response) {
        switch (err.response.status) {
          case 401:
            setError(t('coach.errors.sessionExpired'));
            break;
          case 429:
            setError(t('coach.errors.tooManyRequests'));
            break;
          case 500:
            setError(t('coach.errors.serviceUnavailable'));
            break;
          default:
            setError(err.response.data?.coach || err.response.data?.message || t('coach.errors.generic'));
        }
      } else if (err.request) {
        setError(t('coach.errors.connectionError'));
      } else {
        setError(t('coach.errors.unexpected'));
      }

      // Message d'erreur plus convivial
      setCoach(t('coach.fallbackAdvice'));

    } finally {
      setLoading(false);
    }
  };

  const getRandomMotivation = () => {
    const motivations = t('coach.motivations', { returnObjects: true });
    return motivations[Math.floor(Math.random() * motivations.length)];
  };

  const getAdviceTypeLabel = (type) => {
    const labels = {
      general: t('coach.types.general'),
      motivation: t('coach.types.motivation'),
      strategy: t('coach.types.strategy'),
      weakpoints: t('coach.types.weakpoints'),
      progress: t('coach.types.progress')
    };
    return labels[type] || type;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(t('coach.locale'), {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearHistory = () => {
    if (window.confirm(t('coach.confirmClear'))) {
      setAdviceHistory([]);
      localStorage.removeItem("adviceHistory");
    }
  };

  // Parse des points faibles
  const getWeakPointsList = () => {
    if (!userStats || !userStats.points_faibles) return [];
    try {
      if (typeof userStats.points_faibles === 'string') {
        return JSON.parse(userStats.points_faibles);
      }
      if (Array.isArray(userStats.points_faibles)) {
        return userStats.points_faibles;
      }
    } catch (e) {
      console.error(t('coach.errors.parseWeakPoints'), e);
    }
    return [];
  };

  const weakPoints = getWeakPointsList();

  return (
    <div className="ai-coach-container">
      <div className="ai-coach-header">
        <div className="header-content">
          <h2 className="coach-title">
            <svg className="title-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
            </svg>
            {t('coach.title')}
          </h2>
          <p className="coach-subtitle">
            {t('coach.subtitle')}
          </p>
        </div>
        <div className="coach-status">
          <span className="status-badge online">
            <span className="status-dot"></span>
            {t('coach.status')}
          </span>
        </div>
      </div>

      <div className="ai-coach-content">
        {/* User Stats Card */}
        {userStats && (
          <div className="stats-card">
            <div className="stats-header">
              <span className="stats-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </span>
              <h3>{t('coach.profile.title')}</h3>
            </div>
            <div className="stats-grid-mini">
              <div className="stat-mini">
                <span className="stat-mini-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="6"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                </span>
                <div>
                  <div className="stat-mini-value">{Math.round(userStats.score_moyen || 0)}%</div>
                  <div className="stat-mini-label">{t('coach.profile.averageScore')}</div>
                </div>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                  </svg>
                </span>
                <div>
                  <div className="stat-mini-value">{userStats.total_qcm || 0}</div>
                  <div className="stat-mini-label">{t('coach.profile.completedQCM')}</div>
                </div>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="m2 17 10 5 10-5"/>
                    <path d="m2 12 10 5 10-5"/>
                  </svg>
                </span>
                <div>
                  <div className="stat-mini-value">
                    {userStats.niveau === "debutant" && t('coach.profile.levels.beginner')}
                    {userStats.niveau === "intermediaire" && t('coach.profile.levels.intermediate')}
                    {userStats.niveau === "avance" && t('coach.profile.levels.advanced')}
                    {!userStats.niveau && t('coach.profile.levels.beginner')}
                  </div>
                  <div className="stat-mini-label">{t('coach.profile.level')}</div>
                </div>
              </div>
            </div>

            {/* Afficher les points faibles s'il y en a */}
            {weakPoints.length > 0 && (
              <div className="weak-points-preview">
                <div className="weak-points-label">
                  <span>{t('coach.profile.weakPoints')} :</span>
                </div>
                <div className="weak-points-tags">
                  {weakPoints.slice(0, 3).map((point, index) => (
                    <span key={index} className="weak-point-tag">
                      {point}
                    </span>
                  ))}
                  {weakPoints.length > 3 && (
                    <span className="weak-point-tag more">+{weakPoints.length - 3}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Advice Type Selector */}
        <div className="advice-type-section">
          <label className="type-label">{t('coach.adviceType')} :</label>
          <div className="type-buttons">
            <button
              className={`type-btn ${adviceType === "general" ? "active" : ""}`}
              onClick={() => setAdviceType("general")}
            >
              {t('coach.types.general')}
            </button>
            <button
              className={`type-btn ${adviceType === "motivation" ? "active" : ""}`}
              onClick={() => setAdviceType("motivation")}
            >
              {t('coach.types.motivation')}
            </button>
            <button
              className={`type-btn ${adviceType === "strategy" ? "active" : ""}`}
              onClick={() => setAdviceType("strategy")}
            >
              {t('coach.types.strategy')}
            </button>
            <button
              className={`type-btn ${adviceType === "weakpoints" ? "active" : ""}`}
              onClick={() => setAdviceType("weakpoints")}
              disabled={weakPoints.length === 0}
              title={weakPoints.length === 0 ? t('coach.noWeakPoints') : ""}
            >
              {t('coach.types.weakpoints')}
            </button>
            <button
              className={`type-btn ${adviceType === "progress" ? "active" : ""}`}
              onClick={() => setAdviceType("progress")}
            >
              {t('coach.types.progress')}
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <div className="generate-section">
          <button
            onClick={getCoach}
            className={`generate-btn ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                {t('coach.analyzing')}
              </>
            ) : (
              <>
                <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
                  <path d="M5 3v4"/>
                  <path d="M19 17v4"/>
                  <path d="M3 5h4"/>
                  <path d="M17 19h4"/>
                </svg>
                {t('coach.generateAdvice')}
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
            </span>
            <span>{error}</span>
            <button onClick={() => setError("")} className="error-close">
              ✕
            </button>
          </div>
        )}

        {/* Loading Animation */}
        {loading && (
          <div className="loading-thinking">
            <div className="thinking-animation">
              <div className="thinking-dot"></div>
              <div className="thinking-dot"></div>
              <div className="thinking-dot"></div>
            </div>
            <p>{t('coach.thinking')}</p>
            <p className="thinking-hint">{t('coach.analyzing')}</p>
          </div>
        )}

        {/* Coach Advice Display */}
        {coach && !loading && (
          <div className="advice-card">
            <div className="advice-header">
              <div className="advice-type-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6"/>
                  <path d="M10 22h4"/>
                  <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1.2 1.9l.3 1.4h5l.3-1.4c.2-.7.6-1.4 1.2-1.9A7 7 0 0 0 12 2Z"/>
                </svg>
                <span>{t('coach.advice')} {getAdviceTypeLabel(adviceType)}</span>
              </div>
              <button
                onClick={() => setCoach("")}
                className="close-advice"
                title={t('coach.close')}
              >
                ✕
              </button>
            </div>
            <div className="advice-content">
              <div className="advice-quote-icon">"</div>
              <p className="advice-text">{coach}</p>
              <div className="advice-quote-icon close">"</div>
            </div>
            <div className="advice-footer">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(coach);
                  const btn = event.target;
                  const originalText = btn.textContent;
                  btn.textContent = t('coach.copied');
                  setTimeout(() => {
                    btn.textContent = originalText;
                  }, 2000);
                }}
                className="advice-action"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
                {t('coach.copy')}
              </button>
              <button
                onClick={getCoach}
                className="advice-action"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
                {t('coach.newAdvice')}
              </button>
            </div>
          </div>
        )}

        {/* Motivation Card */}
        {!coach && !loading && (
          <div className="motivation-card">
            <div className="motivation-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
              </svg>
            </div>
            <p className="motivation-text">{getRandomMotivation()}</p>
            <button onClick={getCoach} className="motivation-btn">
              {t('coach.getPersonalizedAdvice')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>
        )}

        {/* History Section */}
        {adviceHistory.length > 0 && (
          <div className="history-section">
            <div
              className="history-header"
              onClick={() => setShowHistory(!showHistory)}
              style={{ cursor: "pointer" }}
            >
              <div className="history-header-left">
                <span className="history-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                    <path d="M12 7v5l4 2"/>
                  </svg>
                </span>
                <h3>{t('coach.history.title')}</h3>
                <span className="history-count">({adviceHistory.length})</span>
              </div>
              <div className="history-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearHistory();
                  }}
                  className="clear-history-btn"
                  title={t('coach.history.clear')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
                <button className="toggle-btn" onClick={(e) => e.stopPropagation()}>
                  {showHistory ? "▲" : "▼"}
                </button>
              </div>
            </div>

            {showHistory && (
              <div className="history-list">
                {adviceHistory.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-header">
                      <div className="history-item-info">
                        <span className="history-item-type">
                          {getAdviceTypeLabel(item.type)}
                        </span>
                        <span className="history-item-date">
                          {formatDate(item.date)}
                        </span>
                      </div>
                      <button
                        onClick={() => setCoach(item.text)}
                        className="history-load-btn"
                      >
                        {t('coach.history.view')}
                      </button>
                    </div>
                    <div className="history-item-preview">
                      {item.text.substring(0, 100)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tips Section */}
        <div className="tips-section">
          <h3>
            <svg className="tips-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6"/>
              <path d="M10 22h4"/>
              <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1.2 1.9l.3 1.4h5l.3-1.4c.2-.7.6-1.4 1.2-1.9A7 7 0 0 0 12 2Z"/>
            </svg>
            {t('coach.tips.title')}
          </h3>
          <div className="tips-grid">
            <div className="tip-card">
              <span className="tip-number">1</span>
              <h4>{t('coach.tips.regularPractice.title')}</h4>
              <p>{t('coach.tips.regularPractice.description')}</p>
            </div>
            <div className="tip-card">
              <span className="tip-number">2</span>
              <h4>{t('coach.tips.reviewMistakes.title')}</h4>
              <p>{t('coach.tips.reviewMistakes.description')}</p>
            </div>
            <div className="tip-card">
              <span className="tip-number">3</span>
              <h4>{t('coach.tips.setGoals.title')}</h4>
              <p>{t('coach.tips.setGoals.description')}</p>
            </div>
            <div className="tip-card">
              <span className="tip-number">4</span>
              <h4>{t('coach.tips.varyMethods.title')}</h4>
              <p>{t('coach.tips.varyMethods.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICoach;