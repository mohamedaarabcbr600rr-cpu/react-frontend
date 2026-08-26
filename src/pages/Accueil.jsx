import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

// Components
import AddExperience from '../components/AddExperience';
import PostCard from '../components/PostCard';
import LeftProfileColumn from '../components/LeftProfileColumn';
import RightColumn from '../components/RightColumn';
import ChallengeAndHelp from '../components/ChallengeAndHelp';
import AvatarBorder from '../components/AvatarBorder';
// CSS global de la page
import './Accueil.css';
import '../styles/global.css';

// ─── SVG Icon Components ───────────────────────────────────────────────────────

const IconUser = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const IconCamera = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconCalendar = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconPen = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

const IconRocket = ({ size = 40, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const IconFileText = ({ size = 40, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconShare = ({ size = 40, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IconChip = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
    <rect x="10" y="10" width="4" height="4" rx="0.5" />
    <path d="M9 2v3M12 2v3M15 2v3" />
    <path d="M9 19v3M12 19v3M15 19v3" />
    <path d="M2 9h3M2 12h3M2 15h3" />
    <path d="M19 9h3M19 12h3M19 15h3" />
  </svg>
);

const IconChat = ({ size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconQuiz = ({ size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M9 8h6M9 12h6" />
    <path d="M9 16l1.5 1.5L14 14" />
  </svg>
);

const IconTrophy = ({ size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M8 21h8M12 17v4" />
    <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4a2 2 0 0 0 2 4M17 6h3a2 2 0 0 1-2 4" />
  </svg>
);

const IconSparkle = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 2.5c.4 0 .74.27.85.65l1.44 5.06 5.06 1.44a.88.88 0 0 1 0 1.7l-5.06 1.44-1.44 5.06a.88.88 0 0 1-1.7 0l-1.44-5.06-5.06-1.44a.88.88 0 0 1 0-1.7l5.06-1.44 1.44-5.06c.11-.38.45-.65.85-.65z" />
  </svg>
);


// ──────────────────────────────────────────────────────────────────────────────

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
  scrollToExpId = null,

  // ✅ Pagination / scroll infini
  loadMoreExperiences,
  hasMore = false,
  loadingMore = false,
  initialLoading = false,
}) => {
  const [showAddPost, setShowAddPost] = useState(false);
  const composerRef = useRef(null);
  const [avatarError, setAvatarError] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ✅ Sentinelle pour le scroll infini (uniquement pertinent sur l'onglet "Tout")
  const observerTarget = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Scroll infini : dès que la sentinelle entre dans le viewport, on charge la page suivante
  useEffect(() => {
    if (filter !== 'all' || !hasMore || !loadMoreExperiences) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          loadMoreExperiences();
        }
      },
      { rootMargin: '300px' } // déclenche un peu avant d'arriver en bas
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [filter, hasMore, loadingMore, loadMoreExperiences]);

  // Effet pour scroller vers une expérience spécifique
  useEffect(() => {
    if (scrollToExpId) {
      setFilter('all');

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

      requestAnimationFrame(() => {
        setTimeout(() => tryScroll(), 300);
      });
    }
  }, [scrollToExpId]);

  const handlePostInputClick = () => {
    if (user) {
      setShowAddPost(true);
      setTimeout(() => {
        composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
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

  // ✅ Avatar utilisateur (composer) avec bordure dorée selon referral_count, comme dans PostCard
  const renderComposerAvatar = () => {
    const inner = user && user.profile_pic && !avatarError ? (
      <img
        src={user.profile_pic?.startsWith('http') ? user.profile_pic : `${import.meta.env.VITE_API_URL}${user.profile_pic}`}
        alt={user.name}
        className="create-post__avatar-image"
        onError={() => setAvatarError(true)}
      />
    ) : (
      user
        ? getInitials(user.name)
        : <IconUser size={22} color="#6b7280" />
    );

    return (
      <AvatarBorder referralCount={user?.referral_count} size={40}>
        {inner}
      </AvatarBorder>
    );
  };

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
        {/* AI Hero - Greeting + Quick Actions */}
        <div className="ai-hero">
          <div className="ai-hero__intro">
            <div className="ai-hero__mascot" aria-hidden="true">
  <span className="ai-hero__mascot-ring" />
  <IconChip size={24} color="#f7ef06" />
</div>
            <div className="ai-hero__text">
              <h2 className="ai-hero__greeting">
  {t("home.aiHero.greeting")}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
  <span className="ai-hero__sparkle">
    <IconSparkle size={16} color="#6366f1" />
  </span>
</h2>
              <p className="ai-hero__subtitle">{t("home.aiHero.subtitle")}</p>
            </div>
          </div>

          <div className="ai-hero__actions">
            <button className="ai-tile ai-tile--blue" onClick={() => (user ? navigate('/ai', { state: { initialTab: 'summary' } }) : openLogin())}>
              <span className="ai-tile__icon"><IconFileText size={22} color="#2563eb" /></span>
              <span className="ai-tile__title">{t("home.aiHero.tiles.summary.title")}</span>
              <span className="ai-tile__subtitle">{t("home.aiHero.tiles.summary.subtitle")}</span>
            </button>

            <button className="ai-tile ai-tile--green" onClick={() => (user ? navigate('/ai', { state: { initialTab: 'qcm' } }) : openLogin())}>
              <span className="ai-tile__icon"><IconQuiz size={22} color="#16a34a" /></span>
              <span className="ai-tile__title">{t("home.aiHero.tiles.quiz.title")}</span>
              <span className="ai-tile__subtitle">{t("home.aiHero.tiles.quiz.subtitle")}</span>
            </button>

            <button className="ai-tile ai-tile--violet" onClick={() => (user ? navigate('/ai', { state: { initialTab: 'chat' } }) : openLogin())}>
              <span className="ai-tile__icon"><IconChat size={22} color="#7c3aed" /></span>
              <span className="ai-tile__title">{t("home.aiHero.tiles.chat.title")}</span>
              <span className="ai-tile__subtitle">{t("home.aiHero.tiles.chat.subtitle")}</span>
            </button>

            <button className="ai-tile ai-tile--amber" onClick={() => (user ? navigate('/ai', { state: { initialTab: 'coach' } }) : openLogin())}>
              <span className="ai-tile__icon"><IconTrophy size={22} color="#d97706" /></span>
              <span className="ai-tile__title">{t("home.aiHero.tiles.coach.title")}</span>
              <span className="ai-tile__subtitle">{t("home.aiHero.tiles.coach.subtitle")}</span>
            </button>
          </div>
        </div>

        {/* Create Post Card */}
        <div className="create-post" ref={composerRef}>
          <div className="create-post__header">
            <div
              className="create-post__avatar"
              onClick={user ? onProfileClick : openLogin}
              aria-label={user ? user.name : t("home.loginToPost")}
            >
              {renderComposerAvatar()}
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
              <span className="create-post__action-icon">
                <IconCamera size={18} color="#0a66c2" />
              </span>
              <span>{t("home.actions.media")}</span>
            </button>
            <button className="create-post__action">
              <span className="create-post__action-icon">
                <IconCalendar size={18} color="#e67e22" />
              </span>
              <span>{t("home.actions.event")}</span>
            </button>
            <button className="create-post__action">
              <span className="create-post__action-icon">
                <IconPen size={18} color="#27ae60" />
              </span>
              <span>{t("home.actions.write")}</span>
            </button>
          </div>
        </div>





        {/* Mobile-only: Challenge + Help cards (desktop shows these in RightColumn) */}
        {isMobile && (
          <div className="mobile-challenge-stack">
            <ChallengeAndHelp user={user} openLogin={openLogin} onOpenComposer={handlePostInputClick} />
          </div>
        )}

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
          {initialLoading && filteredExperiences.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
              {t("home.loadingPosts")}
            </div>
          ) : filteredExperiences.length > 0 ? (
            <>
              {filteredExperiences.map(exp => (
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
              ))}

              {/* ✅ Sentinelle invisible pour le scroll infini (onglet "Tout" seulement) */}
              {filter === 'all' && hasMore && (
                <div ref={observerTarget} style={{ height: '1px' }} />
              )}

              {/* ✅ Indicateur de chargement pendant qu'on récupère la page suivante */}
              {filter === 'all' && loadingMore && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  {t("home.loadingMorePosts")}
                </div>
              )}

              {/* ✅ Bouton "Voir plus" en secours (au cas où le scroll infini ne déclenche pas) */}
              {filter === 'all' && !loadingMore && hasMore && (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <button
                    onClick={loadMoreExperiences}
                    style={{
                      background: '#f0f2f5',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '10px 24px',
                      fontWeight: 600,
                      color: '#0a66c2',
                      cursor: 'pointer',
                    }}
                  >
                    {t("home.seeMore")}
                  </button>
                </div>
              )}

              {/* ✅ Message de fin de feed */}
              {filter === 'all' && !hasMore && (
                <div style={{ textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: '14px' }}>
                  {t("home.feedEnd")}
                </div>
              )}
            </>
          ) : (
            <div className="feed__empty">
              {filter === 'my' ? (
                <>
                  <span className="feed__empty-icon">
                    <IconFileText size={40} color="#9ca3af" />
                  </span>
                  <h3 className="feed__empty-title">
                    {t("home.empty.myPosts.title")}
                  </h3>
                  <p className="feed__empty-text">
                    {t("home.empty.myPosts.text")}
                  </p>
                </>
              ) : filter === 'shared' ? (
                <>
                  <span className="feed__empty-icon">
                    <IconShare size={40} color="#9ca3af" />
                  </span>
                  <h3 className="feed__empty-title">
                    {t("home.empty.shared.title")}
                  </h3>
                  <p className="feed__empty-text">
                    {t("home.empty.shared.text")}
                  </p>
                </>
              ) : (
                <>
                  <span className="feed__empty-icon">
                    <IconRocket size={40} color="#9ca3af" />
                  </span>
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
          onOpenComposer={handlePostInputClick}
        />
      )}
    </div>
  );
};

export default Accueil;