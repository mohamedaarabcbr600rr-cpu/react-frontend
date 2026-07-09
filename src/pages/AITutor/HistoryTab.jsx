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
          <span className="error-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
          </span>
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
            <svg className="title-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M12 7v5l4 2"/>
            </svg>
            {t('history.title')}
          </h2>
          <p className="history-subtitle">
            {t('history.testCount', { count: history.length })}
          </p>
        </div>
        <button onClick={fetchHistory} className="refresh-button" title={t('history.refresh')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && history.length > 0 && (
        <div className="stats-cards">
          <div className="stat-card-mini">
            <span className="stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </span>
            <div>
              <div className="stat-value">{stats.average}%</div>
              <div className="stat-label">{t('history.stats.average')}</div>
            </div>
          </div>
          <div className="stat-card-mini">
            <span className="stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
            </span>
            <div>
              <div className="stat-value">{stats.best}%</div>
              <div className="stat-label">{t('history.stats.best')}</div>
            </div>
          </div>
          <div className="stat-card-mini">
            <span className="stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="20" x2="12" y2="10"/>
                <line x1="18" y1="20" x2="18" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="16"/>
              </svg>
            </span>
            <div>
              <div className="stat-value">{stats.worst}%</div>
              <div className="stat-label">{t('history.stats.worst')}</div>
            </div>
          </div>
          <div className="stat-card-mini">
            <span className="stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </span>
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
          <span className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M12 7v5l4 2"/>
            </svg>
          </span>
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
                  <span className="info-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </span>
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
                  <span className="info-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </span>
                  <span className="info-label">{t('history.card.score')} :</span>
                  <span className="info-value">
                    {item.score} / {item.total_questions || 100}
                  </span>
                </div>

                {item.created_at && (
                  <div className="info-row">
                    <span className="info-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    </span>
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