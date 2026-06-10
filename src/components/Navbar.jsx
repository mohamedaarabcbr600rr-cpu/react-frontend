import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import { useTranslation } from "react-i18next";
import logoapp from '../assets/logoapp.jpeg';

const Navbar = ({ user, searchTerm, onSearch, onLogout, getInitials, unreadMessages = 0, unreadNotifications = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  };

  const getImageUrl = (profilePic) => {
    if (!profilePic) return null;
    if (profilePic.startsWith('http')) return profilePic;
    const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    if (profilePic.startsWith('/storage')) return `${base}${profilePic}`;
    return `${base}/storage/${profilePic}`;
  };

  const getPathFromId = (id) => {
    const pathMap = {
      accueil: '/',
      reseau: '/reseau',
      'focus-hub': '/focus-hub',
      messagerie: '/messagerie',
      notifications: '/notifications',
      ai: '/ai',
      profile: '/profile'
    };
    return pathMap[id] || '/';
  };

  const isActive = (id) => {
    const pathMap = {
      accueil: '/',
      reseau: '/reseau',
      'focus-hub': '/focus-hub',
      messagerie: '/messagerie',
      notifications: '/notifications',
      ai: '/ai',
      profile: '/profile'
    };
    return location.pathname === pathMap[id];
  };

  const navItems = useMemo(() => [
    { id: 'accueil',       icon: 'ti-home',      label: t('nav.home') },
    { id: 'reseau',        icon: 'ti-users',     label: t('nav.network') },
    { id: 'focus-hub',     icon: 'ti-dashboard', label: t('nav.focus') },
    { id: 'messagerie',    icon: 'ti-message',   label: t('nav.messages') },
    { id: 'notifications', icon: 'ti-bell',      label: t('nav.notifications') },
    { id: 'ai',            icon: 'ti-robot',     label: t('nav.ai') },
  ], [i18n.language]);

  const mobileNavItems = [
    { id: 'accueil',       icon: 'ti-home',      label: t('nav.home') },
    { id: 'reseau',        icon: 'ti-users',     label: t('nav.network') },
    { id: 'focus-hub',     icon: 'ti-dashboard', label: t('nav.focus') },
    { id: 'messagerie',    icon: 'ti-message',   label: t('nav.messages') },
    { id: 'ai',            icon: 'ti-robot',     label: t('nav.ai') },
    { id: 'notifications', icon: 'ti-bell',      label: t('nav.notifications') },
  ];

  const handleNavigation = (id) => {
    navigate(getPathFromId(id));
  };

  return (
    <>
      {/* ── TOP NAVBAR ── */}
      <div className="navbar">

        {/* LEFT : logo + search */}
        <div className="navbar__left">
          <img
            src={logoapp}
            alt="Talib Logo"
            className="navbar__logo"
            onClick={() => handleNavigation('accueil')}
            style={{ width: '40px', height: '40px', cursor: 'pointer', objectFit: 'contain' }}
          />
          <div className="navbar__search">
            <i className="ti ti-search navbar__search-icon" />
            <input
              className="navbar__search-input"
              type="text"
              placeholder={t('search') || "Search"}
              value={searchTerm}
              onChange={onSearch}
            />
          </div>
        </div>

        {/* RIGHT : desktop */}
        <div className="navbar__right">
          {user ? (
            <div className="navbar__items">
              {/* Profile */}
              <div
                className={`navbar__item ${isActive('profile') ? 'active' : ''}`}
                onClick={() => handleNavigation('profile')}
              >
                <div className="navbar__profile-badge">
                  {user.profile_pic ? (
                    <img
                      src={getImageUrl(user.profile_pic)}
                      alt={user.name}
                      className="navbar__profile-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.textContent = getInitials(user.name);
                      }}
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <span className="navbar__item-label">{t('nav.profile')}</span>
              </div>

              {/* Nav items */}
              {navItems.map(item => (
                <div
                  key={item.id}
                  className={`navbar__item ${isActive(item.id) ? 'active' : ''} ${item.id === 'focus-hub' ? 'focus-hub-highlight' : ''}`}
                  onClick={() => handleNavigation(item.id)}
                >
                  <div style={{ position: 'relative' }}>
                    <i className={`ti ${item.icon} navbar__item-icon`} />
                    {item.id === 'messagerie' && unreadMessages > 0 && (
                      <span style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        background: 'red', color: 'white', borderRadius: '50%',
                        width: '16px', height: '16px', fontSize: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>{unreadMessages}</span>
                    )}
                    {item.id === 'notifications' && unreadNotifications > 0 && (
                      <span style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        background: 'red', color: 'white', borderRadius: '50%',
                        width: '16px', height: '16px', fontSize: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>{unreadNotifications}</span>
                    )}
                  </div>
                  <span className="navbar__item-label">{item.label}</span>
                </div>
              ))}

              {/* Language */}
              <select
                className="navbar__lang-select"
                value={i18n.language}
                onChange={(e) => changeLang(e.target.value)}
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="ar">AR</option>
              </select>

              {/* Logout */}
              <div className="navbar__item" onClick={onLogout}>
                <i className="ti ti-logout navbar__item-icon" />
                <span className="navbar__item-label">{t('nav.logout')}</span>
              </div>

              {/* Premium */}
              <div className="navbar__premium">{t('nav.premium')}</div>
            </div>
          ) : (
            /* ── Visiteur non connecté - desktop ── */
            <div className="navbar__items">
              <select
                className="navbar__lang-select"
                value={i18n.language}
                onChange={(e) => changeLang(e.target.value)}
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="ar">AR</option>
              </select>
              <div
                className={`navbar__item ${isActive('accueil') ? 'active' : ''}`}
                onClick={() => handleNavigation('accueil')}
              >
                <i className="ti ti-home navbar__item-icon" />
                <span className="navbar__item-label">{t('nav.home')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE TOP BAR ── */}
      {user && (
        <div className="navbar-mobile-top">
          <select
            className="navbar__lang-select"
            value={i18n.language}
            onChange={(e) => changeLang(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="fr">FR</option>
            <option value="ar">AR</option>
          </select>

          <div className="navbar-mobile-top__logout" onClick={onLogout}>
            <i className="ti ti-logout" />
            <span>{t('nav.logout')}</span>
          </div>

          <div className="navbar-mobile-top__premium">
            {t('nav.premium')}
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV BAR (mobile) ── */}
      <nav className="navbar-mobile-bottom">
        {user ? (
          <>
            {mobileNavItems.map(item => (
              <div
                key={item.id}
                className={`navbar-mobile-bottom__item ${isActive(item.id) ? 'active' : ''}`}
                onClick={() => handleNavigation(item.id)}
              >
                <div style={{ position: 'relative' }}>
                  <i className={`ti ${item.icon} navbar-mobile-bottom__icon`} />
                  {item.id === 'messagerie' && unreadMessages > 0 && (
                    <span className="navbar-mobile-bottom__badge">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                  {item.id === 'notifications' && unreadNotifications > 0 && (
                    <span className="navbar-mobile-bottom__badge">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </div>
                <span className="navbar-mobile-bottom__label">{item.label}</span>
              </div>
            ))}

            {/* Profile avatar */}
            <div
              className={`navbar-mobile-bottom__item ${isActive('profile') ? 'active' : ''}`}
              onClick={() => handleNavigation('profile')}
            >
              <div className="navbar-mobile-bottom__avatar">
                {user.profile_pic ? (
                  <img
                    src={getImageUrl(user.profile_pic)}
                    alt={user.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.textContent = getInitials(user.name);
                    }}
                  />
                ) : (
                  getInitials(user.name)
                )}
              </div>
              <span className="navbar-mobile-bottom__label">{t('nav.profile')}</span>
            </div>
          </>
        ) : (
          /* ── Visiteur non connecté - mobile ── */
          <div
            className="navbar-mobile-bottom__item"
            onClick={() => handleNavigation('accueil')}
          >
            <i className="ti ti-home navbar-mobile-bottom__icon" />
            <span className="navbar-mobile-bottom__label">{t('nav.home')}</span>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;