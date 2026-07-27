import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Messagerie from "./Messagerie";
import GroupsPanel from "./groups/GroupsPanel";
import "./MessagingHub.css";

const MessagingHub = ({ authUserId }) => {
  const [activeSection, setActiveSection] = useState(() =>
    localStorage.getItem('pending_group_invite') ? "groups" : "messages"
  ); // "messages" | "groups"
  const { t } = useTranslation();

  return (
    <div className="msg-hub-root">
      <div className="msg-hub-tabs">
        <button
          className={`msg-hub-tab ${activeSection === "messages" ? "active" : ""}`}
          onClick={() => setActiveSection("messages")}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {t('messagingHub.messages', 'Messages')}
        </button>
        <button
          className={`msg-hub-tab ${activeSection === "groups" ? "active" : ""}`}
          onClick={() => setActiveSection("groups")}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {t('messagingHub.groups', 'Groups')}
        </button>
      </div>

      <div className="msg-hub-content">
        {activeSection === "messages" && (
          <>
            <Messagerie authUserId={authUserId} />
            {/* Mobile only: floating "Groups" tab overlaid next to Messagerie's own header,
                since msg-hub-tabs is hidden on mobile to avoid the duplicate header */}
            <button
              className="msg-hub-mobile-groups-tab"
              onClick={() => setActiveSection("groups")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {t('messagingHub.groups', 'Groups')}
            </button>
          </>
        )}
        {activeSection === "groups" && <GroupsPanel authUserId={authUserId} />}
      </div>
    </div>
  );
};

export default MessagingHub;