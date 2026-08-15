import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '../axios';
import PostCard from '../components/PostCard';
import './Accueil.css';

const SITE_NAME = 'Studmo';
const DEFAULT_IMAGE = 'https://studmo.com/og-image.png';

const stripHtml = (str = '') => str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const truncate = (str = '', max = 155) => {
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + '…';
};

const setMetaTag = (attr, key, content) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setCanonical = (url) => {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
};

const setJsonLd = (data) => {
  let el = document.getElementById('post-jsonld');
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'post-jsonld';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

const removeJsonLd = () => {
  const el = document.getElementById('post-jsonld');
  if (el) el.remove();
};

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

  // ── SEO : title, meta description, canonical, OG, Twitter, JSON-LD ──
  useEffect(() => {
    if (!experience) return;

    const url = `https://studmo.com/post/${experience.id}`;
    const rawTitle = experience.title?.trim() || stripHtml(experience.content || '').slice(0, 60);
    const title = rawTitle ? `${rawTitle} | ${SITE_NAME}` : `${SITE_NAME} — Connect. Learn. Grow.`;
    const description = truncate(stripHtml(experience.content || experience.title || ''));
    const image = experience.medias?.[0]?.url || experience.media_url || DEFAULT_IMAGE;
    const authorName = experience.user?.name || 'Studmo';
    const publishedAt = experience.created_at;

    const previousTitle = document.title;
    document.title = title;

    setMetaTag('name', 'description', description);
    setCanonical(url);

    setMetaTag('property', 'og:type', 'article');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:image', image);

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);

    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'SocialMediaPosting',
      headline: rawTitle || undefined,
      articleBody: experience.content || undefined,
      datePublished: publishedAt || undefined,
      dateModified: experience.updated_at || publishedAt || undefined,
      author: { '@type': 'Person', name: authorName },
      publisher: { '@type': 'Organization', name: 'Studmo', url: 'https://studmo.com' },
      url,
      image: image || undefined,
    });

    return () => {
      document.title = previousTitle;
      removeJsonLd();
    };
  }, [experience]);

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