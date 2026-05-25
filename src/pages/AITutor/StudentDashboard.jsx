import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWeakPoints, setShowWeakPoints] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const { t } = useTranslation();

  // 🔐 Récupérer le token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // 📡 Configuration axios avec token
  const axiosInstance = axios.create({
    baseURL: 'http://import.meta.env.VITE_API_URL/api',
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
    fetchDashboardData();
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/user");
      setUserInfo(response.data);
    } catch (err) {
      console.error(t('dashboard.errors.fetchUserInfo'), err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // ✅ Utiliser l'instance axios avec token
      const response = await axiosInstance.get("/student-dashboard");
      
      console.log("📊 Dashboard data received:", response.data);
      
      // Adapter selon la structure du backend
      let profileData = response.data.profile;
      
      if (profileData) {
        setData(profileData);
      } else {
        setError(t('dashboard.errors.profileNotFound'));
      }
      
      setError(null);
    } catch (err) {
      console.error(t('dashboard.errors.fetchDashboard'), err);
      
      if (err.response && err.response.status === 401) {
        setError(t('dashboard.errors.sessionExpired'));
      } else {
        setError(t('dashboard.errors.loadError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "average";
    return "poor";
  };

  const getLevelInfo = (niveau) => {
    const levels = {
      "debutant": { icon: "🌱", color: "#4caf50", description: t('dashboard.levels.beginner'), bgColor: "#e8f5e9" },
      "intermediaire": { icon: "📚", color: "#ff9800", description: t('dashboard.levels.intermediate'), bgColor: "#fff3e0" },
      "avance": { icon: "🚀", color: "#f44336", description: t('dashboard.levels.advanced'), bgColor: "#ffebee" }
    };
    return levels[niveau?.toLowerCase()] || { icon: "📖", color: "#2196f3", description: t('dashboard.levels.default'), bgColor: "#e3f2fd" };
  };

  const getRecommendations = (weakPoints, niveau, scoreMoyen) => {
    const recommendations = [];
    
    // Recommandations basées sur les points faibles
    if (weakPoints && weakPoints.length > 0) {
      weakPoints.forEach(weakPoint => {
        if (weakPoint.includes("Conjugaison") || weakPoint.toLowerCase().includes("conjug")) {
          recommendations.push(t('dashboard.recommendations.conjugation'));
        } else if (weakPoint.includes("Grammaire") || weakPoint.toLowerCase().includes("gramm")) {
          recommendations.push(t('dashboard.recommendations.grammar'));
        } else if (weakPoint.includes("Vocabulaire") || weakPoint.toLowerCase().includes("vocab")) {
          recommendations.push(t('dashboard.recommendations.vocabulary'));
        } else if (weakPoint.includes("Orthographe") || weakPoint.toLowerCase().includes("orth")) {
          recommendations.push(t('dashboard.recommendations.spelling'));
        } else {
          recommendations.push(t('dashboard.recommendations.specific', { topic: weakPoint }));
        }
      });
    }
    
    // Recommandations basées sur le niveau
    if (niveau === "debutant") {
      recommendations.push(t('dashboard.recommendations.beginner1'));
      recommendations.push(t('dashboard.recommendations.beginner2'));
    } else if (niveau === "intermediaire") {
      recommendations.push(t('dashboard.recommendations.intermediate1'));
      recommendations.push(t('dashboard.recommendations.intermediate2'));
    } else if (niveau === "avance") {
      recommendations.push(t('dashboard.recommendations.advanced1'));
      recommendations.push(t('dashboard.recommendations.advanced2'));
    }
    
    // Recommandations basées sur le score
    if (scoreMoyen < 50) {
      recommendations.push(t('dashboard.recommendations.lowScore'));
    } else if (scoreMoyen > 85) {
      recommendations.push(t('dashboard.recommendations.highScore'));
    }
    
    // Supprimer les doublons
    const uniqueRecs = [...new Map(recommendations.map(rec => [rec, rec])).values()];
    
    return uniqueRecs.slice(0, 5);
  };

  // Calculer la progression fictive (basée sur les données disponibles)
  const calculateProgress = () => {
    if (!data) return 0;
    const totalQcm = data.total_qcm || 0;
    const scoreMoyen = data.score_moyen || 0;
    // Progression estimée: si score moyen > 60 et total > 5 => bonne progression
    if (totalQcm >= 5 && scoreMoyen >= 70) return 85;
    if (totalQcm >= 3 && scoreMoyen >= 50) return 60;
    if (totalQcm >= 1) return 35;
    return 10;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-screen">
          <span className="error-icon">⚠️</span>
          <h3>{t('dashboard.errorTitle')}</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-btn">
            {t('dashboard.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-container">
        <div className="empty-screen">
          <span className="empty-icon">📭</span>
          <h3>{t('dashboard.empty.title')}</h3>
          <p>{t('dashboard.empty.description')}</p>
        </div>
      </div>
    );
  }

  // Parse des points faibles (peut être string ou tableau)
  let weakPointsArray = [];
  try {
    if (typeof data.points_faibles === 'string') {
      weakPointsArray = JSON.parse(data.points_faibles || "[]");
    } else if (Array.isArray(data.points_faibles)) {
      weakPointsArray = data.points_faibles;
    }
  } catch (e) {
    console.error("Error parsing weak points:", e);
    weakPointsArray = [];
  }

  const scoreMoyen = Math.round(data.score_moyen || 0);
  const scoreColor = getScoreColor(scoreMoyen);
  const levelInfo = getLevelInfo(data.niveau);
  const recommendations = getRecommendations(weakPointsArray, data.niveau, scoreMoyen);
  const progress = calculateProgress();

  return (
    <div className="dashboard-container">
      {/* Header avec bienvenue */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            <span className="title-icon">📊</span>
            {t('dashboard.title')}
          </h1>
          <p className="dashboard-subtitle">
            {userInfo ? t('dashboard.greeting', { name: userInfo.name || t('dashboard.student') }) + ' ! ' : ''}
            {t('dashboard.subtitle')}
          </p>
        </div>
        <button onClick={fetchDashboardData} className="refresh-btn" title={t('dashboard.refresh')}>
          🔄
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card level-card" style={{ background: levelInfo.bgColor }}>
          <div className="stat-card-inner">
            <span className="stat-card-icon">{levelInfo.icon}</span>
            <div className="stat-card-content">
              <span className="stat-card-label">{t('dashboard.stats.level')}</span>
              <span className="stat-card-value" style={{ color: levelInfo.color }}>
                {data.niveau || t('dashboard.stats.undefined')}
              </span>
              {levelInfo.description && (
                <span className="stat-card-hint">{levelInfo.description}</span>
              )}
            </div>
          </div>
        </div>

        <div className={`stat-card score-card ${scoreColor}`}>
          <div className="stat-card-inner">
            <span className="stat-card-icon">🎯</span>
            <div className="stat-card-content">
              <span className="stat-card-label">{t('dashboard.stats.averageScore')}</span>
              <div className="score-container">
                <span className="stat-card-value">{scoreMoyen}%</span>
                <div className="score-bar">
                  <div 
                    className="score-bar-fill" 
                    style={{ width: `${scoreMoyen}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card total-card">
          <div className="stat-card-inner">
            <span className="stat-card-icon">📚</span>
            <div className="stat-card-content">
              <span className="stat-card-label">{t('dashboard.stats.completedQCM')}</span>
              <span className="stat-card-value">{data.total_qcm || 0}</span>
              <span className="stat-card-hint">{t('dashboard.stats.testsDone')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Ring */}
      <div className="performance-section">
        <div className="performance-ring-container">
          <div className="performance-ring">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle
                cx="90"
                cy="90"
                r="75"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="12"
              />
              <circle
                cx="90"
                cy="90"
                r="75"
                fill="none"
                stroke={scoreColor === "excellent" ? "#4caf50" : scoreColor === "good" ? "#8bc34a" : scoreColor === "average" ? "#ff9800" : "#f44336"}
                strokeWidth="12"
                strokeDasharray={`${(scoreMoyen / 100) * 471} 471`}
                strokeLinecap="round"
                transform="rotate(-90 90 90)"
                className="performance-ring-fill"
              />
              <text x="90" y="85" textAnchor="middle" className="ring-percentage">
                {scoreMoyen}%
              </text>
              <text x="90" y="105" textAnchor="middle" className="ring-label">
                {t('dashboard.performance.title')}
              </text>
            </svg>
          </div>
          <div className="performance-stats">
            <div className="performance-stat">
              <span className="dot" style={{ background: "#4caf50" }}></span>
              <span>{t('dashboard.performance.excellent')}</span>
            </div>
            <div className="performance-stat">
              <span className="dot" style={{ background: "#8bc34a" }}></span>
              <span>{t('dashboard.performance.good')}</span>
            </div>
            <div className="performance-stat">
              <span className="dot" style={{ background: "#ff9800" }}></span>
              <span>{t('dashboard.performance.average')}</span>
            </div>
            <div className="performance-stat">
              <span className="dot" style={{ background: "#f44336" }}></span>
              <span>{t('dashboard.performance.poor')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar Section */}
      <div className="section">
        <div className="section-header">
          <div className="section-header-left">
            <span className="section-icon">📈</span>
            <h3>{t('dashboard.progress.title')}</h3>
          </div>
          <span className="progress-value">{progress}%</span>
        </div>
        <div className="global-progress-bar">
          <div 
            className="global-progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="progress-hint">
          {progress < 30 && t('dashboard.progress.low')}
          {progress >= 30 && progress < 60 && t('dashboard.progress.medium')}
          {progress >= 60 && t('dashboard.progress.high')}
        </p>
      </div>

      {/* Weak Points Section */}
      <div className="section">
        <div className="section-header" onClick={() => setShowWeakPoints(!showWeakPoints)} style={{ cursor: "pointer" }}>
          <div className="section-header-left">
            <span className="section-icon">❌</span>
            <h3>{t('dashboard.weakPoints.title')}</h3>
          </div>
          <button className="toggle-btn">{showWeakPoints ? "▼" : "▶"}</button>
        </div>
        
        {showWeakPoints && (
          <div className="weak-points-grid">
            {weakPointsArray.length > 0 ? (
              weakPointsArray.map((weakPoint, index) => (
                <div key={index} className="weak-point-card">
                  <div className="weak-point-icon">
                    {weakPoint.includes("Conjugaison") && "📝"}
                    {weakPoint.includes("Grammaire") && "📖"}
                    {weakPoint.includes("Vocabulaire") && "📚"}
                    {weakPoint.includes("Orthographe") && "✍️"}
                    {!weakPoint.includes("Conjugaison") && 
                     !weakPoint.includes("Grammaire") && 
                     !weakPoint.includes("Vocabulaire") && 
                     !weakPoint.includes("Orthographe") && "⚠️"}
                  </div>
                  <div className="weak-point-content">
                    <h4>{weakPoint}</h4>
                    <p>{t('dashboard.weakPoints.needsAttention')}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-small">
                <span>🎉</span>
                <p>{t('dashboard.weakPoints.empty')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      <div className="section">
        <div className="section-header" onClick={() => setShowRecommendations(!showRecommendations)} style={{ cursor: "pointer" }}>
          <div className="section-header-left">
            <span className="section-icon">💡</span>
            <h3>{t('dashboard.recommendations.title')}</h3>
          </div>
          <button className="toggle-btn">{showRecommendations ? "▼" : "▶"}</button>
        </div>
        
        {showRecommendations && (
          <div className="recommendations-list">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="recommendation-item">
                <span className="recommendation-bullet">{recommendation.charAt(0)}</span>
                <p>{recommendation}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Motivation Quote */}
      <div className="motivation-card">
        <div className="motivation-content">
          <span className="motivation-icon">🌟</span>
          <p className="motivation-text">
            {scoreMoyen >= 80 && t('dashboard.motivation.excellent')}
            {scoreMoyen >= 60 && scoreMoyen < 80 && t('dashboard.motivation.good')}
            {scoreMoyen >= 40 && scoreMoyen < 60 && t('dashboard.motivation.average')}
            {scoreMoyen < 40 && t('dashboard.motivation.poor')}
            {data.total_qcm === 0 && t('dashboard.motivation.firstQCM')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;


