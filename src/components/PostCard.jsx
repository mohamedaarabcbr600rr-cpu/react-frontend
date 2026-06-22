import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '../axios';
import './PostCard.css';

const PostCard = ({
  experience,
  user,
  onLike,
  onComment,
  onShare,
  onSend,
  onDeleteComment,
  commentTexts,
  setCommentTexts,
  activeCommentId,
  setActiveCommentId,
  hasUserLiked,
  getUserReaction,
  getInitials,
  isOwnPost = false,
  friends = [],
  shareUsers = []
}) => {
  const [showComments, setShowComments] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [mediaError, setMediaError] = useState(false);
  const [modalIndex, setModalIndex] = useState(null);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReactionsList, setShowReactionsList] = useState(false);
  const [reactionsList, setReactionsList] = useState([]);
  const [loadingReactions, setLoadingReactions] = useState(false);
  const [activeReactionFilter, setActiveReactionFilter] = useState('all');
  const [copied, setCopied] = useState(false);
  const [commentReactions, setCommentReactions] = useState({});
  const [showCommentReactionMenu, setShowCommentReactionMenu] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});

  const navigate = useNavigate();
  const { t } = useTranslation();

  const userReaction = getUserReaction ? getUserReaction(experience) : null;
  const liked = hasUserLiked(experience);
  const exp = experience;

  const reactions = [
    { type: 'like',  emoji: '👍', label: t("post.reactions.like"),  color: '#1877f2' },
    { type: 'love',  emoji: '❤️', label: t("post.reactions.love"),  color: '#f33e58' },
    { type: 'haha',  emoji: '😂', label: t("post.reactions.haha"),  color: '#f7b125' },
    { type: 'wow',   emoji: '😮', label: t("post.reactions.wow"),   color: '#f7b125' },
    { type: 'sad',   emoji: '😢', label: t("post.reactions.sad"),   color: '#f7b125' },
    { type: 'angry', emoji: '😡', label: t("post.reactions.angry"), color: '#e74c3c' },
  ];

  const reactionEmojiMap  = { like:'👍', love:'❤️', haha:'😂', wow:'😮', sad:'😢', angry:'😡' };
  const reactionLabelMap  = {
    like: t("post.reactions.like"), love: t("post.reactions.love"),
    haha: t("post.reactions.haha"), wow:  t("post.reactions.wow"),
    sad:  t("post.reactions.sad"),  angry:t("post.reactions.angry"),
  };

  const getCurrentReaction = () => {
    if (!userReaction) return null;
    return reactions.find(r => r.type === userReaction) || reactions[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return t("post.time.today");
    if (diffDays < 7)  return t("post.time.daysAgo",  { count: diffDays });
    if (diffDays < 30) return t("post.time.weeksAgo", { count: Math.floor(diffDays / 7) });
    return date.toLocaleDateString('fr-FR');
  };

  const handleProfileClick = (userId, e) => {
    e?.stopPropagation();
    if (userId) navigate(`/profile/${userId}`);
  };

  /* ── Fetch réactions ── */
  const fetchReactionsList = async () => {
    if (loadingReactions) return;
    setLoadingReactions(true);
    setActiveReactionFilter('all');
    try {
      let reactionsData = [];
      if (exp.likes && Array.isArray(exp.likes) && exp.likes.length > 0) {
        for (const like of exp.likes) {
          let userInfo = like.user;
          if (!userInfo || !userInfo.name) {
            try {
              const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${like.user_id}`);
              userInfo = response.ok ? await response.json() : { name: t("post.user.anonymous"), profile_pic: null };
            } catch {
              userInfo = { name: t("post.user.anonymous"), profile_pic: null };
            }
          }
          reactionsData.push({
            id: like.id,
            user_id: like.user_id,
            reaction_type: like.reaction_type || 'like',
            user: { id: like.user_id, name: userInfo.name || t("post.user.anonymous"), profile_pic: userInfo.profile_pic || null }
          });
        }
      }
      setReactionsList(reactionsData);
      setShowReactionsList(true);
    } catch (error) {
      setReactionsList([]);
      setShowReactionsList(true);
    } finally {
      setLoadingReactions(false);
    }
  };

  const filteredReactions     = activeReactionFilter === 'all' ? reactionsList : reactionsList.filter(r => r.reaction_type === activeReactionFilter);
  const presentReactionTypes  = [...new Set(reactionsList.map(r => r.reaction_type))];

  /* ── Avatars ── */
  const renderAvatar = (userData) => {
    if (!userData) return null;
    const hasError = imageErrors[userData?.id];
    if (userData?.profile_pic && !hasError) {
      return (
        <img
          src={userData.profile_pic?.startsWith('http') ? userData.profile_pic : `${import.meta.env.VITE_API_URL}${userData.profile_pic}`}
          alt={userData.name}
          className="post-card__avatar-image"
          onClick={(e) => handleProfileClick(userData.id, e)}
          style={{ cursor: 'pointer' }}
          onError={() => setImageErrors(prev => ({ ...prev, [userData.id]: true }))}
        />
      );
    }
    return (
      <div className="post-card__avatar-initials" onClick={(e) => handleProfileClick(userData.id, e)} style={{ cursor: 'pointer' }}>
        {getInitials(userData?.name)}
      </div>
    );
  };

  const renderReactionAvatar = (userData) => {
    if (!userData) return <span className="reactions-modal__avatar-initials">?</span>;
    const hasError = imageErrors[userData?.id];
    if (userData?.profile_pic && !hasError) {
      return (
        <img
          src={`${import.meta.env.VITE_API_URL}${userData.profile_pic}`}
          alt={userData.name}
          className="reactions-modal__avatar-img"
          onError={() => setImageErrors(prev => ({ ...prev, [userData.id]: true }))}
        />
      );
    }
    return <span className="reactions-modal__avatar-initials">{getInitials(userData?.name)}</span>;
  };

  /* ── Handlers ── */
  const handleReactionClick  = (type)  => { onLike(exp.id, type); setShowReactionMenu(false); };
  const handleLikeClick      = ()      => { if (!user) return; if (userReaction) { onLike(exp.id, null); } else { setShowReactionMenu(!showReactionMenu); } };
  const handleCommentClick   = ()      => { if (!user) return; setActiveCommentId(exp.id); };
  const handleCommentChange  = (e)     => setCommentTexts(prev => ({ ...prev, [exp.id]: e.target.value }));
  const handleCommentSubmit  = ()      => { const text = (commentTexts[exp.id] || '').trim(); if (!text) return; if (replyingTo) { handleReply(replyingTo.commentId); } else { onComment(exp.id); } };
  const handleCancelComment  = ()      => { setActiveCommentId(null); setReplyingTo(null); setCommentTexts(prev => ({ ...prev, [exp.id]: '' })); };
  const handleKeyPress       = (e)     => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(); } };
  const toggleComments       = ()      => setShowComments(v => !v);
  const handleShare          = ()      => { onShare(exp.id); setShowShareModal(true); setTimeout(() => setShowShareModal(false), 2000); };
  const handleSendClick      = ()      => setShowSendModal(true);
  const handleCopyLink       = ()      => { navigator.clipboard.writeText(`${window.location.origin}/post/${exp.id}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleSendToFriend   = (f)     => { if (onSend) onSend(exp.id, f.id); setShowSendModal(false); };

  const handleCommentReaction = async (commentId, reactionType) => {
    if (!user) return;
    try {
      const res = await axios.post(`/api/comments/${commentId}/like`, { reaction_type: reactionType });
      setCommentReactions(prev => {
        if (res.data.status === 'unliked') { const { [commentId]: _, ...rest } = prev; return rest; }
        return { ...prev, [commentId]: reactionType };
      });
    } catch (err) { console.error(err); }
    setShowCommentReactionMenu(null);
  };

  const handleReply = async (commentId) => {
    if (!user) return;
    const content = (commentTexts[exp.id] || '').trim();
    if (!content) return;
    try {
      await axios.post(`/api/comments/${commentId}/reply`, { content });
      setCommentTexts(prev => ({ ...prev, [exp.id]: '' }));
      setReplyingTo(null);
      setActiveCommentId(null);
      if (onComment) onComment(exp.id, true);
    } catch (err) { console.error(err); }
  };

  /* ── Stats ── */
  const reactionsCount    = exp.reactions_count || {};
  const likesCount        = Object.values(reactionsCount).reduce((sum, v) => sum + v, 0);
  const topReactionEmojis = Object.entries(reactionsCount).filter(([, c]) => c > 0).sort(([, a], [, b]) => b - a).slice(0, 3).map(([type]) => reactionEmojiMap[type]);
  const commentsCount     = exp.comments?.length || 0;
  const displayComments   = showComments ? exp.comments : (exp.comments?.slice(0, 2) || []);
  const currentReaction   = getCurrentReaction();

  /* ── Galerie multi-images (style Facebook) ── */
  const renderMediaGallery = (medias, isShared = false) => {
    if (!medias || medias.length === 0) return null;
    const count = medias.length;

    const openModal = (index) => { if (!isShared) setModalIndex(index); };

    if (count === 1) {
      const m = medias[0];
      return (
        <div className="post-card__media post-card__media--single" onClick={() => openModal(0)}>
          {m.type === 'image'
            ? <img src={m.url} alt="media" className="post-card__media-image" onError={() => setMediaError(true)} />
            : <video src={m.url} controls className="post-card__media-image" />}
          {!isShared && <div className="post-card__media-overlay">{t("post.media.clickToEnlarge")}</div>}
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className="post-card__media-grid post-card__media-grid--2">
          {medias.map((m, i) => (
            <div key={i} className="post-card__media-grid-item" onClick={() => openModal(i)}>
              <img src={m.url} alt={`media-${i}`} className="post-card__media-grid-img" />
            </div>
          ))}
        </div>
      );
    }

    // 3+
    const visible  = medias.slice(0, 3);
    const overflow = count - 3;

    return (
      <div className="post-card__media-grid post-card__media-grid--3">
        {visible.map((m, i) => (
          <div
            key={i}
            className={`post-card__media-grid-item ${i === 0 ? 'post-card__media-grid-item--main' : ''}`}
            onClick={() => openModal(i)}
          >
            <img src={m.url} alt={`media-${i}`} className="post-card__media-grid-img" />
            {i === 2 && overflow > 0 && (
              <div className="post-card__media-grid-overlay">+{overflow}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div id={`experience-${exp.id}`} className="post-card">

      {/* ── Header ── */}
      <div className="post-card__header" onClick={(e) => handleProfileClick(exp.user?.id, e)} style={{ cursor: 'pointer' }}>
        <div className="post-card__avatar">{renderAvatar(exp.user)}</div>
        <div className="post-card__info">
          <div className="post-card__author-name">
            {exp.user?.name || t("post.user.anonymous")}
            {isOwnPost && <span className="post-card__author-badge">{t("post.user.you")}</span>}
          </div>
          <div className="post-card__meta">
            <span>{formatDate(exp.created_at)}</span>
            <span className="post-card__time-dot"></span>
            <span>{t("post.visibility.public")}</span>
          </div>
        </div>
        {isOwnPost && (
          <button
            className="post-card__delete-btn"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm(t("post.delete.confirm"))) return;
              try { await axios.delete(`/api/experiences/${exp.id}`); window.location.reload(); }
              catch (err) { console.error(err); alert(t("post.delete.error")); }
            }}
            title={t("post.delete.title")}
          >🗑️</button>
        )}
      </div>

      {/* ── Post partagé ── */}
      {exp.shared_from && exp.original && (
        <div className="post-card__shared">
          <div className="post-card__shared-header" onClick={(e) => handleProfileClick(exp.original.user?.id, e)} style={{ cursor: 'pointer' }}>
            <div className="post-card__shared-avatar">{renderAvatar(exp.original.user)}</div>
            <div className="post-card__shared-info">
              <div className="post-card__shared-author">{exp.original.user?.name || t("post.user.anonymous")}</div>
              <div className="post-card__shared-time">{t("post.shared.original")} • {formatDate(exp.original.created_at)}</div>
            </div>
          </div>
          <div className="post-card__shared-content">
            {exp.original.title   && <div className="post-card__shared-title">{exp.original.title}</div>}
            {exp.original.content && <div className="post-card__shared-text">{exp.original.content.length > 200 ? `${exp.original.content.substring(0, 200)}...` : exp.original.content}</div>}
            {renderMediaGallery(exp.original.medias, true)}
          </div>
        </div>
      )}

      {/* ── Contenu ── */}
      <div className="post-card__content">
        {exp.title   && <h4 className="post-card__title">{exp.title}</h4>}
        {exp.content && <p  className="post-card__text">{exp.content}</p>}
      </div>

      {/* ── Galerie médias ── */}
      {renderMediaGallery(exp.medias)}

      {/* ── Stats ── */}
      {(likesCount > 0 || commentsCount > 0) && (
        <div className="post-card__stats">
          <div className="post-card__likes" onClick={fetchReactionsList} style={{ cursor: 'pointer' }}>
            {likesCount > 0 && (<><span className="post-card__likes-icon">{topReactionEmojis.join('')}</span><span className="post-card__likes-count">{likesCount}</span></>)}
          </div>
          {commentsCount > 0 && <div className="post-card__comments-count" onClick={toggleComments}>{t("post.comments.count", { count: commentsCount })}</div>}
        </div>
      )}

      {/* ── Modal Réactions ── */}
      {showReactionsList && (
        <div className="reactions-modal-overlay" onClick={() => setShowReactionsList(false)}>
          <div className="reactions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reactions-modal__header">
              <h3 className="reactions-modal__title">{t("post.reactions.title")}</h3>
              <button className="reactions-modal__close" onClick={() => setShowReactionsList(false)}>✕</button>
            </div>
            <div className="reactions-modal__tabs">
              <button className={`reactions-modal__tab ${activeReactionFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveReactionFilter('all')}>
                {t("post.reactions.all")} · {reactionsList.length}
              </button>
              {presentReactionTypes.map(type => (
                <button key={type} className={`reactions-modal__tab ${activeReactionFilter === type ? 'active' : ''}`} onClick={() => setActiveReactionFilter(type)}>
                  {reactionEmojiMap[type]} {reactionsList.filter(r => r.reaction_type === type).length}
                </button>
              ))}
            </div>
            <div className="reactions-modal__body">
              {loadingReactions ? (
                <div className="reactions-modal__loading"><div className="reactions-modal__spinner"></div><span>{t("post.reactions.loading")}</span></div>
              ) : filteredReactions.length === 0 ? (
                <div className="reactions-modal__empty">{t("post.reactions.empty")}</div>
              ) : filteredReactions.map((reaction, index) => {
                const reactor = reaction.user || reaction;
                const rType   = reaction.reaction_type || 'like';
                const isMe    = reactor?.id === user?.id;
                return (
                  <div key={reaction.id || index} className="reactions-modal__user-item" onClick={() => { handleProfileClick(reactor?.id); setShowReactionsList(false); }}>
                    <div className="reactions-modal__user-avatar-wrapper">
                      <div className="reactions-modal__user-avatar">{renderReactionAvatar(reactor)}</div>
                      <span className="reactions-modal__reaction-badge">{reactionEmojiMap[rType]}</span>
                    </div>
                    <div className="reactions-modal__user-info">
                      <div className="reactions-modal__user-name">{reactor?.name || t("post.user.anonymous")}{isMe && <span className="reactions-modal__you-badge">{t("post.user.you")}</span>}</div>
                      <div className="reactions-modal__reaction-label">{reactionLabelMap[rType] || rType}</div>
                    </div>
                    <div className="reactions-modal__view-profile">{t("post.reactions.viewProfile")} →</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="post-card__actions">
        <div className="reaction-container">
          <button
            onClick={handleLikeClick}
            className={`reaction-trigger ${liked || userReaction ? 'active' : ''}`}
            onMouseEnter={() => setShowReactionMenu(true)}
            onMouseLeave={() => setTimeout(() => setShowReactionMenu(false), 500)}
          >
            <span>{currentReaction?.emoji || '👍'}</span>
            <span>{currentReaction?.label || t("post.reactions.like")}</span>
          </button>
          <div className={`reaction-menu ${showReactionMenu ? 'show' : ''}`} onMouseEnter={() => setShowReactionMenu(true)} onMouseLeave={() => setShowReactionMenu(false)}>
            {reactions.map((reaction) => (
              <button key={reaction.type} className={`reaction-option ${userReaction === reaction.type ? 'selected' : ''}`} onClick={() => handleReactionClick(reaction.type)}>
                {reaction.emoji}<span className="reaction-option-tooltip">{reaction.label}</span>
              </button>
            ))}
          </div>
        </div>
        <button onClick={toggleComments} className={`post-card__action ${showComments ? 'post-card__action--active' : ''}`}>
          <span className="post-card__action-icon">💬</span><span>{t("post.actions.comment")}</span>
        </button>
        <button onClick={handleShare} className="post-card__action">
          <span className="post-card__action-icon">🔄</span><span>{t("post.actions.share")}</span>
        </button>
        <button onClick={handleSendClick} className="post-card__action">
          <span className="post-card__action-icon">📤</span><span>{t("post.actions.send")}</span>
        </button>
      </div>

      {/* ── Commentaires ── */}
      {(showComments || activeCommentId === exp.id) && (
        <div className="comments-section">
          {activeCommentId === exp.id ? (
            <div className="comments-input-container">
              {replyingTo && (
                <div className="reply-indicator">
                  <span>↩ {t("post.comments.reply")} @{replyingTo.userName}</span>
                  <button onClick={() => { setReplyingTo(null); setCommentTexts(prev => ({ ...prev, [exp.id]: '' })); }}>✕</button>
                </div>
              )}
              <div className="comments-avatar">{renderAvatar(user)}</div>
              <input
                id={`comment-input-${exp.id}`}
                type="text"
                value={commentTexts[exp.id] || ''}
                onChange={handleCommentChange}
                placeholder={replyingTo ? `@${replyingTo.userName}...` : t("post.comments.placeholder")}
                className="comments-input"
                autoFocus
                onKeyPress={handleKeyPress}
              />
              <button onClick={handleCommentSubmit} className={`comments-submit-btn ${(commentTexts[exp.id] || '').trim() ? 'active' : 'disabled'}`} disabled={!(commentTexts[exp.id] || '').trim()}>
                {t("post.comments.send")}
              </button>
              <button onClick={handleCancelComment} className="comments-cancel-btn">✕</button>
            </div>
          ) : (
            <div className="comments-input-container">
              <div className="comments-avatar">{renderAvatar(user)}</div>
              <input type="text" value={commentTexts[exp.id] || ''} placeholder={t("post.comments.placeholder")} className="comments-input" onClick={handleCommentClick} readOnly />
            </div>
          )}

          {exp.comments && exp.comments.length > 0 && (
            <div className="comments-list">
              {displayComments.map((comment, index) => {
                const commentId  = comment.id || `comment-${index}`;
                const myReaction = commentReactions[commentId] || comment.likes?.find(l => l.user_id === user?.id)?.reaction_type;
                const totalLikes = comment.likes?.length || 0;
                return (
                  <div key={commentId} className="comment-item">
                    <div className="comments-avatar" onClick={(e) => handleProfileClick(comment.user?.id, e)} style={{ cursor: 'pointer' }}>
                      {renderAvatar(comment.user)}
                    </div>
                    <div className="comment-content">
                      <div className="comment-author" onClick={(e) => handleProfileClick(comment.user?.id, e)} style={{ cursor: 'pointer' }}>
                        {comment.user?.name}{comment.user?.id === user?.id && <span className="comment-author-badge">{t("post.user.you")}</span>}
                      </div>
                      <div className="comment-text">{comment.content}</div>
                      <div className="comment-date">
                        <span>{formatDate(comment.created_at)}</span>
                        <span>•</span>
                        <div className="comment-reaction-wrapper" onMouseEnter={() => setShowCommentReactionMenu(commentId)} onMouseLeave={() => setTimeout(() => setShowCommentReactionMenu(null), 400)}>
                          <button className={`comment-action-btn ${myReaction ? 'reacted' : ''}`} onClick={() => handleCommentReaction(commentId, myReaction ? null : 'like')} style={{ color: myReaction ? '#6366f1' : undefined }}>
                            {myReaction ? `${reactions.find(r => r.type === myReaction)?.emoji} ${reactions.find(r => r.type === myReaction)?.label}` : t("post.reactions.like")}
                            {totalLikes > 0 && <span className="comment-likes-count"> {totalLikes}</span>}
                          </button>
                          {showCommentReactionMenu === commentId && (
                            <div className="comment-reaction-menu" onMouseEnter={() => setShowCommentReactionMenu(commentId)} onMouseLeave={() => setShowCommentReactionMenu(null)}>
                              {reactions.map((reaction) => (
                                <button key={reaction.type} className={`comment-reaction-option ${myReaction === reaction.type ? 'selected' : ''}`} onClick={() => handleCommentReaction(commentId, reaction.type)} title={reaction.label}>
                                  {reaction.emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <span>•</span>
                        <button className="comment-action-btn" onClick={() => {
                          setReplyingTo({ commentId, userName: comment.user?.name });
                          setActiveCommentId(exp.id);
                          setCommentTexts(prev => ({ ...prev, [exp.id]: `@${comment.user?.name} ` }));
                          setTimeout(() => document.getElementById(`comment-input-${exp.id}`)?.focus(), 50);
                        }}>{t("post.comments.reply")}</button>
                        {comment.user?.id === user?.id && onDeleteComment && (<><span>•</span><button className="comment-action-btn delete" onClick={() => onDeleteComment(exp.id, comment.id)}>{t("post.comments.delete")}</button></>)}
                      </div>
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="replies-list">
                          {comment.replies.map((reply, rIndex) => (
                            <div key={reply.id || rIndex} className="reply-item">
                              <div className="reply-avatar" onClick={(e) => handleProfileClick(reply.user?.id, e)} style={{ cursor: 'pointer' }}>{renderAvatar(reply.user)}</div>
                              <div className="reply-bubble">
                                <div className="reply-author" onClick={(e) => handleProfileClick(reply.user?.id, e)} style={{ cursor: 'pointer' }}>
                                  {reply.user?.name}{reply.user?.id === user?.id && <span className="comment-author-badge">{t("post.user.you")}</span>}
                                </div>
                                <div className="reply-text">{reply.content}</div>
                              </div>
                              <div className="reply-date">{formatDate(reply.created_at)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {exp.comments.length > 2 && !showComments && (
                <div className="comments-show-more">
                  <button className="comments-show-more-btn" onClick={toggleComments}>{t("post.comments.showMore", { count: exp.comments.length - 2 })}</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Send Modal ── */}
      {showSendModal && (
        <div className="send-modal-overlay" onClick={() => setShowSendModal(false)}>
          <div className="send-modal" onClick={(e) => e.stopPropagation()}>
            <div className="send-modal__header">
              <h3 className="send-modal__title">{t("post.send.title")}</h3>
              <button className="send-modal__close" onClick={() => setShowSendModal(false)}>✕</button>
            </div>
            <div className="send-modal__body">
              <div className="copy-link-section">
                <div className="copy-link-title">{t("post.send.copyLink")}</div>
                <div className="copy-link-group">
                  <input type="text" className="copy-link-input" value={`${window.location.origin}/post/${exp.id}`} readOnly />
                  <button className={`copy-link-btn ${copied ? 'copied' : ''}`} onClick={handleCopyLink}>{copied ? t("post.send.copied") : t("post.send.copy")}</button>
                </div>
              </div>
              {friends.length > 0 && (
                <div className="friends-section">
                  <div className="friends-title">{t("post.send.sendToFriend")}</div>
                  <div className="friends-list">
                    {friends.map(friend => (
                      <div key={friend.id} className="friend-item" onClick={() => handleSendToFriend(friend)}>
                        <div className="friend-avatar">
                          {friend.profile_pic ? <img src={friend.profile_pic?.startsWith('http') ? friend.profile_pic : `${import.meta.env.VITE_API_URL}${friend.profile_pic}`} alt={friend.name} className="friend-avatar-image" /> : getInitials(friend.name)}
                        </div>
                        <div className="friend-info">
                          <div className="friend-name">{friend.name}</div>
                          <div className="friend-status">{friend.status || t("post.send.friend")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Share Modal ── */}
      {showShareModal && (
        <div className="share-modal-overlay">
          <div className="share-modal">
            <div className="share-modal__icon">✅</div>
            <div className="share-modal__text">{t("post.share.success")}</div>
            <p className="share-modal__subtext">{exp.user?.name} {t("post.share.successMessage")}</p>
          </div>
        </div>
      )}

      {/* ── Media Modal (navigation) ── */}
      {modalIndex !== null && exp.medias && exp.medias.length > 0 && (
        <div className="media-modal-overlay" onClick={() => setModalIndex(null)}>
          <button className="media-modal-close" onClick={() => setModalIndex(null)}>✕</button>
          {modalIndex > 0 && (
            <button className="media-modal-prev" onClick={(e) => { e.stopPropagation(); setModalIndex(i => i - 1); }}>‹</button>
          )}
          <div className="media-modal-content" onClick={(e) => e.stopPropagation()}>
            {exp.medias[modalIndex]?.type === 'image'
              ? <img src={exp.medias[modalIndex]?.url} alt="media" className="media-modal-image" />
              : <video src={exp.medias[modalIndex]?.url} controls className="media-modal-image" />}
            <div className="media-modal-counter">{modalIndex + 1} / {exp.medias.length}</div>
          </div>
          {modalIndex < exp.medias.length - 1 && (
            <button className="media-modal-next" onClick={(e) => { e.stopPropagation(); setModalIndex(i => i + 1); }}>›</button>
          )}
        </div>
      )}

    </div>
  );
};

export default PostCard;