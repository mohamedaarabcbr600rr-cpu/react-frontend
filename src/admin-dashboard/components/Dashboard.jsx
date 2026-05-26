import { useEffect, useState } from "react";
import "./Dashboard.css";
import api from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Veuillez vous connecter en tant qu'administrateur");
        setLoading(false);
        return;
      }
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const [statsRes, detailedRes, usersRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/detailed-stats"),
        api.get("/admin/active-users-today")
      ]);
      
      setStats(statsRes.data);
      setDetailedStats(detailedRes.data);
      setActiveUsers(usersRes.data);
      setFilteredUsers(usersRes.data);
      
    } catch (error) {
      console.error("Error:", error.response?.data);
      
      if (error.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/admin-login';
        }, 2000);
      } else {
        setError(error.response?.data?.message || "Erreur de chargement des données");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
  };

  useEffect(() => {
    loadData();
    
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        refreshData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = activeUsers;
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCountry !== "all") {
      filtered = filtered.filter(user => user.country === selectedCountry);
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, selectedCountry, activeUsers]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Erreur de chargement</h2>
          <p>{error}</p>
          <button onClick={() => window.location.href = '/admin-login'} className="retry-btn">
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Users",
      value: stats?.total_users || 0,
      icon: "👥",
      color: "blue",
      description: "Utilisateurs inscrits"
    },
    {
      title: "New Today",
      value: stats?.new_users_today || 0,
      icon: "➕",
      color: "green",
      description: "Nouveaux aujourd'hui"
    },
    {
      title: "Daily Active",
      value: stats?.dau || 0,
      icon: "⚡",
      color: "purple",
      description: "Actifs dernières 24h"
    },
    {
      title: "Monthly Active",
      value: stats?.mau || 0,
      icon: "📅",
      color: "orange",
      description: "Actifs ce mois"
    }
  ];

  const countries = [...new Set(activeUsers.map(user => user.country).filter(Boolean))];

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">
              <span className="title-icon">📊</span>
              Administration Dashboard
            </h1>
            <p className="dashboard-subtitle">
              Vue d'ensemble et gestion des utilisateurs
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="refresh-btn"
          >
            <span className={`refresh-icon ${refreshing ? 'spinning' : ''}`}>🔄</span>
            <span>Actualiser</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {statsCards.map((stat, index) => (
            <div key={index} className={`stat-card stat-card-${stat.color}`}>
              <div className="stat-card-header">
                <div className={`stat-icon stat-icon-${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              <div className="stat-card-body">
                <p className="stat-title">{stat.title}</p>
                <p className="stat-value">{stat.value.toLocaleString()}</p>
                <p className="stat-description">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Section */}
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-header">
              <span className="analytics-icon">📈</span>
              <h3>Taux d'engagement</h3>
            </div>
            <div className="analytics-body">
              <div className="ratio-container">
                <div className="ratio-label">
                  <span>Ratio DAU/MAU</span>
                  <span className="ratio-value">
                    {stats?.dau && stats?.mau ? ((stats.dau / stats.mau) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${stats?.dau && stats?.mau ? (stats.dau / stats.mau) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="stats-compare">
                <div className="compare-item">
                  <span className="compare-label">📊 Actifs (24h)</span>
                  <span className="compare-value">{stats?.dau || 0}</span>
                </div>
                <div className="compare-item">
                  <span className="compare-label">📈 Actifs (30j)</span>
                  <span className="compare-value">{stats?.mau || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {detailedStats && (
            <div className="analytics-card">
              <div className="analytics-header">
                <span className="analytics-icon">🟢</span>
                <h3>Activité en temps réel</h3>
              </div>
              <div className="analytics-body">
                <div className="realtime-stats">
                  <div className="realtime-item">
                    <span className="realtime-label">En ligne maintenant</span>
                    <span className="realtime-value online">{detailedStats.online_now || 0}</span>
                  </div>
                  <div className="realtime-item">
                    <span className="realtime-label">Actifs aujourd'hui</span>
                    <span className="realtime-value">{detailedStats.active_today || 0}</span>
                  </div>
                  <div className="realtime-item">
                    <span className="realtime-label">Nouveaux cette semaine</span>
                    <span className="realtime-value">{detailedStats.new_users_this_week || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Users Section */}
        <div className="users-section">
          <div className="users-section-header">
            <div className="section-title">
              <span className="section-icon">🕐</span>
              <div>
                <h2>Utilisateurs Actifs Aujourd'hui</h2>
                <p>{activeUsers.length} utilisateur{activeUsers.length > 1 ? 's' : ''} actif{activeUsers.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            
            <div className="filters">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              {countries.length > 0 && (
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="country-filter"
                >
                  <option value="all">🌍 Tous les pays</option>
                  {countries.map(country => (
                    <option key={country} value={country}>
                      📍 {country}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="users-table-container">
            {filteredUsers.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Contact</th>
                    <th>Localisation</th>
                    <th>Dernière activité</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="user-cell">
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.avatar ? (
                              <img src={`/storage/${user.avatar}`} alt={user.name} />
                            ) : (
                              <div className="avatar-placeholder">
                                {user.initials || user.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div className="user-details">
                            <div className="user-name">{user.name || user.username || "Non renseigné"}</div>
                            {user.bio && <div className="user-bio">{user.bio}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="contact-cell">
                        <div className="contact-info">
                          <div className="user-email">{user.email}</div>
                          <div className="user-username">@{user.username}</div>
                        </div>
                      </td>
                      <td className="location-cell">
                        {user.country ? (
                          <div className="country-info">
                            <span>📍</span> {user.country}
                          </div>
                        ) : (
                          <span className="no-data">Non renseigné</span>
                        )}
                      </td>
                      <td className="activity-cell">
                        <div className="activity-info">
                          <div className="activity-time">
                            {user.last_activity ? new Date(user.last_activity).toLocaleTimeString() : 'N/A'}
                          </div>
                          <div className="activity-date">
                            {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'Jamais'}
                          </div>
                        </div>
                      </td>
                      <td className="status-cell">
                        {user.is_online ? (
                          <span className="status-badge status-online">
                            <span className="status-dot online"></span>
                            En ligne
                          </span>
                        ) : (
                          <span className="status-badge status-offline">
                            <span className="status-dot offline"></span>
                            Hors ligne
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <p>Aucun utilisateur actif aujourd'hui</p>
                <p className="empty-subtitle">
                  {searchTerm || selectedCountry !== "all" 
                    ? "Aucun résultat pour ces filtres" 
                    : "Les utilisateurs apparaîtront ici quand ils se connecteront"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}







