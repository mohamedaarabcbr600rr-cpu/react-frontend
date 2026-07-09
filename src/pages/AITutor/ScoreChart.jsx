import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";

const ProgressChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    average: 0,
    best: 0,
    worst: 100,
    total: 0,
    improvement: 0
  });
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
    fetchQcmHistory();
  }, []);

  const fetchQcmHistory = async () => {
    try {
      setLoading(true);
      // ✅ Utiliser l'instance axios avec token
      const response = await axiosInstance.get("/qcm-history");

      console.log("📊 Données reçues pour le graphique:", response.data);

      // Adapter selon la structure du backend
      let historyData = response.data;

      // Si le backend retourne un objet avec une propriété 'data'
      if (response.data && response.data.data) {
        historyData = response.data.data;
      }

      // Vérifier que c'est bien un tableau
      if (!Array.isArray(historyData)) {
        console.error("Format de données inattendu:", historyData);
        setData([]);
        calculateStats([]);
        setError(null);
        return;
      }

      // Formater les données pour le graphique
      const formatted = historyData.map(item => ({
        id: item.id,
        date: new Date(item.created_at).toLocaleDateString(t('chart.locale'), {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        score: item.score,
        fullDate: new Date(item.created_at),
        totalQuestions: item.total_questions || 100
      })).sort((a, b) => a.fullDate - b.fullDate);

      setData(formatted);
      calculateStats(formatted);
      setError(null);

    } catch (err) {
      console.error(t('chart.errors.fetchError'), err);

      if (err.response && err.response.status === 401) {
        setError(t('chart.errors.sessionExpired'));
      } else {
        setError(t('chart.errors.loadError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (formattedData) => {
    if (formattedData.length === 0) {
      setStats({
        average: 0,
        best: 0,
        worst: 0,
        total: 0,
        improvement: 0
      });
      return;
    }

    const scores = formattedData.map(item => item.score);
    const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const best = Math.max(...scores);
    const worst = Math.min(...scores);

    // Calculer la progression (premier score vs dernier score)
    let improvement = 0;
    if (formattedData.length >= 2) {
      improvement = formattedData[formattedData.length - 1].score - formattedData[0].score;
    }

    setStats({
      average,
      best,
      worst,
      total: scores.length,
      improvement
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{label}</p>
          <p className="tooltip-score">
            {t('chart.tooltip.score')}: <strong>{payload[0].value}%</strong>
          </p>
          {dataPoint.totalQuestions && (
            <p className="tooltip-details">
              {t('chart.tooltip.questions')}: {Math.round((payload[0].value / 100) * dataPoint.totalQuestions)}/{dataPoint.totalQuestions}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculer la moyenne mobile (optionnel)
  const getMovingAverage = (data, windowSize = 3) => {
    const movingAvg = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = data.slice(start, i + 1);
      const avg = window.reduce((sum, item) => sum + item.score, 0) / window.length;
      movingAvg.push({
        ...data[i],
        movingAvg: Math.round(avg)
      });
    }
    return movingAvg;
  };

  if (loading) {
    return (
      <div className="chart-wrapper">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('chart.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-wrapper">
        <div className="error-state">
          <span className="error-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
          </span>
          <h3>{t('chart.errorTitle')}</h3>
          <p>{error}</p>
          <button onClick={fetchQcmHistory} className="retry-button">
            {t('chart.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="chart-wrapper">
        <div className="chart-header">
          <div>
            <h2>{t('chart.title')}</h2>
            <p className="chart-subtitle">{t('chart.subtitle')}</p>
          </div>
        </div>
        <div className="empty-state">
          <span className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </span>
          <h3>{t('chart.empty.title')}</h3>
          <p>{t('chart.empty.description')}</p>
          <button onClick={fetchQcmHistory} className="retry-button" style={{ marginTop: '15px' }}>
            {t('chart.refresh')}
          </button>
        </div>
      </div>
    );
  }

  const chartData = getMovingAverage(data);

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <div>
          <h2>{t('chart.title')}</h2>
          <p className="chart-subtitle">{t('chart.subtitle')}</p>
        </div>
        <button onClick={fetchQcmHistory} className="refresh-button" title={t('chart.refresh')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </span>
          <div className="stat-card-content">
            <span className="stat-card-label">{t('chart.stats.total')}</span>
            <span className="stat-card-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </span>
          <div className="stat-card-content">
            <span className="stat-card-label">{t('chart.stats.average')}</span>
            <span className="stat-card-value">{stats.average}%</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
          </span>
          <div className="stat-card-content">
            <span className="stat-card-label">{t('chart.stats.best')}</span>
            <span className="stat-card-value">{stats.best}%</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="20" x2="12" y2="10"/>
              <line x1="18" y1="20" x2="18" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="16"/>
            </svg>
          </span>
          <div className="stat-card-content">
            <span className="stat-card-label">{t('chart.stats.worst')}</span>
            <span className="stat-card-value">{stats.worst}%</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--border)' }}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, fill: '#4f46e5', stroke: 'white', strokeWidth: 2 }}
              name={t('chart.legend.score')}
            />
            {data.length >= 4 && (
              <Line
                type="monotone"
                dataKey="movingAvg"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name={t('chart.legend.movingAverage')}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="trend-indicator">
        {data.length >= 2 && (
          <div className="trend-badge">
            {stats.improvement > 0 ? (
              <span className="trend-up">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
                {t('chart.trend.positive', { points: stats.improvement })}
              </span>
            ) : stats.improvement < 0 ? (
              <span className="trend-down">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                  <polyline points="17 18 23 18 23 12"/>
                </svg>
                {t('chart.trend.negative', { points: stats.improvement })}
              </span>
            ) : (
              <span className="trend-stable">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {t('chart.trend.stable')}
              </span>
            )}
          </div>
        )}

        {data.length >= 2 && stats.improvement !== 0 && (
          <div className="trend-advice">
            {stats.improvement > 10 ? (
              <span>{t('chart.advice.excellent')}</span>
            ) : stats.improvement > 0 ? (
              <span>{t('chart.advice.good')}</span>
            ) : (
              <span>{t('chart.advice.improve')}</span>
            )}
          </div>
        )}
      </div>

      {/* Derniers résultats */}
      <div className="recent-results">
        <h3>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: "inline", verticalAlign: "middle", marginRight: 8}}>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M12 7v5l4 2"/>
          </svg>
          {t('chart.recent.title')}
        </h3>
        <div className="recent-list">
          {data.slice(-5).reverse().map((item, index) => (
            <div key={index} className="recent-item">
              <span className="recent-date">{item.date}</span>
              <div className="recent-score-container">
                <div
                  className={`recent-score-bar ${getScoreClass(item.score)}`}
                  style={{ width: `${item.score}%` }}
                ></div>
                <span className="recent-score-value">{item.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Fonction helper pour la couleur des scores
const getScoreClass = (score) => {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "average";
  return "poor";
};

export default ProgressChart;