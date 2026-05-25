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
    baseURL: `${import.meta.env.VITE_API_URL}/api',
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
      <div className="chart-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('chart.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
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
      <div className="chart-container">
        <div className="empty-state">
          <span className="empty-icon">📊</span>
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
          🔄
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">{t('chart.stats.total')}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⭐</span>
          <div className="stat-info">
            <span className="stat-value">{stats.average}%</span>
            <span className="stat-label">{t('chart.stats.average')}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🏆</span>
          <div className="stat-info">
            <span className="stat-value">{stats.best}%</span>
            <span className="stat-label">{t('chart.stats.best')}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📈</span>
          <div className="stat-info">
            <span className="stat-value">{stats.worst}%</span>
            <span className="stat-label">{t('chart.stats.worst')}</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#666', fontSize: 12 }}
              tickLine={{ stroke: '#ccc' }}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fill: '#666', fontSize: 12 }}
              tickLine={{ stroke: '#ccc' }}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#4CAF50"
              strokeWidth={3}
              dot={{ fill: '#4CAF50', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: '#ff5722' }}
              name={t('chart.legend.score')}
            />
            {data.length >= 4 && (
              <Line
                type="monotone"
                dataKey="movingAvg"
                stroke="#FF9800"
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
                {t('chart.trend.positive', { points: stats.improvement })}
              </span>
            ) : stats.improvement < 0 ? (
              <span className="trend-down">
                {t('chart.trend.negative', { points: stats.improvement })}
              </span>
            ) : (
              <span className="trend-stable">
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
        <h3>{t('chart.recent.title')}</h3>
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




