import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

const HistoryTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const { t } = useTranslation();

  // 🔐 Récupérer le token depuis localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // 📡 Configuration axios avec token
  const axiosInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
  });

  // Interceptor pour ajouter le token à chaque requête
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // ✅ Utiliser l'instance axios avec token
      const response = await axiosInstance.get("/qcm-history");
      
      console.log("📊 Historique reçu:", response.data);
      
      // 🔄 Adapter la structure des données du backend
      let historyData = response.data;
      
      // Si le backend retourne un objet avec une propriété 'data'
      if (response.data && response.data.data) {
        historyData = response.data.data;
      }
      
      // Si c'est un tableau directement
      if (Array.isArray(historyData)) {
        setHistory(historyData);
      } else {
        setHistory([]);
      }
      
      setError("");
    } catch (err) {
      console.error("❌ Error:", err);
      
      // Gestion des erreurs d'authentification
      if (err.response && err.response.status === 401) {
        setError(t('history.errors.sessionExpired'));
      } else {
        setError(t('history.errors.loadError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "score-excellent";
    if (score >= 60) return "score-good";
    if (score >= 40) return "score-average";
    return "score-poor";
  };

  const getScoreEmoji = (score) => {
    if (score >= 80) return "🏆";
    if (score >= 60) return "👍";
    if (score >= 40) return "📝";
    return "💪";
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return t('history.scoreMessages.excellent');
    if (score >= 60) return t('history.scoreMessages.good');
    if (score >= 40) return t('history.scoreMessages.average');
    return t('history.scoreMessages.poor');
  };

  const getFilteredAndSortedHistory = () => {
    let filtered = [...history];

    // Appliquer les filtres
    if (filter === "excellent") {
      filtered = filtered.filter(h => h.score >= 80);
    } else if (filter === "good") {
      filtered = filtered.filter(h => h.score >= 60 && h.score < 80);
    } else if (filter === "average") {
      filtered = filtered.filter(h => h.score >= 40 && h.score < 60);
    } else if (filter === "poor") {
      filtered = filtered.filter(h => h.score < 40);
    }

    // Appliquer le tri
    if (sortBy === "date-asc") {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === "date-desc") {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "score-asc") {
      filtered.sort((a, b) => a.score - b.score);
    } else if (sortBy === "score-desc") {
      filtered.sort((a, b) => b.score - a.score);
    }

    return filtered;
  };

  const calculateStatistics = () => {
    if (history.length === 0) return null;

    const scores = history.map(h => h.score);
    const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const best = Math.max(...scores);
    const worst = Math.min(...scores);
    const total = history.length;

    return { average, best, worst, total };
  };

  const stats = calculateStatistics();
  const filteredHistory = getFilteredAndSortedHistory();

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('history.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <h3>{t('history.errorTitle')}</h3>
          <p>{error}</p>
          <button onClick={fetchHistory} className="retry-button">
            {t('history.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      {/* Header */}
      <div className="history-header">
        <div>
          <h2 className="history-title">
            <span className="title-icon">📚</span>
            {t('history.title')}
          </h2>
          <p className="history-subtitle">
            {t('history.testCount', { count: history.length })}
          </p>
        </div>
        <button onClick={fetchHistory} className="refresh-button" title={t('history.refresh')}>
          🔄
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && history.length > 0 && (
        <div className="stats-cards">
          <div className="stat-card-mini">
            <span className="stat-icon">📊</span>
            <div>
              <div className="stat-value">{stats.average}%</div>
              <div className="stat-label">{t('history.stats.average')}</div>
            </div>
          </div>
          <div className="stat-card-mini">
            <span className="stat-icon">🏆</span>
            <div>
              <div className="stat-value">{stats.best}%</div>
              <div className="stat-label">{t('history.stats.best')}</div>
            </div>
          </div>
          <div className="stat-card-mini">
            <span className="stat-icon">📉</span>
            <div>
              <div className="stat-value">{stats.worst}%</div>
              <div className="stat-label">{t('history.stats.worst')}</div>
            </div>
          </div>
          <div className="stat-card-mini">
            <span className="stat-icon">✅</span>
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">{t('history.stats.total')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      {history.length > 0 && (
        <div className="controls-bar">
          <div className="filter-group">
            <label className="control-label">{t('history.filters.filterByScore')} :</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="control-select"
            >
              <option value="all">{t('history.filters.all')}</option>
              <option value="excellent">{t('history.filters.excellent')}</option>
              <option value="good">{t('history.filters.good')}</option>
              <option value="average">{t('history.filters.average')}</option>
              <option value="poor">{t('history.filters.poor')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="control-label">{t('history.filters.sortBy')} :</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="control-select"
            >
              <option value="date-desc">{t('history.sort.dateDesc')}</option>
              <option value="date-asc">{t('history.sort.dateAsc')}</option>
              <option value="score-desc">{t('history.sort.scoreDesc')}</option>
              <option value="score-asc">{t('history.sort.scoreAsc')}</option>
            </select>
          </div>
        </div>
      )}

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">😢</span>
          <h3>{t('history.empty.title')}</h3>
          <p>
            {history.length === 0 
              ? t('history.empty.noTests')
              : t('history.empty.noFilterMatch')}
          </p>
          {history.length > 0 && (
            <button onClick={() => setFilter("all")} className="clear-filters">
              {t('history.clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="history-list">
          {filteredHistory.map((item, index) => (
            <div key={item.id || index} className="history-card">
              <div className="history-card-header">
                <div className="score-badge">
                  <span className="score-emoji">{getScoreEmoji(item.score)}</span>
                  <span className={`score-value ${getScoreColor(item.score)}`}>
                    {item.score}%
                  </span>
                </div>
                <div className="score-message">{getScoreMessage(item.score)}</div>
              </div>
              
              <div className="history-card-body">
                <div className="info-row">
                  <span className="info-icon">📅</span>
                  <span className="info-label">{t('history.card.date')} :</span>
                  <span className="info-value">
                    {new Date(item.created_at).toLocaleDateString(t('history.locale'), {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="info-row">
                  <span className="info-icon">📝</span>
                  <span className="info-label">{t('history.card.score')} :</span>
                  <span className="info-value">
                    {item.score} / {item.total_questions || 100}
                  </span>
                </div>
                
                {item.created_at && (
                  <div className="info-row">
                    <span className="info-icon">🆔</span>
                    <span className="info-label">{t('history.card.id')} :</span>
                    <span className="info-value">#{item.id}</span>
                  </div>
                )}
              </div>
              
              <div className="history-card-footer">
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${getScoreColor(item.score)}`}
                    style={{ width: `${item.score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;






