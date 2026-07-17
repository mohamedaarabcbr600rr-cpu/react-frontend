import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "../axios";
import './RightColumn.css';

const IconFlame = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c0-1-.5-2-1-3 2 1 3 3.5 3 6a6 6 0 0 1-12 0c0-4 3-6 4-10z" />
  </svg>
);

const IconBrain = ({ size = 32, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M9.5 3a3.5 3.5 0 0 0-3.5 3.5c0 .3 0 .6.1.9A3 3 0 0 0 4 10a3 3 0 0 0 1.3 2.5A3.5 3.5 0 0 0 5 14a3.5 3.5 0 0 0 3.5 3.5V21" />
    <path d="M14.5 3A3.5 3.5 0 0 1 18 6.5c0 .3 0 .6-.1.9A3 3 0 0 1 20 10a3 3 0 0 1-1.3 2.5A3.5 3.5 0 0 1 19 14a3.5 3.5 0 0 1-3.5 3.5V21" />
    <path d="M9.5 3v18M14.5 3v18" />
  </svg>
);

const IconRobotSmall = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <circle cx="9" cy="14" r="1.2" fill={color} stroke="none" />
    <circle cx="15" cy="14" r="1.2" fill={color} stroke="none" />
    <path d="M12 8V4" />
    <circle cx="12" cy="3" r="1" fill={color} stroke="none" />
  </svg>
);

const IconArrowRight = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ChallengeAndHelp = ({ user, openLogin, onOpenComposer }) => {
  const [challengeData, setChallengeData] = useState({ count: 0, avatars: [] });
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchChallengeParticipants = async () => {
      try {
        const res = await axios.get('/api/challenge/participants');
        setChallengeData(res.data);
      } catch (err) {
        console.error("Erreur participants défi:", err);
      }
    };
    fetchChallengeParticipants();
  }, []);

  const getImageUrl = (profilePic) => {
    if (!profilePic) return null;
    if (profilePic.startsWith('http://') || profilePic.startsWith('https://')) return profilePic;
    if (profilePic.startsWith('/storage')) return `${import.meta.env.VITE_API_URL}${profilePic}`;
    if (profilePic.startsWith('storage/')) return `${import.meta.env.VITE_API_URL}/${profilePic}`;
    return `${import.meta.env.VITE_API_URL}/storage/${profilePic}`;
  };

  const getAvatarUrl = (name) => {
    const encodedName = encodeURIComponent(name || 'User');
    return `https://ui-avatars.com/api/?background=0a66c2&color=fff&rounded=true&size=48&bold=true&name=${encodedName}`;
  };

  return (
    <>
      {/* Défi du jour */}
      <div className="challenge-card">
        <div className="challenge-card__header">
          <span className="challenge-card__title">
            <IconFlame size={18} color="#ea580c" />
            {t("rightColumn.challengeTitle", "Défi du jour")}
          </span>
          <span
            className="challenge-card__view-all"
            onClick={() => user ? navigate('/reseau') : openLogin()}
          >
            {t("rightColumn.viewAll")}
          </span>
        </div>

        <div className="challenge-card__body">
          <div className="challenge-card__icon">
            <IconBrain size={28} color="#a855f7" />
          </div>
          <div>
            <div className="challenge-card__body-title">
              {t("rightColumn.challengeBodyTitle", "Explique une leçon en 5 lignes seulement")}
            </div>
            <div className="challenge-card__body-text">
              {t("rightColumn.challengeBodyText", "Partage ton explication et gagne plus d'interactions !")}
            </div>
          </div>
        </div>

        {challengeData.count > 0 && (
          <div className="challenge-card__participants">
            <div className="challenge-card__avatars">
              {challengeData.avatars.map((p) => (
                <img
                  key={p.id}
                  src={p.profile_pic ? getImageUrl(p.profile_pic) : getAvatarUrl(p.name)}
                  alt={p.name}
                  className="challenge-card__avatar"
                />
              ))}
            </div>
            <span className="challenge-card__participants-text">
              {t("rightColumn.participantsCount", "{{count}} ont participé", { count: challengeData.count })}
            </span>
          </div>
        )}

        <button
          className="challenge-card__cta"
          onClick={() => user ? onOpenComposer?.() : openLogin()}
        >
          {t("rightColumn.participate", "Participer maintenant")}
        </button>
      </div>

      {/* Besoin d'aide ? */}
      <div
        className="help-card"
        onClick={() => user ? navigate('/ai', { state: { initialTab: 'chat' } }) : openLogin()}
      >
        <div className="help-card__icon">
          <IconRobotSmall size={22} color="#ffffff" />
        </div>
        <div className="help-card__text">
          <div className="help-card__title">
            {t("rightColumn.needHelp", "Besoin d'aide ?")}
          </div>
          <div className="help-card__subtitle">
            {t("rightColumn.needHelpText", "Pose n'importe quelle question à notre IA, elle est là pour toi.")}
          </div>
          <span className="help-card__link">
            {t("rightColumn.askAI", "Demander à l'IA")} <IconArrowRight size={12} color="#4f46e5" />
          </span>
        </div>
      </div>
    </>
  );
};

export default ChallengeAndHelp;