import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '../axios';
import PostCard from '../components/PostCard';
import './Accueil.css';

const PostPage = ({
  user,
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
  friends = [],
  shareUsers = [],
  openLogin,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchPost = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await axios.get(`/api/experiences/${id}`);
        if (!cancelled) setExperience(res.data);
      } catch (err) {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPost();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#666' }}>
        {t('post.loading', 'Chargement de la publication...')}
      </div>
    );
  }

  if (notFound || !experience) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h3 style={{ marginBottom: 8 }}>{t('post.notFound.title', 'Publication introuvable')}</h3>
        <p style={{ color: '#666', marginBottom: 20 }}>
          {t('post.notFound.text', "Cette publication n'existe plus ou a été supprimée.")}
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#0a66c2', color: 'white', border: 'none',
            padding: '10px 24px', borderRadius: '20px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          {t('post.notFound.backHome', "Retour à l'accueil")}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '24px auto', padding: '0 16px' }}>
      <PostCard
        experience={experience}
        user={user}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onDeleteComment={onDeleteComment}
        onSend={onSend}
        commentTexts={commentTexts}
        setCommentTexts={setCommentTexts}
        activeCommentId={activeCommentId}
        setActiveCommentId={setActiveCommentId}
        hasUserLiked={hasUserLiked}
        getUserReaction={getUserReaction}
        getInitials={getInitials}
        isOwnPost={experience.user_id === user?.id}
        friends={friends}
        shareUsers={shareUsers}
      />
    </div>
  );
};

export default PostPage;