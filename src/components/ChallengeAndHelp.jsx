import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "../axios";
import './RightColumn.css';

// ─── Icônes (inchangées) ─────────────────────────────────────────────────────
// (IconFlame, IconBrain, IconRobotSmall, IconArrowRight) ...

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
            {t("rightColumn.challengeTitle")}
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
              {t("rightColumn.challengeBodyTitle")}
            </div>
            <div className="challenge-card__body-text">
              {t("rightColumn.challengeBodyText")}
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
              {t("rightColumn.participantsCount", { count: challengeData.count })}
            </span>
          </div>
        )}

        <button
          className="challenge-card__cta"
          onClick={() => user ? onOpenComposer?.() : openLogin()}
        >
          {t("rightColumn.participate")}
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
            {t("rightColumn.needHelp")}
          </div>
          <div className="help-card__subtitle">
            {t("rightColumn.needHelpText")}
          </div>
          <span className="help-card__link">
            {t("rightColumn.askAI")} <IconArrowRight size={12} color="#4f46e5" />
          </span>
        </div>
      </div>
    </>
  );
};

export default ChallengeAndHelp;