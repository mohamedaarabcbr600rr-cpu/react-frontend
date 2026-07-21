import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../axios";
import './TopReferrers.css';

const IconTrophy = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 21h8M12 17v4" />
    <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4a2 2 0 0 0 2 4M17 6h3a2 2 0 0 1-2 4" />
  </svg>
);

const RANK_COLORS = {
  1: ['#fbbf24', '#f59e0b'],
  2: ['#94a3b8', '#64748b'],
  3: ['#d97706', '#92400e'],
};

const getImageUrl = (profilePic) => {
  if (!profilePic) return null;
  if (profilePic.startsWith('http')) return profilePic;
  const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  if (profilePic.startsWith('/storage')) return `${base}${profilePic}`;
  return `${base}/storage/${profilePic}`;
};

const getAvatarUrl = (name) => {
  const encodedName = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?background=0a66c2&color=fff&rounded=true&size=48&bold=true&name=${encodedName}`;
};

const TopReferrers = ({ user }) => {
  const [data, setData] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) return;
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get('/api/referral/leaderboard');
        setData(res.data);
      } catch (err) {
        console.error("Erreur leaderboard:", err);
      }
    };
    fetchLeaderboard();
  }, [user?.id]);

  if (!user || !data || data.top.length === 0) return null;

  return (
    <div className="top-referrers">
      <div className="top-referrers__header">
        <span className="top-referrers__title">
          <IconTrophy size={18} color="#d97706" /> {t('invite.topReferrers', 'Top Referrers')}
        </span>
      </div>

      <div className="top-referrers__list">
        {data.top.map((person, index) => {
          const rank = index + 1;
          const [c1, c2] = RANK_COLORS[rank] || ['#a5b4fc', '#818cf8'];
          const isMe = person.id === user.id;
          return (
            <div key={person.id} className={`top-referrer ${isMe ? 'top-referrer--me' : ''}`}>
              <div className="top-referrer__rank" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                {rank}
              </div>
              <img
                src={person.profile_pic ? getImageUrl(person.profile_pic) : getAvatarUrl(person.name)}
                alt={person.name}
                className="top-referrer__avatar"
              />
              <div className="top-referrer__info">
                <div className="top-referrer__name">
                  {person.name}{isMe && <span className="top-referrer__you-badge">{t('post.user.you', 'You')}</span>}
                </div>
                <div className="top-referrer__count">
                  {t('invite.friendsInvited', '{{count}} friends invited', { count: person.referral_count })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.you.rank > 5 && (
        <div className="top-referrers__you-row">
          <div className="top-referrer__rank top-referrer__rank--you">{data.you.rank}</div>
          <img
            src={data.you.profile_pic ? getImageUrl(data.you.profile_pic) : getAvatarUrl(data.you.name)}
            alt={data.you.name}
            className="top-referrer__avatar"
          />
          <div className="top-referrer__info">
            <div className="top-referrer__name">{t('post.user.you', 'You')}</div>
            <div className="top-referrer__count">
              {t('invite.friendsInvited', '{{count}} friends invited', { count: data.you.referral_count })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopReferrers;