// Notifications.jsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';

const Notifications = ({ user, onNavigateToExperience }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userToken = localStorage.getItem('token');

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('import.meta.env.VITE_API_URL/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorType(null);
      
      const res = await axios.get('import.meta.env.VITE_API_URL/api/notifications', {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      let notificationsData = res.data.notifications.data || [];
      
      // Parse data si nécessaire
      notificationsData = notificationsData.map(notif => ({
        ...notif,
        data: typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data
      }));

      // Debug - Affiche les données dans la console
      console.log('🔔 Notifications reçues:', notificationsData);

      setNotifications(notificationsData);
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error('Erreur fetching notifications:', err);
      
      if (err.response && err.response.status === 401) {
        setErrorType('session_expired');
        setError(t('notifications.errors.sessionExpired'));
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else if (err.response && err.response.status === 403) {
        setErrorType('forbidden');
        setError(t('notifications.errors.forbidden'));
      } else if (err.response && err.response.status === 500) {
        setErrorType('server_error');
        setError(t('notifications.errors.serverError'));
      } else {
        setErrorType('load_error');
        setError(t('notifications.errors.loadError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`import.meta.env.VITE_API_URL/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      // Mettre à jour localement
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('import.meta.env.VITE_API_URL/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Erreur mark all as read:', err);
    }
  };

  // ✅ Navigation corrigée avec changement d'onglet
  const handleNotificationClick = (notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    const { data } = notification;
    const postId = data.experience_id || data.post_id;
    const profileId = data.profile_id || data.actor_id;
    
    // Debug
    console.log('🖱️ Notification cliquée:', { type: data.type, postId, profileId, data });
    
    switch (data.type) {
      case 'like':
      case 'comment':
        if (postId && onNavigateToExperience) {
          // ✅ Change l'onglet vers accueil et scroll vers l'expérience
          onNavigateToExperience(postId);
        } else {
          console.warn('⚠️ Pas de post_id ou callback manquant');
        }
        break;
        
      case 'follow':
        if (profileId) {
          // ✅ Redirection vers le profil
          navigate(`/profile/${profileId}`);
        } else {
          console.warn('⚠️ Pas de profile_id');
        }
        break;
        
      default:
        console.log('ℹ️ Type de notification non géré:', data.type);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      default:
        return '🔔';
    }
  };

  const getErrorMessage = () => {
    switch (errorType) {
      case 'session_expired':
        return '🔐';
      case 'forbidden':
        return '🚫';
      case 'server_error':
        return '🔧';
      case 'load_error':
        return '⚠️';
      default:
        return '❌';
    }
  };

  useEffect(() => {
    if (!userToken) {
      setLoading(false);
      setErrorType('login_required');
      setError(t('notifications.errors.loginRequired'));
      return;
    }

    fetchNotifications();
    
    // Polling toutes les 30 secondes pour les nouvelles notifications
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userToken]);

  // Rendu pour l'état de chargement
  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="spinner"></div>
        <p>{t('notifications.loading')}</p>
      </div>
    );
  }

  // Rendu pour les erreurs
  if (error) {
    return (
      <div className="notifications-error">
        <div className="notifications-error-icon">
          {getErrorMessage()}
        </div>
        <p>{error}</p>
        
        {errorType === 'session_expired' && (
          <button 
            className="notifications-error-btn"
            onClick={() => window.location.href = '/login'}
          >
            {t('auth.login')}
          </button>
        )}
        
        {errorType === 'login_required' && (
          <button 
            className="notifications-error-btn"
            onClick={() => window.location.href = '/login'}
          >
            {t('auth.login')}
          </button>
        )}
        
        {(errorType === 'load_error' || errorType === 'server_error') && (
          <button 
            className="notifications-error-btn"
            onClick={() => {
              setError(null);
              setErrorType(null);
              fetchNotifications();
            }}
          >
            {t('notifications.retry')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>
          {t('notifications.title')}
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </h2>
        
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="mark-all-read">
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-notifications">
          <p>{t('notifications.empty')}</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => {
            const { data, created_at, read_at } = notification;
            const isUnread = !read_at;
            
            return (
              <div
                key={notification.id}
                className={`notification-item ${isUnread ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
                style={{ cursor: 'pointer' }}
              >
                <div className="notification-avatar">
                  {data.actor_avatar ? (
                    <img
                      src={data.actor_avatar}
                      alt={data.actor_name || t('notifications.defaultAvatar')}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/120";
                      }}
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {data.actor_name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                
                <div className="notification-content">
                  <div className="notification-message">
                    <span className="notification-icon">
                      {getNotificationIcon(data.type)}
                    </span>
                    <strong>{data.actor_name || t('notifications.defaultUser')}</strong>{' '}
                    {data.message}
                  </div>
                  
                  <div className="notification-time">
                    {new Date(created_at).toLocaleString(t('notifications.locale'), {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  
                  {(data.post_title || data.experience_title) && (
                    <div className="notification-context">
                      "{data.post_title?.substring(0, 60) || data.experience_title?.substring(0, 60)}"
                    </div>
                  )}
                </div>
                
                {isUnread && <div className="unread-dot" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;



