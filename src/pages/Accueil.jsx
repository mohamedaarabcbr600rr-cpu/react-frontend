import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from "axios";

// Components
import AddExperience from '../components/AddExperience';
import PostCard from '../components/PostCard';
import LeftProfileColumn from '../components/LeftProfileColumn';
import RightColumn from '../components/RightColumn';

// CSS global de la page
import './Accueil.css';
import '../styles/global.css';


const Accueil = ({
  user = null,
  experiences = [],
  myExperiences = [],
  onAddExperience,
  onLike,
  onComment,
  onShare,
  onDeleteComment,
  onSend,
  commentTexts,
  setCommentTexts,
  activeCommentId,
  setActiveCommentId,
  hasUserLiked,
  getUserReaction,
  getInitials,
  onProfileClick,
  openLogin,
  openRegister,
  friends = [],
  shareUsers = [],
  setExperiences,
  scrollToExpId = null
}) => {
  const [showAddPost, setShowAddPost] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { t } = useTranslation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effet pour scroller vers une expérience spécifique
  useEffect(() => {
    if (scrollToExpId) {
      // Force le filtre à 'all' pour voir toutes les publications
      setFilter('all');
      
      // Attend que le DOM soit complètement mis à jour
      const tryScroll = (attempts = 0) => {
        const element = document.getElementById(`experience-${scrollToExpId}`);
        console.log(`🔍 Tentative ${attempts + 1}: recherche experience-${scrollToExpId}`, element);
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.boxShadow = '0 0 0 3px #1877f2';
          element.style.transition = 'box-shadow 0.3s';
          setTimeout(() => {
            element.style.boxShadow = '';
          }, 3000);
        } else if (attempts < 10) {
          setTimeout(() => tryScroll(attempts + 1), 800);
        } else {
          console.error('❌ Élément introuvable après 10 tentatives');
          console.log('📋 Expériences affichées:', 
            document.querySelectorAll('[id^="experience-"]').length,
            'éléments trouvés dans le DOM'
          );
          console.log('🔍 IDs disponibles:', 
            Array.from(document.querySelectorAll('[id^="experience-"]')).map(el => el.id)
          );
          console.log('🎯 ID recherché:', `experience-${scrollToExpId}`);
        }
      };
      
      // Premier essai après 800ms (laisser plus de temps au rendu)
      requestAnimationFrame(() => {
        setTimeout(() => tryScroll(), 300);
      });
    }
  }, [scrollToExpId]);

  const handlePostInputClick = () => {
    if (user) {
      setShowAddPost(!showAddPost);
    } else {
      openLogin();
    }
  };

  const handleLikeClick = (expId, reactionType = 'like') => {
    if (!user) {
      openLogin();
      return;
    }
    onLike(expId, reactionType);
  };

  const handleCommentClick = (expId) => {
    if (!user) {
      openLogin();
      return;
    }
    onComment(expId);
    setActiveCommentId(expId);
  };

  const handleShareClick = (expId) => {
    if (!user) {
      openLogin();
      return;
    }
    onShare(expId);
  };

  const getFilteredExperiences = () => {
    if (filter === 'my') {
      return myExperiences;
    } else if (filter === 'shared') {
      return experiences.filter(exp => exp.shared_from !== null);
    } else {
      return experiences;
    }
  };

  const filteredExperiences = getFilteredExperiences();

  return (
    <div className="home-layout">
      {/* Left Column - Desktop Only */}
      {!isMobile && (
        <LeftProfileColumn
          user={user}
          getInitials={getInitials}
          onProfileClick={onProfileClick}
          openLogin={openLogin}
        />
      )}

      {/* Center Column - Feed */}
      <div className="home-layout__center">
        {/* Challenge Banner */}
        <div className="home-layout__banner">
          {t("home.banner")}
        </div>

        {/* Create Post Card */}
        <div className="create-post">
          <div className="create-post__header">
            <div
              className="create-post__avatar"
              onClick={user ? onProfileClick : openLogin}
            >
              {user && user.profile_pic && !avatarError ? (
                <img
                  src={`http://127.0.0.1:8000${user.profile_pic}`}
                  alt={user.name}
                  className="create-post__avatar-image"
                  onError={() => {
                    setAvatarError(true);
                  }}
                />
              ) : (
                user ? getInitials(user.name) : '👤'
              )}
            </div>
            <div
              className="create-post__input"
              onClick={handlePostInputClick}
            >
              {user ? t("home.createPostInput") : t("home.loginToPost")}
            </div>
          </div>

          {user && showAddPost && (
            <AddExperience
              onAdd={(newExp) => {
                onAddExperience(newExp);
                setShowAddPost(false);
              }}
            />
          )}

          <div className="create-post__actions">
            <button className="create-post__action">
              <span className="create-post__action-icon">📷</span>
              <span>{t("home.actions.media")}</span>
            </button>
            <button className="create-post__action">
              <span className="create-post__action-icon">📅</span>
              <span>{t("home.actions.event")}</span>
            </button>
            <button className="create-post__action">
              <span className="create-post__action-icon">✍️</span>
              <span>{t("home.actions.write")}</span>
            </button>
          </div>
        </div>

        {/* Feed Header */}
        <div className="feed__header">
          <h3 className="feed__title">
            {t("home.feedTitle")}
            {user && (
              <span className="feed__stats">
                {t("home.publicationCount", { count: filteredExperiences.length })}
              </span>
            )}
          </h3>
          <span className="feed__sort">
            {t("home.mostInteracted")}
          </span>
        </div>

        {/* Filter Tabs */}
        {user && (
          <div className="feed__tabs">
            <button
              onClick={() => setFilter('all')}
              className={`feed__tab ${filter === 'all' ? 'active' : ''}`}
            >
              {t("home.filters.all")}
            </button>
            <button
              onClick={() => setFilter('my')}
              className={`feed__tab ${filter === 'my' ? 'active' : ''}`}
            >
              {t("home.filters.my")}
            </button>
            <button
              onClick={() => setFilter('shared')}
              className={`feed__tab ${filter === 'shared' ? 'active' : ''}`}
            >
              {t("home.filters.shared")}
            </button>
          </div>
        )}

        {/* Feed */}
        <div className="feed">
          {filteredExperiences.length > 0 ? (
            filteredExperiences.map(exp => (
              <PostCard
                key={exp.id}
                experience={exp}
                user={user}
                onLike={handleLikeClick}
                onComment={handleCommentClick}
                onShare={handleShareClick}
                onDeleteComment={onDeleteComment}
                onSend={onSend}
                commentTexts={commentTexts}
                setCommentTexts={setCommentTexts}
                activeCommentId={activeCommentId}
                setActiveCommentId={setActiveCommentId}
                hasUserLiked={hasUserLiked}
                getUserReaction={getUserReaction}
                getInitials={getInitials}
                isOwnPost={exp.user_id === user?.id}
                friends={friends}
                shareUsers={shareUsers}
              />
            ))
          ) : (
            <div className="feed__empty">
              {filter === 'my' ? (
                <>
                  <span className="feed__empty-icon">📝</span>
                  <h3 className="feed__empty-title">
                    {t("home.empty.myPosts.title")}
                  </h3>
                  <p className="feed__empty-text">
                    {t("home.empty.myPosts.text")}
                  </p>
                </>
              ) : filter === 'shared' ? (
                <>
                  <span className="feed__empty-icon">🔄</span>
                  <h3 className="feed__empty-title">
                    {t("home.empty.shared.title")}
                  </h3>
                  <p className="feed__empty-text">
                    {t("home.empty.shared.text")}
                  </p>
                </>
              ) : (
                <>
                  <span className="feed__empty-icon">🚀</span>
                  <h3 className="feed__empty-title">
                    {t("home.empty.all.title")}
                  </h3>
                  <p className="feed__empty-text">
                    {t("home.empty.all.text")}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Desktop Only */}
      {!isMobile && (
        <RightColumn
          user={user}
          openLogin={openLogin}
        />
      )}
    </div>
  );
};

export default Accueil;
